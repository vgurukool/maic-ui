'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'

function KeycloakCallbackContent() {
  const searchParams = useSearchParams()
  const { loginWithKeycloak } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) {
      return
    }

    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    if (errorParam) {
      setError(errorDesc || errorParam || 'Authentication failed')
      return
    }

    if (!code) {
      setError('Missing authorization code from Keycloak')
      return
    }

    processedRef.current = true

    const handleCallback = async () => {
      try {
        const redirectUri = window.location.origin + '/auth/callback/keycloak'
        await loginWithKeycloak({
          code,
          redirect_uri: redirectUri,
        })
        window.location.href = '/dashboard'
      } catch (err: any) {
        console.error('Keycloak login error:', err)
        setError(err.response?.data?.detail || err.message || 'Keycloak authentication failed')
      }
    }

    handleCallback()
  }, [searchParams, loginWithKeycloak])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Authentication Failed</h2>
          <p className="mb-6 text-sm text-slate-300">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
        <h2 className="mb-2 text-xl font-bold">Authenticating with Keycloak SSO...</h2>
        <p className="text-sm text-slate-400">Please wait while we verify your session.</p>
      </div>
    </div>
  )
}

export default function KeycloakCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
        </div>
      }
    >
      <KeycloakCallbackContent />
    </Suspense>
  )
}
