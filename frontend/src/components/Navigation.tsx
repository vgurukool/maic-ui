'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useModelSettings, AIModel } from '@/components/providers/ModelSettingsProvider'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface NavigationProps {
  user?: {
    full_name?: string
    username?: string
  }
  onLogout?: () => void
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const pathname = usePathname()
  const { selectedModel, setSelectedModel } = useModelSettings()
  const { t } = useLanguage()
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/ppt-upload', label: t('nav.ppt_upload') },
    { href: '/templates', label: t('nav.templates') },
    { href: '/public_documents', label: t('nav.public_docs') },
  ]

  const isActive = (href: string) => {
    return pathname === href
  }

  const models: { value: AIModel; label: string; description: string; provider: string }[] = [
    // Google Gemini Models
    {
      value: 'gemini-2.5-flash',
      label: t('model.gemini25_flash'),
      description: t('model.gemini25_flash_desc'),
      provider: 'Google'
    },
    {
      value: 'gemini-2.0-flash',
      label: t('model.gemini20_flash'),
      description: t('model.gemini20_flash_desc'),
      provider: 'Google'
    },
    {
      value: 'gemini-1.5-pro',
      label: t('model.gemini15_pro'),
      description: t('model.gemini15_pro_desc'),
      provider: 'Google'
    },
    {
      value: 'gemini-1.5-flash',
      label: t('model.gemini15_flash'),
      description: t('model.gemini15_flash_desc'),
      provider: 'Google'
    },
    // Anthropic Models
    {
      value: 'claude-opus-4-6',
      label: t('model.opus46'),
      description: t('model.opus46_desc'),
      provider: 'Anthropic'
    },
    {
      value: 'claude-sonnet-4-6',
      label: t('model.sonnet46'),
      description: t('model.sonnet46_desc'),
      provider: 'Anthropic'
    },
    {
      value: 'claude-haiku-4-5-20251001',
      label: t('model.haiku45'),
      description: t('model.haiku45_desc'),
      provider: 'Anthropic'
    },
    // Zhipu Models
    {
      value: 'glm-4.7',
      label: t('model.glm47'),
      description: t('model.glm47_desc'),
      provider: 'Zhipu'
    },
    {
      value: 'glm-4.6',
      label: t('model.glm46'),
      description: t('model.glm46_desc'),
      provider: 'Zhipu'
    },
  ]

  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gray-900">
              MAIC-UI
            </h1>
            <nav className="flex space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <span>{t('nav.ai_model')}:</span>
                <span className="text-blue-600 font-semibold">
                  {models.find(m => m.value === selectedModel)?.label || selectedModel}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isModelDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {/* Google Gemini Models */}
                    <div className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border-b border-emerald-100">
                      Google (Gemini)
                    </div>
                    {models.filter(m => m.provider === 'Google').map((model) => (
                      <button
                        key={model.value}
                        onClick={() => {
                          setSelectedModel(model.value)
                          setIsModelDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          selectedModel === model.value ? 'bg-emerald-50 border-l-4 border-emerald-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{model.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                          </div>
                          {selectedModel === model.value && (
                            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}

                    {/* Anthropic Models */}
                    <div className="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border-b border-t border-purple-100">
                      Anthropic (Claude)
                    </div>
                    {models.filter(m => m.provider === 'Anthropic').map((model) => (
                      <button
                        key={model.value}
                        onClick={() => {
                          setSelectedModel(model.value)
                          setIsModelDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          selectedModel === model.value ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{model.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                          </div>
                          {selectedModel === model.value && (
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}

                    {/* Zhipu Models */}
                    <div className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border-b border-t border-blue-100">
                      Zhipu AI (智谱)
                    </div>
                    {models.filter(m => m.provider === 'Zhipu').map((model) => (
                      <button
                        key={model.value}
                        onClick={() => {
                          setSelectedModel(model.value)
                          setIsModelDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          selectedModel === model.value ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{model.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                          </div>
                          {selectedModel === model.value && (
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user && (
              <span className="text-sm text-gray-600">
                {t('nav.welcome')}{user.full_name || user.username}!
              </span>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {t('nav.logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
