'use client'

import React, { useState } from 'react'
import MythicalPortal from '@/components/MythicalPortal'

export default function LoginPage() {
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [formData, setFormData] = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (error) setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
            const body = mode === 'signup'
                ? { name: formData.name, email: formData.email, password: formData.password }
                : { email: formData.email, password: formData.password }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Something went wrong')
            }

            localStorage.setItem('tatvam_token', data.access_token)
            localStorage.setItem('tatvam_user', JSON.stringify(data.user))
            window.location.href = '/dashboard'
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#080706] flex flex-col items-center justify-center relative overflow-hidden py-12">
            {/* Header - Fixed to top for better centering of the portal effect */}
            <div className="absolute top-12 z-20 w-full text-center pointer-events-none">
                <a href="/" className="inline-block pointer-events-auto">
                    <span className="font-serif text-white/40 text-sm tracking-[0.3em] uppercase hover:text-white/60 transition-colors">
                        ← Tatvam
                    </span>
                </a>
            </div>

            {/* Header Text - Above the portal to prevent clipping and keep it as a clean focus */}
            <div className="relative z-20 text-center mb-6 px-6 max-w-md mx-auto pointer-events-none">
                <h1 className="font-serif text-3xl md:text-5xl text-white font-light tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {mode === 'login' ? 'Welcome Back' : 'Begin Your Journey'}
                </h1>
                <p className="text-white/40 font-sans text-sm md:text-base mt-2">
                    {mode === 'login'
                        ? 'Return to your reflection.'
                        : 'Create an account to receive daily wisdom.'}
                </p>
                <div className="h-px w-12 bg-accent/40 mx-auto mt-6 shadow-[0_0_10px_rgba(201,151,110,0.3)]" />
            </div>

            <MythicalPortal>
                <div className="relative z-10 w-full max-w-md mx-auto px-6">
                    {/* Form Card */}
                    <div className="bg-[#1a1614]/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl">
                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-[11px] mb-2 text-white/60 font-sans font-medium tracking-[0.2em] uppercase">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 rounded-xl transition-all text-base font-sans disabled:opacity-50"
                                        placeholder="What shall we call you?"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] mb-2 text-white/60 font-sans font-medium tracking-[0.2em] uppercase">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 rounded-xl transition-all text-base font-sans disabled:opacity-50"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] mb-2 text-white/60 font-sans font-medium tracking-[0.2em] uppercase">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 rounded-xl transition-all text-base font-sans disabled:opacity-50"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-accent text-[#080706] py-4 text-sm font-bold tracking-[0.15em] uppercase rounded-xl shadow-[0_8px_30px_rgba(201,151,110,0.3)] transition-all duration-300 hover:bg-white hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-[#080706] border-t-transparent rounded-full animate-spin" />
                                        Connecting...
                                    </span>
                                ) : (
                                    mode === 'login' ? 'Enter Reflection' : 'Create Account'
                                )}
                            </button>
                        </form>

                        {/* Toggle Mode */}
                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-white/40 text-sm font-sans">
                                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                                <button
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'signup' : 'login')
                                        setError(null)
                                    }}
                                    className="ml-2 text-accent/80 hover:text-accent transition-colors font-medium"
                                >
                                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <p className="text-center mt-8 text-white/30 text-xs tracking-[0.15em] font-sans">
                        Your journey begins in silence.
                    </p>
                </div>
            </MythicalPortal>
        </main>
    )
}
