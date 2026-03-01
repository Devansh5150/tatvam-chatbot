'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRemainingMessages, RATE_LIMIT } from '@/lib/utils'

export default function ProfilePage() {
    const [user, setUser] = useState({ name: 'Seeker', email: '' })
    const [isEditing, setIsEditing] = useState(false)
    const [newName, setNewName] = useState('')
    const [stats, setStats] = useState({ totalReflections: 0, daysActive: 1 })
    const [remaining, setRemaining] = useState(RATE_LIMIT)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const userStr = localStorage.getItem('tatvam_user')
        const convStr = localStorage.getItem('tatvam_conversations')

        if (userStr) {
            try {
                const parsedUser = JSON.parse(userStr)
                setUser(parsedUser)
                setNewName(parsedUser.name)
            } catch (e) { console.error(e) }
        }

        if (convStr) {
            try {
                const convs = JSON.parse(convStr)
                setStats({
                    totalReflections: convs.reduce((acc: number, c: any) => acc + c.messages.filter((m: any) => m.type === 'user').length, 0),
                    daysActive: 1 // Simplified for now
                })
            } catch (e) { console.error(e) }
        }

        setRemaining(getRemainingMessages())
        setIsLoading(false)
    }, [])

    const handleSaveName = () => {
        if (!newName.trim()) return
        const updatedUser = { ...user, name: newName.trim() }
        setUser(updatedUser)
        localStorage.setItem('tatvam_user', JSON.stringify(updatedUser))
        setIsEditing(false)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#080706] flex items-center justify-center">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#080706] text-white relative overflow-hidden flex flex-col items-center py-12 px-6">
            {/* Ambient Background Layers */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-[#2D2338]/30 blur-[120px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" />
                <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-[#1A1A2E]/40 blur-[100px] rounded-full animate-[pulse_6s_ease-in-out_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-[#C9976E]/5 blur-[150px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-2xl space-y-8">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <Link href="/dashboard" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                        <span className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-all">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </span>
                        <span className="text-xs uppercase tracking-[0.3em] font-medium">Return to Dashboard</span>
                    </Link>
                    <div className="h-px flex-1 mx-6 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                </div>

                {/* Profile Identity Card */}
                <section className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 md:p-12 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.4)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-accent/30 p-2 relative">
                                <div className="w-full h-full rounded-full bg-accent/10 flex items-center justify-center text-accent text-3xl md:text-4xl font-serif">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-[#080706] border border-white/10 rounded-full flex items-center justify-center text-accent shadow-lg">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="space-y-1">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                            autoFocus
                                            className="bg-white/5 border-b-2 border-accent text-2xl md:text-3xl font-serif text-white focus:outline-none py-1 w-full max-w-[250px]"
                                        />
                                        <button onClick={handleSaveName} className="p-2 text-accent hover:text-white transition-colors">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center md:justify-start gap-4 group">
                                        <h1 className="font-serif text-3xl md:text-4xl text-white tracking-tight">{user.name}</h1>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/30 hover:text-accent"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                                <p className="text-white/40 font-sans text-sm tracking-wide">{user.email}</p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <span className="inline-block px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] tracking-[0.2em] font-sans text-accent uppercase">
                                    AUM • Seeker
                                </span>
                                <span className="inline-block px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] tracking-[0.2em] font-sans text-white/30 uppercase">
                                    Member since Feb 2026
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Stat Card 1 */}
                    <article className="bg-white/[0.02] border border-white/10 rounded-[28px] p-8 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-accent/20 group-hover:bg-accent/40 transition-all" />
                        <div className="relative z-10 space-y-4">
                            <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase font-sans font-medium">Spiritual Milestone</p>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl md:text-5xl font-serif text-accent">{stats.totalReflections}</span>
                                <span className="text-white/20 text-sm mb-2 font-sans italic">Total Reflections</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full mt-6 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-accent/40 to-accent rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (stats.totalReflections / 50) * 100)}%` }}
                                />
                            </div>
                            <p className="text-white/20 text-[10px] tracking-wide italic">Level 1: The First Step of Surrender</p>
                        </div>
                    </article>

                    {/* Stat Card 2 */}
                    <article className="bg-[#C9976E]/[0.02] border border-[#C9976E]/15 rounded-[28px] p-8 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9976E]/5 blur-[40px] rounded-full translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 space-y-4">
                            <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase font-sans font-medium">Daily Limit</p>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl md:text-5xl font-serif text-[#C9976E]">{remaining}</span>
                                <span className="text-white/20 text-sm mb-2 font-sans italic">of {RATE_LIMIT} remaining</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                {[...Array(RATE_LIMIT)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < remaining ? 'bg-[#C9976E]' : 'bg-white/5'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-white/20 text-[10px] tracking-wide font-sans mt-2">
                                Resets every 24 hours to encourage deep focus.
                            </p>
                        </div>
                    </article>
                </div>

                {/* Footer Section */}
                <footer className="text-center pt-8 space-y-4">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto" />
                    <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-sans">
                        Tatvam • The Essence of Self
                    </p>
                </footer>
            </div>
        </main>
    )
}
