'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/components/providers/AuthProvider'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { authApi } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter password')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()
  const { language, setLanguage, t } = useLanguage()

  const languages = [
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' },
  ]

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      await login(data.email.trim(), data.password.trim())
      router.push('/dashboard')
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError(t('login.error_generic'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeycloakLogin = async () => {
    try {
      setSsoLoading(true)
      const config = await authApi.getKeycloakConfig()
      const redirectUri = window.location.origin + '/auth/callback/keycloak'
      const authUrl = `${config.auth_url}?client_id=${encodeURIComponent(
        config.client_id
      )}&response_type=code&scope=openid%20email%20profile&redirect_uri=${encodeURIComponent(
        redirectUri
      )}`
      window.location.href = authUrl
    } catch (err: any) {
      console.error('Failed to initiate Keycloak login:', err)
      setError(err.response?.data?.detail || 'Failed to connect to Keycloak SSO')
      setSsoLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[url('/images/photo0.jpg')] bg-cover bg-center bg-no-repeat">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_45%,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.15)_35%,rgba(255,255,255,0)_66%)]"
      />

      {/* Language selector in top right corner */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex gap-2 rounded-full bg-white/30 backdrop-blur-sm p-1">
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => setLanguage(lang.value as 'zh' | 'en')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                language === lang.value
                  ? 'bg-white/80 text-slate-900'
                  : 'text-white hover:bg-white/40'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-start px-5 py-12 sm:px-8 lg:px-16 xl:px-24">
        <div className="relative ml-4 w-full max-w-[560px] overflow-hidden rounded-[38px] border border-white/75 bg-white/12 p-10 shadow-[0_20px_70px_rgba(38,58,112,0.24)] backdrop-blur-2xl sm:ml-8 sm:p-12 lg:ml-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_35%,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.2)_34%,rgba(255,255,255,0.08)_66%,rgba(255,255,255,0.02)_100%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[1px] rounded-[36px] border border-white/35"
          />

          <div className="relative z-10">
            <h2 className="whitespace-nowrap text-center text-[2.5rem] font-extrabold leading-tight text-slate-900">
            {t('login.subtitle')}
            </h2>

            <p className="mt-3 text-center text-sm text-slate-700/95">
              {language === 'zh' ? '或者' : 'Or'}{' '}
              <Link href="/register" className="font-semibold text-blue-700 hover:text-blue-800">
                {language === 'zh' ? '创建新账户' : 'Create new account'}
              </Link>
            </p>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label={t('login.username')}
                type="email"
                placeholder={t('login.username_placeholder')}
                {...register('email')}
                error={errors.email?.message}
                className="h-14 rounded-full border-white/70 bg-white/46 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
              />

              <Input
                label={t('login.password')}
                type="password"
                placeholder={t('login.password_placeholder')}
                {...register('password')}
                error={errors.password?.message}
                className="h-14 rounded-full border-white/70 bg-white/46 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
              />

              {error && (
                <div className="rounded-xl border border-red-300/70 bg-red-50/85 px-4 py-3 text-red-700 backdrop-blur">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-[#2d6af5] to-[#2558dd] text-lg font-semibold text-white shadow-[0_12px_28px_rgba(45,106,245,0.35)] hover:from-[#3874f7] hover:to-[#2f61e2]"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {t('login.submit')}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300/60" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="rounded-full bg-white/60 px-3 py-0.5 text-xs font-semibold text-slate-700 backdrop-blur-sm">
                  {language === 'zh' ? '或使用单点登录' : 'Or continue with'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleKeycloakLogin}
              disabled={isLoading || ssoLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/70 bg-white/50 px-4 text-base font-semibold text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm transition hover:bg-white/80 hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] disabled:opacity-50"
            >
              {ssoLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
              ) : (
                <svg className="h-5 w-5 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              )}
              <span>Sign in with Keycloak SSO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
