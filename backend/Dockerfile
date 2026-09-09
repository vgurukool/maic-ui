# Backend Dockerfile - Optimized for China
FROM python:3.10-slim

# Set working directory
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc \
      g++ \
      curl \
      libreoffice-nogui \
      fonts-noto-cjk \
      fonts-wqy-microhei \
      fonts-wqy-zenhei \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Python dependencies
RUN pip3 install --no-cache-dir --upgrade pip
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory for PDF processing
RUN mkdir -p uploads

# Create .env file from template if it doesn't exist
RUN if [ ! -f .env ]; then \
    echo 'DATABASE_URL=sqlite:///./learn_your_way.db' > .env && \
    echo 'SECRET_KEY=your-super-secret-key-change-this-in-production' >> .env && \
    echo 'ALGORITHM=HS256' >> .env && \
    echo 'ACCESS_TOKEN_EXPIRE_MINUTES=1440' >> .env && \
    echo 'MAX_FILE_SIZE=50MB' >> .env && \
    echo 'UPLOAD_DIR=./uploads' >> .env && \
    echo 'ENVIRONMENT=production' >> .env && \
    echo 'DEBUG=false' >> .env && \
    echo 'PORT=8000' >> .env; \
    fi

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-level", "info"]
