'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
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

// Rate limit logic removed (now in lib/utils.ts)

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

// ─── Minimalist Icon Sidebar ──────────────────────────────────────────────────

function DashboardSidebar({
    userName,
    onLogout,
    onNewReflection,
}: {
    userName: string
    onLogout: () => void
    onNewReflection: () => void
}) {
    return (
        <aside className="w-[70px] h-full bg-white flex flex-col items-center py-6 border-r border-[#EFEFEF] shrink-0 z-20">
            {/* Logo / Glowing Orb */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/80 to-accent/20 shadow-[0_4px_15px_rgba(201,151,110,0.3)] mb-10 flex items-center justify-center">
                <div className="w-4 h-4 bg-white/40 blur-[2px] rounded-full absolute mix-blend-overlay" />
            </div>

            {/* Navigation Icons */}
            <nav className="flex flex-col gap-6 flex-1 w-full items-center">
                <button
                    onClick={onNewReflection}
                    className="p-3 bg-[#111111] text-white rounded-[14px] hover:bg-black/80 transition-colors shadow-md relative group"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {/* New Badge */}
                    <div className="absolute -top-1 -right-1 flex rotate-12">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                           <path d="M12 2L15 9L22 10L17 15L18.5 22L12 18L5.5 22L7 15L2 10L9 9L12 2Z" />
                        </svg>
                    </div>
                </button>

                <button className="p-3 text-zinc-400 hover:text-zinc-800 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
                </button>
                <button className="p-3 text-zinc-400 hover:text-zinc-800 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                </button>
                <button className="p-3 text-zinc-400 hover:text-zinc-800 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19.5 12.572L12 20l-7.5-7.428m0 0A5 5 0 1 1 12 5.5a5 5 0 1 1 7.5 7.072z" /></svg>
                </button>
                <button className="p-3 text-zinc-400 hover:text-zinc-800 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </button>
                <button className="p-3 text-zinc-400 hover:text-zinc-800 transition-colors relative">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                </button>
            </nav>

            {/* Profile Avatar & Settings */}
            <div className="flex flex-col gap-6 items-center mt-auto pb-4">
                <button className="p-3 text-zinc-400 hover:text-zinc-800 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                </button>
                <button
                    onClick={onLogout}
                    className="w-10 h-10 rounded-full flex mx-auto items-center justify-center font-serif text-sm font-medium border border-[#EBEBEB] text-[#111111] hover:bg-[#F9F9F9] transition-colors relative"
                >
                    {userName.charAt(0).toUpperCase()}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </button>
            </div>
        </aside>
    )
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
    if (message.type === 'user') {
        return (
            <div className="flex justify-end mb-6">
                <div className="max-w-xl bg-[#F4F4F4] rounded-2xl rounded-br-sm px-6 py-4 shadow-sm border border-[#EBEBEB]">
                    <p className="text-zinc-800 font-sans text-base leading-relaxed">{message.content}</p>
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
                    <p className="text-zinc-700 font-sans text-base leading-relaxed tracking-wide">
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
                <div className="max-w-2xl bg-white border border-[#EFEFEF] rounded-3xl rounded-tl-sm px-8 py-10 space-y-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    {/* Interior Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    {/* Sanskrit */}
                    <div className="text-center space-y-2 relative z-10">
                        <p className="font-tiro text-2xl md:text-3xl text-zinc-800 leading-[1.6] whitespace-pre-line">
                            {message.content}
                        </p>
                        {message.source && (
                            <div className="pt-4">
                                <span className="inline-block px-3 py-1 bg-zinc-100 rounded-full text-[10px] tracking-[0.2em] font-sans text-zinc-500 uppercase font-medium">
                                    {message.source}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Divine Divider */}
                    <div className="flex items-center justify-center gap-4 py-2">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-zinc-200" />
                        <div className="w-2 h-2 border border-accent/40 rounded-full rotate-45 transform flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-accent rounded-full" />
                        </div>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-zinc-200" />
                    </div>

                    {/* Hindi Meaning */}
                    {message.subContent && (
                        <div className="relative z-10">
                            <p className="text-zinc-400 text-[10px] tracking-[0.2em] uppercase mb-3 font-sans font-semibold">Divya Artha</p>
                            <p className="font-tiro text-zinc-600 text-lg leading-relaxed italic border-l-2 border-accent/40 pl-6 py-1">
                                {message.subContent}
                            </p>
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
                <div className="max-w-2xl bg-[#F9F9F9] border border-[#EFEFEF] rounded-2xl px-8 py-7 shadow-sm">
                    <p className="text-zinc-400 text-[10px] tracking-[0.2em] uppercase mb-4 font-sans font-semibold">Bodha • Understanding</p>
                    <p className="text-zinc-700 font-sans text-base leading-relaxed tracking-wide">
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
                    <p className="font-serif text-zinc-800 text-xl leading-relaxed italic">
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
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [userName, setUserName] = useState('Seeker')
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isThinking, setIsThinking] = useState(false)
    const [remaining, setRemaining] = useState(RATE_LIMIT)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load conversations on mount
    useEffect(() => {
        const stored = localStorage.getItem('tatvam_conversations')
        if (stored) {
            try {
                const parsed: Conversation[] = JSON.parse(stored)
                // Convert timestamp strings back to Date objects
                parsed.forEach(c => {
                    c.messages.forEach(m => {
                        m.timestamp = new Date(m.timestamp)
                    })
                })
                setConversations(parsed)
                if (parsed.length > 0) {
                    setActiveConversationId(parsed[0].id)
                    setMessages(parsed[0].messages)
                }
            } catch (e) {
                console.error('Failed to load conversations', e)
            }
        }
    }, [])

    // Update messages when active conversation changes
    useEffect(() => {
        if (activeConversationId) {
            const active = conversations.find(c => c.id === activeConversationId)
            if (active) {
                setMessages(active.messages)
            }
        }
    }, [activeConversationId])

    // Save conversations when they change
    useEffect(() => {
        if (conversations.length > 0) {
            // Merging logic to be safe: don't overwrite a larger list with a smaller one
            // if the smaller one is just a default initialization
            const stored = localStorage.getItem('tatvam_conversations')
            if (stored) {
                try {
                    const parsed: Conversation[] = JSON.parse(stored)
                    if (parsed.length > conversations.length && conversations.length === 1 && conversations[0].id.startsWith('initial-')) {
                        // We are likely in a race condition where the default loaded but haven't synced from stored yet
                        return
                    }
                } catch { }
            }
            localStorage.setItem('tatvam_conversations', JSON.stringify(conversations))
        }
    }, [conversations])

    // Update active conversation current messages
    useEffect(() => {
        if (activeConversationId && messages.length > 0) {
            setConversations(prev => {
                const existing = prev.find(c => c.id === activeConversationId)
                if (existing && existing.messages === messages) return prev // No change
                return prev.map(c =>
                    c.id === activeConversationId
                        ? { ...c, messages, updatedAt: Date.now() }
                        : c
                )
            })
        }
    }, [messages, activeConversationId])

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

        // Check rate limit
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
                .filter(m => m.type === 'user' || m.type === 'reflection' || m.type === 'meaning' || m.type === 'shlok')
                .slice(-10)
                .map(m => ({ type: m.type === 'user' ? 'user' : 'assistant', content: m.content }))

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, history, userName }),
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
        <div className="h-screen bg-[#F7F7F7] flex items-center justify-center p-2 md:p-4 lg:p-6">
            <div className="bg-white rounded-[2.5rem] w-full h-full flex overflow-hidden relative shadow-[0_10px_60px_rgba(0,0,0,0.05)] border border-[#EFEFEF]">
                {/* Sidebar */}
                <DashboardSidebar
                    userName={userName}
                    onLogout={handleLogout}
                    onNewReflection={handleNewReflection}
                />

                {/* Main Content */}
                <main className="flex-1 flex flex-col h-full relative z-10 bg-white">
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

                    {/* Messages Area / Empty State */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-24 py-8">
                        <div className="max-w-[800px] mx-auto h-full flex flex-col">
                            {messages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/80 to-accent/20 mb-6 flex items-center justify-center shadow-[0_10px_30px_rgba(201,151,110,0.3)]">
                                        <div className="w-6 h-6 bg-white/40 blur-[2px] rounded-full absolute mix-blend-overlay" />
                                    </div>
                                    <h1 className="text-3xl font-sans font-semibold text-zinc-800 mb-2 tracking-tight">
                                        Hi, {userName} 👋
                                    </h1>
                                    <p className="text-zinc-500 font-sans text-base mb-12">
                                        Seek timeless wisdom, and find your center here.
                                    </p>

                                    {/* Suggestion Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
                                        {/* Card 1: Dark Mode / Immersive */}
                                        <div 
                                            onClick={() => setInputValue("What is the core message of the Bhagavad Gita regarding duty?")}
                                            className="bg-[#111111] rounded-3xl p-6 text-white flex flex-col cursor-pointer transition-transform hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-accent to-yellow-500 flex items-center justify-center text-[10px] font-bold">G</div>
                                                <span className="text-xs font-semibold bg-blue-600 px-2 py-1 rounded-full text-white">Spiritual Guide</span>
                                            </div>
                                            <p className="text-sm text-zinc-300 flex-1 leading-relaxed">
                                                Explore the depths of your inner self and understand the nature of Dharma through ancient scriptures.
                                            </p>
                                        </div>

                                        {/* Card 2: Tasks */}
                                        <div className="bg-white border text-left border-zinc-200 rounded-3xl p-6 flex flex-col relative">
                                            <p className="text-xs text-zinc-400 font-medium mb-3 absolute bottom-3 left-6">Vedic Tasks</p>
                                            <a href="#" className="text-[10px] text-blue-500 absolute bottom-3 right-6 font-medium hover:underline">View All</a>
                                            <div className="space-y-4 mb-8">
                                                <button onClick={() => setInputValue("Read a daily reflection on patience.")} className="flex items-start gap-3 w-full text-left group">
                                                    <svg className="w-4 h-4 text-zinc-400 mt-0.5 group-hover:text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                    <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">Daily reflection on Patience</span>
                                                </button>
                                                <button onClick={() => setInputValue("How did Arjuna find focus?")} className="flex items-start gap-3 w-full text-left group">
                                                    <svg className="w-4 h-4 text-zinc-400 mt-0.5 group-hover:text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                                    <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">How did Arjuna find focus?</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card 3: Suggested prompt */}
                                        <div 
                                            onClick={() => setInputValue("I'm feeling very overwhelmed by the workload today. How can I regain my balance?")}
                                            className="bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col relative cursor-pointer hover:border-zinc-300 transition-colors"
                                        >
                                            <p className="text-zinc-800 text-sm font-medium leading-relaxed">
                                                I&apos;m feeling very overwhelmed by the workload today. How can I regain my balance?
                                            </p>
                                            <div className="absolute top-4 right-4 text-zinc-400">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-medium mt-auto absolute bottom-4">Suggested thought</p>
                                        </div>
                                    </div>

                                    {/* Action Pills */}
                                    <div className="flex flex-wrap items-center justify-center gap-3">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
                                            <svg width="14" height="14" className="text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                            Connect Calendar
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
                                            <svg width="14" height="14" className="text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
                                            Demo Mode
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
                                            <svg width="14" height="14" className="text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                            Browse Stories
                                        </button>
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
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Input Bar - The Capsule */}
                    <div className="px-6 md:px-12 lg:px-24 pb-8 pt-4">
                        <div className="max-w-[800px] mx-auto">
                            <div className="flex flex-col bg-white border border-zinc-200 rounded-3xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus-within:border-zinc-300 transition-colors">
                                {/* Input Box Row */}
                                <div className="flex items-center px-4 pb-2">
                                    <svg width="16" height="16" className="text-accent mr-3 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask me anything..."
                                        disabled={isThinking || remaining <= 0}
                                        className="flex-1 bg-transparent text-zinc-800 placeholder-zinc-400 focus:outline-none text-base font-sans disabled:opacity-50 min-h-[44px]"
                                    />
                                </div>
                                
                                {/* Bottom Action Row */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-xs text-zinc-600 font-medium hover:bg-zinc-50 transition-colors">
                                            Select Source
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-zinc-600 font-medium hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                            Attach
                                        </button>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-zinc-600 font-medium hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                                            Voice
                                        </button>
                                        <button
                                            onClick={handleSend}
                                            disabled={!inputValue.trim() || isThinking || remaining <= 0}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] hover:bg-black/80 text-white text-xs font-semibold disabled:opacity-20 transition-all shadow-md ml-1"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Footer text */}
                            <div className="text-center mt-4 opacity-70">
                                <p className={`text-[10px] font-sans font-medium ${remaining <= 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                                    {remaining <= 0
                                        ? `Reflections exhausted. Resets in ${getNextResetTime()}`
                                        : `Tatvam may display inaccurate information. Your Reflections: ${remaining} of ${RATE_LIMIT} remaining.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
