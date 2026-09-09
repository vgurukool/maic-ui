'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/lib/types'
import { authApi } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithKeycloak: (data: { code?: string; access_token?: string; redirect_uri?: string }) => Promise<any>
  register: (userData: any) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check if on login, register, or callback pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath === '/login' || currentPath === '/register' || currentPath.startsWith('/auth/callback')) {
          setUser(null)
          setIsLoading(false)
          return
        }
      }

      try {
        const currentUser = await authApi.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        // User is not authenticated or token is invalid
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Check authentication on mount
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const loginWithKeycloak = async (data: { code?: string; access_token?: string; redirect_uri?: string }) => {
    try {
      const response = await authApi.loginWithKeycloak(data)
      setUser(response.user)
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await authApi.register(userData)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithKeycloak,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}