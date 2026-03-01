'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { RATE_LIMIT, getRemainingMessages, getNextResetTime, recordMessageTimestamp } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string
    type: 'shlok' | 'meaning' | 'reflection' | 'user' | 'system'
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
        sanskrit: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥',
        hindi: 'हे धनञ्जय! आसक्ति को त्यागकर, सिद्धि और असिद्धि में समान भाव से स्थित होकर कर्म करो। यही समत्व योग कहलाता है।',
        english: 'Perform your duties with equanimity, O Arjuna, abandoning all attachment, being indifferent to success and failure. Such equanimity is called Yoga.',
        reflection: 'Can you act fully without clinging to the result?',
        source: 'Bhagavad Gita 2.48',
    },
    {
        sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
        hindi: 'अपने आप को स्वयं ऊपर उठाओ, अपने आप को गिरने मत दो। क्योंकि आत्मा ही आत्मा का मित्र है, और आत्मा ही आत्मा का शत्रु है।',
        english: 'Elevate yourself through the power of your own mind, and do not degrade yourself. The mind can be the friend and also the enemy of the self.',
        reflection: 'Are you being your own friend today, or your own obstacle?',
        source: 'Bhagavad Gita 6.5',
    },
    {
        sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
        hindi: 'हे भारत! जब-जब धर्म की हानि और अधर्म की वृद्धि होती है, तब-तब मैं स्वयं को प्रकट करता हूँ।',
        english: 'Whenever there is a decline in righteousness and an increase in unrighteousness, O Arjuna, at that time I manifest Myself.',
        reflection: 'What small act of dharma can you restore in your own life today?',
        source: 'Bhagavad Gita 4.7',
    },
    {
        sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
        hindi: 'सब धर्मों को त्यागकर तू केवल मेरी शरण में आ। मैं तुझे सब पापों से मुक्त कर दूँगा, शोक मत कर।',
        english: 'Abandon all varieties of duties and surrender unto Me alone. I shall deliver you from all sinful reactions; do not grieve.',
        reflection: 'What would it feel like to truly let go and trust the process?',
        source: 'Bhagavad Gita 18.66',
    },
]

// ─── Dashboard Sidebar ───────────────────────────────────────────────────────

