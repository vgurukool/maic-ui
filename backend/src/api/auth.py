import os
import re
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx

from src.core.database import get_db
from src.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from src.models.user import User

router = APIRouter()
security = HTTPBearer()

# Pydantic models for request/response
class KeycloakAuthRequest(BaseModel):
    code: Optional[str] = None
    access_token: Optional[str] = None
    redirect_uri: Optional[str] = None

class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    grade_level: Optional[int] = None
    interests: Optional[list] = []
    learning_preferences: Optional[dict] = {}

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    grade_level: Optional[int]
    interests: list
    learning_preferences: dict
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Utility functions
def validate_email(email: str) -> bool:
    """Simple email validation."""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> bool:
    """Validate password strength."""
    if len(password) < 8:
        return False
    if not re.search(r"[A-Za-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True

def validate_username(username: str) -> bool:
    """Validate username format."""
    if len(username) < 3 or len(username) > 20:
        return False
    if not re.match(r"^[a-zA-Z0-9_-]+$", username):
        return False
    return True

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Dependency to get current authenticated user."""
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

# API Routes
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""

    # Validate email format
    if not validate_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )

    # Validate email uniqueness
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate username uniqueness
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Validate password strength
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain both letters and numbers"
        )

    # Validate username format
    if not validate_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)

    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        grade_level=user_data.grade_level or 0,
        interests=user_data.interests or [],
        learning_preferences=user_data.learning_preferences or {}
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=access_token_expires
    )

    user_response = UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        grade_level=new_user.grade_level,
        interests=new_user.interests or [],
        learning_preferences=new_user.learning_preferences or {},
        is_active=new_user.is_active,
        created_at=new_user.created_at.isoformat()
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token."""

    # Find user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    user_response = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        grade_level=user.grade_level,
        interests=user.interests or [],
        learning_preferences=user.learning_preferences or {},
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        grade_level=current_user.grade_level,
        interests=current_user.interests or [],
        learning_preferences=current_user.learning_preferences or {},
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat()
    )

@router.post("/verify-token")
async def verify_token_endpoint(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify if a token is valid."""
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    return {"valid": True, "payload": payload}

@router.post("/logout")
async def logout():
    """Logout endpoint (client-side token removal)."""
    return {"message": "Successfully logged out"}

@router.get("/keycloak/config")
async def get_keycloak_config():
    """Get Keycloak configuration for frontend SSO redirect."""
    keycloak_url = os.getenv("KEYCLOAK_URL", "https://vgurukool.com/keycloak").rstrip("/")
    realm = os.getenv("KEYCLOAK_REALM", "cnoe")
    client_id = os.getenv("KEYCLOAK_CLIENT_ID", "vgurukool-apps")
    return {
        "auth_url": f"{keycloak_url}/realms/{realm}/protocol/openid-connect/auth",
        "client_id": client_id,
        "realm": realm,
    }

@router.post("/keycloak", response_model=TokenResponse)
async def keycloak_login(auth_data: KeycloakAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or auto-provision user using Keycloak SSO."""
    keycloak_internal = os.getenv("KEYCLOAK_INTERNAL_URL", "").rstrip("/")
    keycloak_public = os.getenv("KEYCLOAK_URL", "https://vgurukool.com/keycloak").rstrip("/")
    keycloak_base = keycloak_internal or keycloak_public
    realm = os.getenv("KEYCLOAK_REALM", "cnoe")
    client_id = os.getenv("KEYCLOAK_CLIENT_ID", "vgurukool-apps")

    access_token = auth_data.access_token

    # 1. If authorization code is provided, exchange it for access token
    if not access_token and auth_data.code:
        token_url = f"{keycloak_base}/realms/{realm}/protocol/openid-connect/token"
        headers = {
            "Host": "vgurukool.com",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "code": auth_data.code,
            "redirect_uri": auth_data.redirect_uri or "https://maic.vgurukool.com/auth/callback/keycloak",
        }
        try:
            async with httpx.AsyncClient(verify=False) as client:
                resp = await client.post(token_url, data=data, headers=headers, timeout=15.0)
                if resp.status_code != 200:
                    # Fallback to public URL if internal URL failed
                    if keycloak_internal and keycloak_base != keycloak_public:
                        token_url_pub = f"{keycloak_public}/realms/{realm}/protocol/openid-connect/token"
                        resp = await client.post(token_url_pub, data=data, timeout=15.0)
                if resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=f"Failed to exchange Keycloak code: {resp.text}"
                    )
                token_json = resp.json()
                access_token = token_json.get("access_token")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Keycloak token exchange error: {str(e)}"
            )

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Keycloak code or access_token"
        )

    # 2. Fetch user information from Keycloak userinfo
    userinfo_url = f"{keycloak_base}/realms/{realm}/protocol/openid-connect/userinfo"
    headers = {
        "Host": "vgurukool.com",
        "Authorization": f"Bearer {access_token}",
    }
    kc_user = None
    try:
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(userinfo_url, headers=headers, timeout=15.0)
            if resp.status_code != 200 and keycloak_internal and keycloak_base != keycloak_public:
                userinfo_url_pub = f"{keycloak_public}/realms/{realm}/protocol/openid-connect/userinfo"
                resp = await client.get(userinfo_url_pub, headers={"Authorization": f"Bearer {access_token}"}, timeout=15.0)
            if resp.status_code == 200:
                kc_user = resp.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to verify Keycloak userinfo: {str(e)}"
        )

    if not kc_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Keycloak token or unable to retrieve user info"
        )

    username_pref = kc_user.get("preferred_username") or kc_user.get("sub", "")
    email = kc_user.get("email")
    if not email:
        email = f"{username_pref}@vgurukool.com"

    given_name = kc_user.get("given_name", "")
    family_name = kc_user.get("family_name", "")
    full_name = kc_user.get("name") or f"{given_name} {family_name}".strip() or username_pref

    # 3. Find or auto-provision user
    user = db.query(User).filter((User.email == email) | (User.username == username_pref)).first()
    if not user:
        user = User(
            email=email,
            username=username_pref,
            hashed_password="",
            full_name=full_name,
            grade_level=0,
            interests=[],
            learning_preferences={},
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 4. Mint native MAIC-UI JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    native_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    user_response = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        grade_level=user.grade_level,
        interests=user.interests or [],
        learning_preferences=user.learning_preferences or {},
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else ""
    )

    return TokenResponse(
        access_token=native_token,
        token_type="bearer",
        user=user_response
    )