'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import dynamic from 'next/dynamic'
import { RATE_LIMIT, getRemainingMessages, getNextResetTime, recordMessageTimestamp } from '@/lib/utils'



// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string
    type: 'shlok' | 'meaning' | 'reflection' | 'user' | 'system' | 'chat'
    content: string
    subContent?: string
    source?: string
    timestamp: Date
}

interface Conversation {
    id: string
    title: string
    messages: Message[]
    updatedAt: number
}

// ─── Animation Components ────────────────────────────────────────────────────

const WordReveal = ({ text, delay = 0 }: { text: string; delay?: number }) => {
    const words = text.split(' ')
    
    return (
        <span className="inline-block">
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                        duration: 0.4,
                        delay: delay + i * 0.03,
                        ease: [0.2, 0.65, 0.3, 0.9],
                    }}
                    className="inline-block mr-[0.25em]"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    )
}

// ─── Shlok Data ───────────────────────────────────────────────────────────────

const DAILY_SHLOKS = [
    {
        sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
        hindi: 'तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं। न तुम कर्मफल के कारण बनो, और न ही कर्म न करने में तुम्हारी आसक्ति हो।',
        english: 'You have the right to perform your actions, but you are not entitled to the fruits of those actions. Do not let the fruit be your motive, nor let yourself be attached to inaction.',
        reflection: 'What if your peace didn\'t depend on outcomes?',
        source: 'Bhagavad Gita 2.47',
    },
    {
        sanskrit: 'धर्मो रक्षति रक्षितः।',
        hindi: 'जो धर्म की रक्षा करता है, धर्म उसकी रक्षा करता है।',
        english: 'Those who protect dharma are in turn protected by dharma. Righteousness shelters the one who upholds it.',
        reflection: 'What is one small act of righteousness you can hold firm to today?',
        source: 'Mahabharata, Vana Parva',
    },
    {
        sanskrit: 'आत्मानं प्रतिकूलानि परेषां न समाचरेत्।',
        hindi: 'जो बात स्वयं को अप्रिय लगे, वह दूसरों के साथ न करें।',
        english: 'One should never do to another what one regards as hurtful to oneself. This is the essence of dharma; all other rules flow from it.',
        reflection: 'Is there someone waiting for the kindness you wish you received?',
        source: 'Ramayana, Ayodhya Kanda',
    },
]

// ─── Sidebar Types & Helpers ─────────────────────────────────────────────────

type SidebarPanel = 'bhajans' | 'shlok_guide' | 'settings' | 'history' | null

const BHAJANS = [
    { title: 'Om Namah Shivaya', artist: 'Suresh Wadkar', src: 'https://archive.org/download/OmNamahShivayaBySureshWadkar/Om%20Namah%20Shivaya%20by%20Suresh%20Wadkar.mp3' },
    { title: 'Hare Krishna Mahamantra', artist: 'Classic Chant', src: 'https://archive.org/download/HareKrishnaMahaMantra/Hare%20Krishna%20Maha%20Mantra.mp3' },
    { title: 'Gayatri Mantra', artist: 'Traditional', src: 'https://archive.org/download/GayatriMantra_201701/Gayatri%20Mantra.mp3' },
    { title: 'Hanuman Chalisa', artist: 'Gulshan Kumar', src: 'https://archive.org/download/hanumanchalisa-gulshanhkumar/Hanuman%20Chalisa%20-%20Gulshan%20Kumar.mp3' },
    { title: 'Raghupati Raghava', artist: 'Jagjit Singh', src: 'https://archive.org/download/RaghupatiRaghavaRajaRamByJagjitSingh/Raghupati%20Raghava%20Raja%20Ram%20by%20Jagjit%20Singh.mp3' },
    { title: 'Achyutam Keshavam', artist: 'Traditional', src: 'https://archive.org/download/AchyutamKeshavamKrishnaDamodaram/Achyutam%20Keshavam%20Krishna%20Damodaram.mp3' },
]