function DashboardSidebar({
    isOpen,
    onToggle,
    userName,
    onLogout,
    onNewReflection,
    conversations,
    activeId,
    onSelectConversation,
}: {
    isOpen: boolean
    onToggle: () => void
    userName: string
    onLogout: () => void
    onNewReflection: () => void
    conversations: Conversation[]
    activeId: string | null
    onSelectConversation: (id: string) => void
}) {
    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:relative z-40 h-full bg-[#0d0c0a] border-r border-white/5 flex flex-col transition-all duration-300 ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'
                    }`}
            >
                <div className={`flex flex-col h-full overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                    {/* Top Section */}
                    <div className="p-4 space-y-4">
                        {/* Logo + Toggle */}
                        <div className="flex items-center justify-between">
                            {isOpen && (
                                <a href="/" className="font-serif text-white/80 text-lg tracking-wide hover:text-white transition-colors">
                                    Tatvam
                                </a>
                            )}
                            <button
                                onClick={onToggle}
                                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {isOpen ? (
                                        <path d="M15 18l-6-6 6-6" />
                                    ) : (
                                        <>
                                            <line x1="3" y1="6" x2="21" y2="6" />
                                            <line x1="3" y1="12" x2="21" y2="12" />
                                            <line x1="3" y1="18" x2="21" y2="18" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>

                        {/* New Reflection Button */}
                        {isOpen && (
                            <button
                                onClick={onNewReflection}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm font-sans tracking-wide"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                New Reflection
                            </button>
                        )}
                    </div>

                    {/* Past Sessions - Wrapped in a container that grows */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                        {isOpen && (
                            <>
                                <p className="text-[10px] text-white/30 font-sans tracking-[0.2em] uppercase mb-3 px-3">
                                    Recent
                                </p>
                                <div className="space-y-1">
                                    {conversations.length === 0 ? (
                                        <div className="px-3 py-2.5 text-white/20 text-xs font-sans italic">
                                            No reflections yet
                                        </div>
                                    ) : (
                                        conversations
                                            .sort((a, b) => b.updatedAt - a.updatedAt)
                                            .map((conv) => (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => onSelectConversation(conv.id)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group relative truncate ${activeId === conv.id
                                                        ? 'bg-accent/10 text-accent font-medium shadow-[inset_0_0_12px_rgba(201,151,110,0.05)] border border-accent/20'
                                                        : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-1 h-1 rounded-full transition-colors ${activeId === conv.id ? 'bg-accent' : 'bg-transparent group-hover:bg-white/20'}`} />
                                                        <span className="text-sm font-sans truncate pr-2">
                                                            {conv.title || "New Reflection"}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Bottom Section - Fixed at the very bottom */}
                    <div className="mt-auto p-4 border-t border-white/5 space-y-2">
                        {isOpen ? (
                            <>
                                <div className="flex items-center justify-between px-3 py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-serif border border-accent/10">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white/80 text-sm font-sans truncate max-w-[120px]">{userName}</span>
                                            <Link href="/profile" className="text-accent/60 text-[10px] uppercase tracking-widest hover:text-accent transition-colors">
                                                View Profile
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="w-full text-left px-3 py-2 text-white/30 hover:text-white/60 hover:bg-white/5 transition-all text-xs font-sans tracking-tight"
                                >
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <Link href="/profile" className="flex justify-center group">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-serif border border-accent/10 group-hover:bg-accent/30 transition-colors">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
    if (message.type === 'user') {
        return (
            <div className="flex justify-end mb-6">
                <div className="max-w-xl bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-6 py-4 shadow-[0_4px_20px_rgba(201,151,110,0.05)] backdrop-blur-md">
                    <p className="text-white/90 font-sans text-base leading-relaxed">{message.content}</p>
                </div>
            </div>
        )
    }

    if (message.type === 'shlok') {
        return (
            <div className="mb-8 group">
                <div className="max-w-2xl bg-white/[0.03] border border-white/10 rounded-3xl rounded-bl-lg px-8 py-10 space-y-8 backdrop-blur-xl relative overflow-hidden transition-all duration-500 hover:bg-white/[0.05] hover:border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                    {/* Interior Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    {/* Sanskrit */}
                    <div className="text-center space-y-2 relative z-10">
                        <p className="font-tiro text-2xl md:text-3xl text-accent leading-[1.6] whitespace-pre-line drop-shadow-[0_2px_10px_rgba(212,163,115,0.2)]">
                            {message.content}
                        </p>
                        {message.source && (
                            <div className="pt-4">
                                <span className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] tracking-[0.3em] font-sans text-white/40 uppercase">
                                    {message.source}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Divine Divider */}
                    <div className="flex items-center justify-center gap-4 py-2">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
                        <div className="w-2 h-2 border border-accent/40 rounded-full rotate-45 transform flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-accent rounded-full" />
                        </div>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
                    </div>

                    {/* Hindi Meaning */}
                    {message.subContent && (
                        <div className="relative z-10">
                            <p className="text-accent/40 text-[9px] tracking-[0.3em] uppercase mb-3 font-sans font-medium">Divya Artha</p>
                            <p className="font-tiro text-white/70 text-lg leading-relaxed italic border-l-2 border-accent/20 pl-6 py-1">
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
            <div className="mb-6">
                <div className="max-w-2xl bg-white/[0.02] border border-white/5 rounded-2xl rounded-bl-md px-8 py-7 shadow-sm backdrop-blur-lg">
                    <p className="text-white/25 text-[9px] tracking-[0.3em] uppercase mb-4 font-sans">Bodha • Understanding</p>
                    <p className="text-white/70 font-sans text-base leading-relaxed tracking-wide">
                        {message.content}
                    </p>
                </div>
            </div>
        )
    }

    if (message.type === 'reflection') {
        return (
            <div className="mb-8">
                <div className="max-w-2xl bg-[#C9976E]/[0.02] border border-[#C9976E]/15 rounded-2xl rounded-bl-md px-8 py-7 backdrop-blur-lg relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#C9976E]/5 blur-[30px] rounded-full" />
                    <p className="text-[#C9976E]/40 text-[9px] tracking-[0.3em] uppercase mb-4 font-sans font-medium">Chintana • Reflection</p>
                    <p className="font-serif text-white/60 text-xl leading-relaxed italic">
                        &quot;{message.content}&quot;
                    </p>
                </div>
            </div>
        )
    }

    // system
    return (
        <div className="text-center mb-6">
            <p className="text-white/30 text-sm font-sans">{message.content}</p>
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
                body: JSON.stringify({ message: userMessage, history }),
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

                    if (part.type === 'acknowledge') msgType = 'system'
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
                    type: 'reflection',
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
            <div className="min-h-screen bg-[#080706] flex items-center justify-center">
                <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_12px_rgba(201,151,110,0.8)] animate-pulse" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="h-screen bg-[#080706] flex overflow-hidden relative">
            {/* Ambient Background Layers */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Indigo Flow */}
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#1A1A2E]/40 blur-[120px] rounded-full animate-[pulse_6s_ease-in-out_infinite]" />
                {/* Violet Pulse */}
                <div className="absolute top-[20%] -right-[5%] w-[50%] h-[50%] bg-[#2D2338]/30 blur-[100px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" style={{ animationDelay: '1000ms' }} />
                {/* Saffron Glow */}
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[40%] bg-[#C9976E]/10 blur-[110px] rounded-full animate-[pulse_10s_ease-in-out_infinite]" style={{ animationDelay: '2000ms' }} />
                {/* Center Ink Depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080706]/20 to-[#080706]" />
            </div>

            {/* Sidebar Overlay for depth */}
            <div className="absolute inset-0 z-0 bg-white/[0.01] backdrop-blur-[2px] pointer-events-none" />

            {/* Sidebar */}
            <DashboardSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                userName={userName}
                onLogout={handleLogout}
                onNewReflection={handleNewReflection}
                conversations={conversations}
                activeId={activeConversationId}
                onSelectConversation={(id) => setActiveConversationId(id)}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative z-10">
                {/* Top Bar Glow Effect */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20" />
                <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/10 backdrop-blur-sm">
                    {!sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white mr-4"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    )}
                    <h2 className="font-serif text-white/50 text-sm tracking-wide">
                        {conversations.find(c => c.id === activeConversationId)?.title || "Reflection"}
                    </h2>
                    <div />
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-24 py-8">
                    <div className="max-w-3xl mx-auto">
                        {messages.map(msg => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        {isThinking && (
                            <div className="mb-10">
                                <div className="max-w-md bg-white/[0.02] border border-white/5 rounded-2xl rounded-bl-md px-8 py-6 backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-3 h-3 bg-accent/40 rounded-full animate-ping absolute inset-0" />
                                            <div className="w-3 h-3 bg-accent rounded-full relative z-10 shadow-[0_0_10px_rgba(212,163,115,0.5)]" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-sans font-medium">Dhyana</span>
                                            <span className="text-white/20 text-xs font-sans italic">Deep reflection in progress...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Bar */}
                <div className="relative z-10 px-6 md:px-12 lg:px-24 pb-8 pt-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-[24px] px-6 py-4.5 focus-within:border-accent/40 focus-within:bg-white/[0.05] transition-all duration-300 shadow-[0_10px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl group">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Share a thought or ask for reflection..."
                                disabled={isThinking || remaining <= 0}
                                className="flex-1 bg-transparent text-white placeholder-white/20 focus:outline-none text-base font-sans disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isThinking || remaining <= 0}
                                className="p-2.5 rounded-xl bg-accent text-[#080706] hover:bg-[#E8DCC8] active:scale-95 transition-all duration-200 disabled:opacity-20 disabled:grayscale disabled:scale-100 shadow-[0_0_15px_rgba(212,163,115,0.3)]"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-center mt-5 flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity duration-500">
                            <p className="text-white/30 text-[9px] tracking-[0.3em] font-sans uppercase font-medium">
                                Tatvam • Timeless Wisdom for the Modern Soul
                            </p>
                            <p className={`text-[10px] tracking-[0.1em] font-sans font-medium ${remaining <= 0 ? 'text-red-400/80' : remaining <= 2 ? 'text-accent/80' : 'text-white/20'
                                }`}>
                                {remaining <= 0
                                    ? `Reflections used for today • Next available in ${getNextResetTime()}`
                                    : `${remaining} of ${RATE_LIMIT} reflections remaining today`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
