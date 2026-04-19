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
        } catch (err) {
            setError(err.message)
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#080706] flex flex-col items-center justify-center relative overflow-hidden py-12">
            {/* Header - Fixed to top for better centering of the portal effect */}
            <div className="absolute top-10 left-10 z-20 pointer-events-none">
                <a href="/" className="inline-block pointer-events-auto" aria-label="Return to home">
                    <span className="font-serif text-foreground/40 text-[10px] md:text-sm tracking-[0.3em] uppercase hover:text-accent transition-colors">
                        ← Tatvam
                    </span>
                </a>
            </div>

            {/* Header Text - Above the portal to prevent clipping and keep it as a clean focus */}
            <div className="relative z-20 text-center mb-6 px-6 max-w-md mx-auto pointer-events-none">
                <h1 className="font-serif text-3xl md:text-5xl text-foreground font-light tracking-tight drop-shadow-[0_0_15px_rgba(201,151,110,0.2)]">
                    {mode === 'login' ? 'Welcome Back' : 'Begin Your Journey'}
                </h1>
                <div className="flex items-center justify-center gap-4 mt-4 w-full">
                    <div className="h-px flex-1 max-w-[3rem] bg-gradient-to-r from-transparent to-accent/40 shadow-[0_0_10px_rgba(201,151,110,0.3)]" aria-hidden="true" />
                    <p className="text-foreground/40 font-sans text-sm md:text-base text-center shrink-0">
                        {mode === 'login'
                            ? 'Return to your reflection.'
                            : 'Create an account to receive daily wisdom.'}
                    </p>
                    <div className="h-px flex-1 max-w-[3rem] bg-gradient-to-l from-transparent to-accent/40 shadow-[0_0_10px_rgba(201,151,110,0.3)]" aria-hidden="true" />
                </div>
            </div>

            <MythicalPortal>
                <div className="relative z-10 w-full max-w-md mx-auto px-6">
                    {/* Form Card */}
                    <div className="bg-[#1a1614]/40 backdrop-blur-xl border border-accent/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
                        {error && (
                            <div className="mb-6 bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-sm text-center" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {mode === 'signup' && (
                                <div>
                                    <label htmlFor="name" className="block text-[11px] mb-2 text-foreground/60 font-sans font-medium tracking-[0.2em] uppercase">
                                        Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                        className="w-full px-4 py-3.5 bg-accent/[0.03] border border-accent/20 text-foreground placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 rounded-xl transition-all text-base font-sans disabled:opacity-50"
                                        placeholder="What shall we call you?"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-[11px] mb-2 text-foreground/60 font-sans font-medium tracking-[0.2em] uppercase">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3.5 bg-accent/[0.03] border border-accent/20 text-foreground placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 rounded-xl transition-all text-base font-sans disabled:opacity-50"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-[11px] mb-2 text-foreground/60 font-sans font-medium tracking-[0.2em] uppercase">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                    className="w-full px-4 py-3.5 bg-accent/[0.03] border border-accent/20 text-foreground placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 rounded-xl transition-all text-base font-sans disabled:opacity-50"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-accent text-[#080706] py-4 text-sm font-bold tracking-[0.15em] uppercase rounded-xl shadow-[0_8px_30px_rgba(201,151,110,0.3)] transition-all duration-300 hover:bg-accent/80 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
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

                        {/* LLM Dev Quick Login Button */}
                        {process.env.NODE_ENV === 'development' && (
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={async () => {
                                    setIsLoading(true)
                                    setError(null)
                                    try {
                                        let response = await fetch('/api/auth/login', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: 'tatvam_llm@dev.com', password: 'tatvam123' }),
                                        })

                                        let data = await response.json()

                                        // If login fails (e.g. user doesn't exist in Supabase), seed it by signing up
                                        if (!response.ok) {
                                            response = await fetch('/api/auth/signup', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name: 'LLM Dev User', email: 'tatvam_llm@dev.com', password: 'tatvam123' }),
                                            })
                                            data = await response.json()
                                        }
                            
                                        if (!response.ok) throw new Error(data.detail || 'Something went wrong')
                            
                                        localStorage.setItem('tatvam_token', data.access_token)
                                        localStorage.setItem('tatvam_user', JSON.stringify(data.user))
                                        window.location.href = '/dashboard'
                                    } catch (err) {
                                        setError('Dev Login Failed: ' + err.message)
                                        setIsLoading(false)
                                    }
                                }}
                                className="w-full mt-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 py-3 text-xs font-bold tracking-[0.1em] uppercase rounded-xl hover:bg-indigo-500/20 active:scale-95 transition-all font-sans"
                            >
                                [DEV] Quick Login for LLM
                            </button>
                        )}

                        {/* Toggle Mode */}
                        <div className="mt-8 pt-6 border-t border-accent/5 text-center">
                            <p className="text-foreground/40 text-sm font-sans">
                                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                                <button
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'signup' : 'login')
                                        setError(null)
                                    }}
                                    className="ml-2 text-accent hover:text-accent/80 transition-colors font-medium"
                                    aria-label={mode === 'login' ? 'Switch to sign up' : 'Switch to log in'}
                                >
                                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="flex items-center justify-center gap-4 mt-8 pb-4 w-full">
                        <div className="h-px flex-1 max-w-[3rem] bg-gradient-to-r from-transparent to-accent/40 shadow-[0_0_10px_rgba(201,151,110,0.3)]" aria-hidden="true" />
                        <p className="text-center text-foreground/30 text-xs tracking-[0.15em] font-sans shrink-0">
                            Your journey begins in silence.
                        </p>
                        <div className="h-px flex-1 max-w-[3rem] bg-gradient-to-l from-transparent to-accent/40 shadow-[0_0_10px_rgba(201,151,110,0.3)]" aria-hidden="true" />
                    </div>
                </div>
            </MythicalPortal>
        </main>

    )
}