const SHLOK_GUIDE: { mood: string; emoji: string; shlok: string; source: string; meaning: string }[] = [
    { mood: 'Anxious / Stressed', emoji: '🌊', shlok: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।', source: 'Bhagavad Gita 2.48', meaning: 'Do your duty with equanimity, giving up attachment. Let go of success and failure.' },
    { mood: 'Lost / Purposeless', emoji: '🌿', shlok: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।', source: 'Bhagavad Gita 6.5', meaning: 'Elevate yourself through the power of your own mind. You are your own best friend.' },
    { mood: 'Angry / Resentful', emoji: '🔥', shlok: 'क्षमा धर्मः क्षमा सत्यं क्षमा भूतं च भावि च', source: 'Mahabharata — Udyoga Parva', meaning: 'Forgiveness is dharma. Forgiveness is truth. It is both the past and the future.' },
    { mood: 'Grieving / Sad', emoji: '🪔', shlok: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।', source: 'Bhagavad Gita 18.66', meaning: 'Surrender unto Me alone. I shall deliver you from all suffering; do not grieve.' },
    { mood: 'Procrastinating', emoji: '⚡', shlok: 'तस्मात्त्वमुत्तिष्ठ यशो लभस्व', source: 'Bhagavad Gita 11.33', meaning: 'Therefore arise and attain glory. You are but an instrument — act now.' },
    { mood: 'Overworked / Burnt out', emoji: '🌸', shlok: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।', source: 'Bhagavad Gita 2.47', meaning: 'You have the right to work, but not to its fruits. Work without craving results.' },
]

// ─── Bhajan Panel ─────────────────────────────────────────────────────────────

function BhajanPanel({ onClose, playingTrack, onToggleTrack }: { onClose: () => void; playingTrack: number | null; onToggleTrack: (i: number) => void }) {
    return (
        <div className="w-72 h-full bg-card border-r border-border flex flex-col shrink-0 z-10 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <div>
                    <h3 className="font-serif text-foreground text-base font-medium">Bhajans</h3>
                    <p className="text-muted-foreground text-xs mt-0.5 font-sans">Mind-soothing sacred music</p>
                </div>
                <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            <div className="mx-4 mt-4 px-4 py-3 bg-accent/5 border border-accent/20 rounded-2xl">
                <p className="text-accent text-xs font-sans font-medium tracking-wide">🎵 {playingTrack !== null ? 'Playing Now' : 'Select a Track'}</p>
                <p className="text-muted-foreground text-[11px] mt-1 font-sans leading-relaxed">
                    {playingTrack !== null ? `Currently listening to ${BHAJANS[playingTrack].title}` : 'Immerse yourself in sacred vibrations.'}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {BHAJANS.map((b, i) => (
                    <button
                        key={i}
                        onClick={() => onToggleTrack(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                            playingTrack === i
                                ? 'border-accent/40 bg-accent/5'
                                : 'border-border hover:border-accent/20 hover:bg-muted'
                        }`}
                    >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            playingTrack === i ? 'bg-accent/20' : 'bg-muted'
                        }`}>
                            {playingTrack === i ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-sans font-medium truncate ${ playingTrack === i ? 'text-accent' : 'text-foreground' }`}>{b.title}</p>
                            <p className="text-muted-foreground text-[11px] font-sans">{b.artist}</p>
                        </div>
                        {playingTrack === i && (
                            <div className="flex items-end gap-0.5 h-4">
                                {[1, 2, 3].map(j => (
                                    <motion.div 
                                        key={j} 
                                        animate={{ height: [8, 16, 8] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.1 }}
                                        className="w-1 bg-accent rounded-full" 
                                    />
                                ))}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Daily Shlok Guide Panel ──────────────────────────────────────────────────

function ShlokGuidePanel({ onClose, onInjectShlok }: { onClose: () => void; onInjectShlok: (s: typeof SHLOK_GUIDE[0]) => void }) {
    const [selected, setSelected] = React.useState<number | null>(null)

    return (
        <div className="w-80 h-full bg-card border-r border-border flex flex-col shrink-0 z-10 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <div>
                    <h3 className="font-serif text-foreground text-base font-medium">Daily Shlok Guide</h3>
                    <p className="text-muted-foreground text-xs mt-0.5 font-sans">Choose your mood, receive wisdom</p>
                </div>
                <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            <p className="px-5 pt-4 pb-2 text-muted-foreground text-xs font-sans">How are you feeling right now?</p>

            <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
                {SHLOK_GUIDE.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setSelected(selected === i ? null : i)}
                        className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                            selected === i ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-accent/20 hover:bg-muted'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{s.emoji}</span>
                            <span className={`text-sm font-sans font-medium ${ selected === i ? 'text-accent' : 'text-foreground' }`}>{s.mood}</span>
                        </div>
                        {selected === i && (
                            <div className="mt-2 space-y-2">
                                <p className="font-tiro text-foreground text-sm leading-relaxed">{s.shlok}</p>
                                <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">{s.source}</p>
                                <p className="text-muted-foreground text-xs font-sans leading-relaxed italic">{s.meaning}</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onInjectShlok(s); onClose() }}
                                    className="mt-1 w-full py-2 bg-[#111] text-white text-xs font-sans font-medium rounded-xl hover:bg-black/80 transition-colors"
                                >
                                    Bring this to my chat
                                </button>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

type AppTheme = 'light' | 'sepia' | 'dark'

function applyTheme(t: AppTheme) {
    const root = document.documentElement
    root.classList.remove('dark', 'sepia')
    if (t === 'dark') root.classList.add('dark')
    if (t === 'sepia') root.classList.add('sepia')
    localStorage.setItem('tatvam_theme', t)
}

function SettingsPanel({ onClose, onLogout, volume, onVolumeChange }: { onClose: () => void; onLogout: () => void; volume: number; onVolumeChange: (v: number) => void }) {
    const router = useRouter()
    const [theme, setTheme] = React.useState<AppTheme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('tatvam_theme') as AppTheme) || 'light'
        }
        return 'light'
    })

    const handleTheme = (t: AppTheme) => {
        setTheme(t)
        applyTheme(t)
    }

    const THEMES: { key: AppTheme; label: string; preview: string }[] = [
        { key: 'light', label: 'Light', preview: 'bg-white' },
        { key: 'sepia', label: 'Sepia', preview: 'bg-[#F5EDD8]' },
        { key: 'dark', label: 'Dark', preview: 'bg-[#0A0A0C]' },
    ]

    return (
        <div className="w-72 h-full bg-card border-r border-border flex flex-col shrink-0 z-10 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <div>
                    <h3 className="font-serif text-foreground text-base font-medium">Settings</h3>
                    <p className="text-muted-foreground text-xs mt-0.5 font-sans">Personalise your experience</p>
                </div>
                <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Theme */}
                <div>
                    <p className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-widest mb-3">Theme</p>
                    <div className="flex gap-2">
                        {THEMES.map(t => (
                            <button
                                key={t.key}
                                onClick={() => handleTheme(t.key)}
                                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                                    theme === t.key
                                        ? 'border-accent bg-accent/5'
                                        : 'border-border hover:border-accent/30'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full border border-border ${t.preview}`} />
                                <span className={`text-[11px] font-sans font-medium capitalize ${
                                    theme === t.key ? 'text-accent' : 'text-muted-foreground'
                                }`}>{t.label}</span>
                                {theme === t.key && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Volume Control */}
                <div>
                    <p className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-widest mb-3">Sacred Volume</p>
                    <div className="px-4 py-4 rounded-2xl border border-border bg-muted/50 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                             <span className="text-xs font-sans font-medium text-foreground">{Math.round(volume * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume} 
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="w-full accent-accent h-1.5 bg-border rounded-full appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Active Plan */}
                <div className="px-4 py-4 rounded-2xl border border-border bg-muted">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-widest mb-1">Active Plan</p>
                            <p className="text-foreground text-sm font-serif font-medium">Tatvam Free</p>
                            <p className="text-muted-foreground text-[11px] font-sans mt-0.5">Unlimited reflections</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-background text-muted-foreground text-[10px] font-sans font-medium uppercase tracking-wide border border-border">Free</span>
                    </div>
                    <button className="mt-3 w-full py-2 rounded-xl bg-accent text-accent-foreground text-xs font-sans font-medium hover:opacity-90 transition-opacity">
                        Upgrade to Plus
                    </button>
                </div>

                {/* Profile */}
                <div>
                    <p className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-widest mb-2">Profile</p>
                    <button
                        onClick={() => window.location.href = '/profile'}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-border hover:border-accent/30 hover:bg-muted transition-all"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span className="text-sm font-sans text-foreground font-medium">View Profile</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto text-muted-foreground"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                </div>

                {/* Notifications */}
                <div>
                    <p className="text-[10px] text-muted-foreground font-sans font-semibold uppercase tracking-widest mb-2">Notifications</p>
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-border">
                        <span className="text-sm font-sans text-foreground">Daily reminder</span>
                        <div className="w-10 h-6 rounded-full bg-accent/20 relative">
                            <div className="w-4 h-4 rounded-full bg-accent absolute right-1 top-1" />
                        </div>
                    </div>
                </div>

                {/* Sign out */}
                <div className="pt-2">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        <span className="text-sm font-sans font-medium">Sign out</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Sidebar Btn ──────────────────────────────────────────────────────────────

function HistoryPanel({ 
    onClose, 
    conversations, 
    activeId, 
    onSelect 
}: { 
    onClose: () => void; 
    conversations: Conversation[]; 
    activeId: string | null; 
    onSelect: (id: string) => void 
}) {
    return (
        <div className="w-72 h-full bg-card border-r border-border flex flex-col shrink-0 z-10 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <div>
                    <h3 className="font-serif text-foreground text-base font-medium">History</h3>
                    <p className="text-muted-foreground text-xs mt-0.5 font-sans">Your past reflections</p>
                </div>
                <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {conversations.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground text-xs font-sans">No history yet.</p>
                    </div>
                ) : (
                    conversations.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => onSelect(c.id)}
                            className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                                activeId === c.id
                                    ? 'border-accent/40 bg-accent/5'
                                    : 'border-border hover:border-accent/20 hover:bg-muted'
                            }`}
                        >
                            <p className={`text-sm font-sans font-medium truncate ${activeId === c.id ? 'text-accent' : 'text-foreground'}`}>
                                {c.title || 'Untitled Reflection'}
                            </p>
                            <p className="text-muted-foreground text-[10px] font-sans mt-0.5">
                                {new Date(c.updatedAt).toLocaleDateString()}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}

function SidebarBtn({

    label, active, onClick, children, badge,
}: {
    label: string; active?: boolean; onClick?: () => void; children: React.ReactNode; badge?: React.ReactNode
}) {
    return (
        <div className="relative group/tip flex items-center">
            <button
                onClick={onClick}
                className={`p-3 rounded-xl transition-all relative ${
                    active ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
                {children}
                {badge}
            </button>
            <div className="pointer-events-none absolute left-full ml-3 px-2 py-1 bg-zinc-900 text-white text-xs font-sans rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-lg">
                {label}
            </div>
        </div>
    )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

function DashboardSidebar({
    userName,
    onLogout,
    onNewReflection,
    activePanel,
    onTogglePanel,
}: {
    userName: string
    onLogout: () => void
    onNewReflection: () => void
    activePanel: SidebarPanel
    onTogglePanel: (p: SidebarPanel) => void
}) {
    return (
        <aside className="w-[70px] h-full bg-card flex flex-col items-center py-6 border-r border-border shrink-0 z-20 transition-colors duration-300">
            {/* Logo */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/80 to-accent/20 shadow-[0_4px_15px_rgba(201,151,110,0.3)] mb-10 flex items-center justify-center">
                <div className="w-4 h-4 bg-white/40 blur-[2px] rounded-full absolute mix-blend-overlay" />
            </div>

            <nav className="flex flex-col gap-2 flex-1 w-full items-center">
                {/* New Reflection */}
                <div className="relative group/tip flex items-center">
                    <button
                        onClick={onNewReflection}
                        className="p-3 bg-[#111111] text-white rounded-[14px] hover:bg-black/80 transition-colors shadow-md relative"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <div className="absolute -top-1 -right-1 flex rotate-12">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                               <path d="M12 2L15 9L22 10L17 15L18.5 22L12 18L5.5 22L7 15L2 10L9 9L12 2Z" />
                            </svg>
                        </div>
                    </button>
                    <div className="pointer-events-none absolute left-full ml-3 px-2 py-1 bg-zinc-900 text-white text-xs font-sans rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-lg">
                        New Reflection
                    </div>
                </div>

                <div className="h-4" />

                {/* Bhajans */}
                <SidebarBtn
                    label="Bhajans"
                    active={activePanel === 'bhajans'}
                    onClick={() => onTogglePanel(activePanel === 'bhajans' ? null : 'bhajans')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                </SidebarBtn>

                {/* Daily Shlok Guide */}
                <SidebarBtn
                    label="Daily Shlok Guide"
                    active={activePanel === 'shlok_guide'}
                    onClick={() => onTogglePanel(activePanel === 'shlok_guide' ? null : 'shlok_guide')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </SidebarBtn>

                {/* History */}
                <SidebarBtn
                    label="History"
                    active={activePanel === 'history'}
                    onClick={() => onTogglePanel(activePanel === 'history' ? null : 'history')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="9" />
                    </svg>
                </SidebarBtn>
            </nav>

            {/* Settings & Avatar */}
            <div className="flex flex-col gap-4 items-center mt-auto pb-4">
                <SidebarBtn
                    label="Settings"
                    active={activePanel === 'settings'}
                    onClick={() => onTogglePanel(activePanel === 'settings' ? null : 'settings')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </SidebarBtn>

                <div className="relative group/tip flex items-center">
                    <button
                        onClick={() => onTogglePanel(activePanel === 'settings' ? null : 'settings')}
                        className="w-10 h-10 rounded-full flex mx-auto items-center justify-center font-serif text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors relative"
                    >
                        {userName.charAt(0).toUpperCase()}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    </button>
                    <div className="pointer-events-none absolute left-full ml-3 px-2 py-1 bg-zinc-900 text-white text-xs font-sans rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-lg">
                        {userName}
                    </div>
                </div>
            </div>
        </aside>
    )
}




// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
    if (message.type === 'user') {
        return (
            <div className="flex justify-end mb-6">
                <div className="max-w-xl bg-muted rounded-2xl rounded-br-sm px-6 py-4 shadow-sm border border-border">
                    <p className="text-foreground font-sans text-base leading-relaxed">{message.content}</p>
                </div>
            </div>
        )
    }

    if (message.type === 'chat') {
        return (
            <div className="mb-6 flex gap-4 pr-12">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/80 to-accent/20 flex-shrink-0 mt-1 shadow-sm flex items-center justify-center">
                   <div className="w-3 h-3 bg-white/40 blur-[1px] rounded-full absolute mix-blend-overlay" />
                </div>
                <div className="max-w-2xl pt-1">
                    <p className="text-foreground/80 font-sans text-base leading-relaxed tracking-wide">
                        {message.content}
                    </p>
                </div>
            </div>
        )
    }

    if (message.type === 'shlok') {
        return (
            <div className="mb-8 group flex gap-4 pr-12">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/80 to-accent/20 flex-shrink-0 mt-1 shadow-sm flex items-center justify-center">
                   <div className="w-3 h-3 bg-white/40 blur-[1px] rounded-full absolute mix-blend-overlay" />
                </div>
                <div className="max-w-2xl bg-card border border-border rounded-3xl rounded-tl-sm px-8 py-10 space-y-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    {/* Interior Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    {/* Sanskrit */}
                    <div className="text-center space-y-2 relative z-10">
                        <p className="font-tiro text-2xl md:text-3xl text-foreground leading-[1.6] whitespace-pre-line">
                            {message.content}
                        </p>
                        {message.source && (
                            <div className="pt-4">
                                <span className="inline-block px-3 py-1 bg-muted rounded-full text-[10px] tracking-[0.2em] font-sans text-muted-foreground uppercase font-medium">
                                    {message.source}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Divine Divider */}
                    <div className="flex items-center justify-center gap-4 py-2">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
                        <div className="w-2 h-2 border border-accent/40 rounded-full rotate-45 transform flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-accent rounded-full" />
                        </div>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
                    </div>

                    {/* Hindi Meaning */}
                    {message.subContent && (
                        <div className="relative z-10">
                            <p className="text-zinc-400 text-[10px] tracking-[0.2em] uppercase mb-3 font-sans font-semibold mt-6">Divya Artha</p>
                            <div className="font-tiro text-muted-foreground text-lg leading-relaxed italic border-l-2 border-accent/40 pl-6 py-1">
                                <WordReveal text={message.subContent} delay={0.4} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (message.type === 'meaning') {
        return (
             <div className="mb-6 flex gap-4 pr-12">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/80 to-accent/20 flex-shrink-0 mt-1 shadow-sm opacity-0" />
                <div className="max-w-2xl bg-muted border border-border rounded-2xl px-8 py-7 shadow-sm">
                    <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-4 font-sans font-semibold">Bodha • Understanding</p>
                    <p className="text-foreground/80 font-sans text-base leading-relaxed tracking-wide">
                        {message.content}
                    </p>
                </div>
            </div>
        )
    }

    if (message.type === 'reflection') {
        return (
             <div className="mb-8 flex gap-4 pr-12">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/80 to-accent/20 flex-shrink-0 mt-1 shadow-sm opacity-0" />
                <div className="max-w-2xl bg-accent/[0.05] border border-accent/20 rounded-2xl px-8 py-7 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 blur-[30px] rounded-full" />
                    <p className="text-accent/80 text-[10px] tracking-[0.2em] uppercase mb-4 font-sans font-semibold">Chintana • Reflection</p>
                    <p className="font-serif text-foreground text-xl leading-relaxed italic">
                        &quot;{message.content}&quot;
                    </p>
                </div>
            </div>
        )
    }

    // system
    return (
        <div className="text-center mb-6">
            <p className="text-zinc-400 text-sm font-sans">{message.content}</p>
        </div>
    )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
    const router = useRouter()
    const [userName, setUserName] = useState('Seeker')
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isThinking, setIsThinking] = useState(false)
    const [remaining, setRemaining] = useState(RATE_LIMIT)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [activePanel, setActivePanel] = useState<SidebarPanel>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    const fetchConversations = async () => {
        const token = localStorage.getItem('tatvam_token')
        if (!token) return

        try {
            const response = await fetch('/api/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setConversations(data)
                if (data.length > 0 && !activeConversationId) {
                    setActiveConversationId(data[0].id)
                    setMessages(data[0].messages)
                }
            }
        } catch (e) {
            console.error('Fetch conversations error:', e)
        }
    }

    // Audio Playback
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playingTrack, setPlayingTrack] = useState<number | null>(null)
    const [volume, setVolume] = useState(0.5)

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio()
            audioRef.current.volume = volume
        }
    }, [])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
        localStorage.setItem('tatvam_volume', volume.toString())
    }, [volume])

    const handleToggleTrack = (index: number) => {
        if (playingTrack === index) {
            audioRef.current?.pause()
            setPlayingTrack(null)
            localStorage.removeItem('tatvam_active_bhajan_src')
        } else {
            if (audioRef.current) {
                const src = BHAJANS[index].src
                audioRef.current.src = src
                audioRef.current.play().catch(e => console.error("Audio playback error:", e))
                setPlayingTrack(index)
                localStorage.setItem('tatvam_active_bhajan_src', src)
            }
        }
    }

    // Restore saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem('tatvam_theme') as AppTheme | null
        if (saved) applyTheme(saved)
    }, [])

    const handleTogglePanel = (p: SidebarPanel) => setActivePanel(p)

    const handleInjectShlok = (s: typeof SHLOK_GUIDE[0]) => {
        const now = Date.now()
        const newMessages: Message[] = [
            {
                id: now.toString(),
                type: 'system',
                content: `Wisdom for when you feel: ${s.mood}`,
                timestamp: new Date(),
            },
            {
                id: (now + 1).toString(),
                type: 'shlok',
                content: s.shlok,
                source: s.source,
                timestamp: new Date(),
            },
            {
                id: (now + 2).toString(),
                type: 'meaning',
                content: s.meaning,
                timestamp: new Date(),
            },
        ]
        setMessages(prev => [...prev, ...newMessages])
    }

    // Load conversations from DB on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations()
        }
    }, [isAuthenticated])

    // Sync local message state with active conversation
    useEffect(() => {
        if (activeConversationId) {
            const active = conversations.find(c => c.id === activeConversationId)
            if (active) {
                setMessages(active.messages)
            }
        }
    }, [activeConversationId, conversations])

    // Update remaining count on mount and after each message
    useEffect(() => {
        setRemaining(getRemainingMessages())
    }, [messages])

    // Auth check
    useEffect(() => {
        const token = localStorage.getItem('tatvam_token')
        const userStr = localStorage.getItem('tatvam_user')

        if (!token) {
            window.location.href = '/login'
            return
        }

        if (userStr) {
            try {
                const user = JSON.parse(userStr)
                setUserName(user.name || 'Seeker')
            } catch { /* ignore */ }
        }

        setIsAuthenticated(true)
        setIsLoading(false)
        loadDailyReflection()
    }, [])

    // Auto-scroll
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages])

    const loadDailyReflection = () => {
        // If we already have conversations loaded, don't auto-create one
        if (conversations.length > 0) return

        const dayIndex = new Date().getDate() % DAILY_SHLOKS.length
        const shlok = DAILY_SHLOKS[dayIndex]

        const initialMessages: Message[] = [
            {
                id: '1',
                type: 'system',
                content: `Namaste. Here is today's reflection for you.`,
                timestamp: new Date(),
            },
            {
                id: '2',
                type: 'shlok',
                content: shlok.sanskrit,
                subContent: shlok.hindi,
                source: shlok.source,
                timestamp: new Date(),
            },
            {
                id: '3',
                type: 'meaning',
                content: shlok.english,
                timestamp: new Date(),
            },
            {
                id: '4',
                type: 'reflection',
                content: shlok.reflection,
                timestamp: new Date(),
            },
        ]

        const newConv: Conversation = {
            id: 'initial-' + Date.now(),
            title: "Today's Reflection",
            messages: initialMessages,
            updatedAt: Date.now()
        }

        setConversations([newConv])
        setActiveConversationId(newConv.id)
        setMessages(initialMessages)
    }

    const handleNewReflection = () => {
        const randomIndex = Math.floor(Math.random() * DAILY_SHLOKS.length)
        const shlok = DAILY_SHLOKS[randomIndex]

        const newMessages: Message[] = [
            {
                id: Date.now().toString(),
                type: 'system',
                content: 'A new reflection has been drawn for you.',
                timestamp: new Date(),
            },
            {
                id: (Date.now() + 1).toString(),
                type: 'shlok',
                content: shlok.sanskrit,
                subContent: shlok.hindi,
                source: shlok.source,
                timestamp: new Date(),
            },
            {
                id: (Date.now() + 2).toString(),
                type: 'meaning',
                content: shlok.english,
                timestamp: new Date(),
            },
            {
                id: (Date.now() + 3).toString(),
                type: 'reflection',
                content: shlok.reflection,
                timestamp: new Date(),
            },
        ]

        const newConvId = 'conv-' + Date.now()
        const newConv: Conversation = {
            id: newConvId,
            title: 'New Reflection',
            messages: newMessages,
            updatedAt: Date.now()
        }

        setConversations(prev => [newConv, ...prev])
        setActiveConversationId(newConvId)
        setMessages(newMessages)
    }

    const handleSend = async () => {
        if (!inputValue.trim() || isThinking) return

        // Skip rate limit check for unlimited mode
        /*
        const remainingNow = getRemainingMessages()
        if (remainingNow <= 0) {
            const resetTime = getNextResetTime()
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'system',
                content: `You have used all ${RATE_LIMIT} reflections for today. Your next reflection will be available in ${resetTime}. Take this time to sit with the wisdom already shared.`,
                timestamp: new Date(),
            }])
            return
        }
        */

        const userMessage = inputValue.trim()
        const userMsg: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: userMessage,
            timestamp: new Date(),
        }

        // Update conversation title if it's new
        if (activeConversationId) {
            setConversations(prev => prev.map(c => {
                if (c.id === activeConversationId && c.title === 'New Reflection') {
                    // Use first 3-4 words of user message as title
                    const titleWords = userMessage.split(' ').slice(0, 4).join(' ')
                    const title = titleWords.length > 25 ? titleWords.substring(0, 25) + '...' : titleWords
                    return { ...c, title: title.charAt(0).toUpperCase() + title.slice(1) }
                }
                return c
            }))
        }

        setMessages(prev => [...prev, userMsg])
        setInputValue('')
        setIsThinking(true)

        try {
            // Build history from recent messages
            const history = messages
                .filter(m => m.type === 'user' || m.type === 'reflection' || m.type === 'meaning' || m.type === 'shlok' || m.type === 'chat')
                .slice(-10)
                .map(m => ({ type: m.type, content: m.content }))

            const token = localStorage.getItem('tatvam_token')
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ 
                    message: userMessage, 
                    history, 
                    userName,
                    conversationId: activeConversationId && !activeConversationId.startsWith('initial') ? activeConversationId : null
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Something went wrong')
            }

            // Map structured parts into separate message bubbles
            const now = Date.now()
            const newMessages: Message[] = []

            if (data.parts && Array.isArray(data.parts)) {
                for (let i = 0; i < data.parts.length; i++) {
                    const part = data.parts[i]
                    let msgType: Message['type'] = 'system'

                    if (part.type === 'chat') msgType = 'chat'
                    else if (part.type === 'acknowledge') msgType = 'chat'
                    else if (part.type === 'scripture') msgType = 'shlok'
                    else if (part.type === 'teaching') msgType = 'meaning'
                    else if (part.type === 'guidance') msgType = 'reflection'

                    newMessages.push({
                        id: (now + i + 1).toString(),
                        type: msgType,
                        content: part.content,
                        source: part.source,
                        timestamp: new Date(),
                    })
                }
            } else {
                // Fallback: single message
                newMessages.push({
                    id: (now + 1).toString(),
                    type: 'chat',
                    content: data.reply,
                    timestamp: new Date(),
                })
            }

            // Record this message for rate limiting
            recordMessageTimestamp()
            setRemaining(getRemainingMessages())

            setMessages(prev => [...prev, ...newMessages])

            // 🆔 New Sync Logic: If a new conversation was created on the server, update local state
            if (data.conversationId && data.conversationId !== activeConversationId) {
                setActiveConversationId(data.conversationId)
                fetchConversations() // Refresh sidebar list to include the new real ID
            }
        } catch (err: any) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                type: 'system',
                content: err.message || 'The reflection engine is resting. Please try again.',
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsThinking(false)
        }
    }


    const handleLogout = () => {
        localStorage.removeItem('tatvam_token')
        localStorage.removeItem('tatvam_user')
        window.location.href = '/'
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_12px_var(--color-accent)] animate-pulse" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="h-[100dvh] w-full bg-background flex items-center justify-center p-0 md:p-4 lg:p-6 overflow-hidden transition-colors duration-300">
            <div className="bg-card md:rounded-[2.5rem] w-full h-full flex overflow-hidden relative shadow-[0_10px_60px_rgba(0,0,0,0.05)] border-0 md:border border-border transition-colors duration-300">
                {/* Sidebar */}
                <DashboardSidebar
                    userName={userName}
                    onLogout={handleLogout}
                    onNewReflection={handleNewReflection}
                    activePanel={activePanel}
                    onTogglePanel={handleTogglePanel}
                />

                {/* Slide-in Panels */}
                <AnimatePresence mode="wait">
                    {/* Panels */}
                    {activePanel === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full border-r border-border"
                        >
                            <HistoryPanel
                                onClose={() => setActivePanel(null)}
                                conversations={conversations}
                                activeId={activeConversationId}
                                onSelect={(id) => {
                                    setActiveConversationId(id)
                                    setActivePanel(null)
                                }}
                            />
                        </motion.div>
                    )}
                    {activePanel === 'bhajans' && (
                        <motion.div
                            key="bhajans"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full border-r border-border"
                        >
                            <BhajanPanel 
                                onClose={() => setActivePanel(null)} 
                                playingTrack={playingTrack}
                                onToggleTrack={handleToggleTrack}
                            />
                        </motion.div>
                    )}
                    {activePanel === 'shlok_guide' && (
                        <motion.div
                            key="shlok"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full border-r border-border"
                        >
                            <ShlokGuidePanel
                                onClose={() => setActivePanel(null)}
                                onInjectShlok={handleInjectShlok}
                            />
                        </motion.div>
                    )}
                    {activePanel === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full border-r border-border"
                        >
                            <SettingsPanel
                                onClose={() => setActivePanel(null)}
                                onLogout={handleLogout}
                                volume={volume}
                                onVolumeChange={setVolume}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <main className="flex-1 flex flex-col h-full relative z-10 bg-card transition-colors duration-300">

                    {/* Top Bar */}
                    <header className="flex items-center justify-between px-8 py-5">
                        <div className="flex items-center gap-3">
                            <h2 className="font-serif text-zinc-800 text-lg tracking-wide font-medium">
                                Tatvam <span className="inline-block ml-2 px-2 py-0.5 rounded-full border border-zinc-200 text-[10px] uppercase font-sans text-zinc-400 bg-zinc-50 align-middle">Plus</span>
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-sm font-sans font-medium transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                Configuration
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-sm font-sans font-medium transition-colors">
                                Share
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                            </button>
                            <button
                                onClick={handleNewReflection}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111] hover:bg-black/80 text-white text-sm font-sans font-medium transition-colors"
                            >
                                New Reflection
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9L22 10L16 15L17.5 22L12 18L6.5 22L8 15L2 10L9.5 9L12 2Z" /></svg>
                            </button>
                        </div>
                    </header>

                    {/* Messages Area */}
                    <div 
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-24 py-8 scroll-smooth"
                    >
                        <div className="max-w-[800px] mx-auto h-full flex flex-col">
                            {messages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                                    <div className="flex flex-col items-center text-center max-w-sm">
                                        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-8 relative">
                                            <div className="absolute inset-0 rounded-full border border-accent/20 animate-ping-slow" />
                                            <div className="absolute inset-0 rounded-full border border-accent/30 animate-pulse-slow" />
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                                                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-serif font-medium mb-3 tracking-tight">
                                            <WordReveal text="Welcome to Tatvam, Seeker." />
                                        </h2>
                                        <p className="text-zinc-500 text-sm leading-relaxed font-medium">
                                            <WordReveal text="In the quiet of your mind, let the ancient wisdom find its way to you." delay={0.8} />
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map(msg => (
                                        <MessageBubble key={msg.id} message={msg} />
                                    ))}
                                    {isThinking && (
                                        <div className="mb-10">
                                            <div className="max-w-md bg-white border border-[#EFEFEF] shadow-sm rounded-2xl rounded-bl-md px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-3 h-3 bg-accent/40 rounded-full animate-ping absolute inset-0" />
                                                        <div className="w-3 h-3 bg-accent rounded-full relative z-10" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-zinc-400 text-[10px] tracking-[0.2em] uppercase font-sans font-bold">Dhyana</span>
                                                        <span className="text-zinc-500 text-xs font-sans italic">Tatvam is gathering thoughts...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Input Bar - The Capsule */}
                    <div className="px-6 md:px-12 lg:px-24 pb-8 pt-4">
                        <div className="max-w-[800px] mx-auto relative group">

                            <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-full pl-6 pr-3 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus-within:border-zinc-300 transition-colors relative z-50">

                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask me anything..."
                                    disabled={isThinking}
                                    className="flex-1 bg-transparent text-zinc-800 placeholder-zinc-400 focus:outline-none text-base font-sans disabled:opacity-50 min-h-[44px]"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isThinking}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#111111] hover:bg-black/80 text-white text-xs font-semibold disabled:opacity-20 transition-all shadow-md shrink-0"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                    Send
                                </button>
                            </div>

                            {/* Footer text */}
                            <div className="text-center mt-4 opacity-70">
                                <p className={`text-[10px] font-sans font-medium ${remaining <= 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                                    {remaining <= 0
                                        ? `Reflections exhausted. Resets in ${getNextResetTime()}`
                                        : `Tatvam may display inaccurate information. Unlimited Reflections.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
