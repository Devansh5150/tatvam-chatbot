'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SneakPeekPage() {
    return (
        <main className="min-h-screen bg-[#080706] relative overflow-hidden">
            {/* Subtle Bindu Glow Behind Title */}
            <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 md:py-32">
                {/* Page Header */}
                <div className="text-center mb-16 space-y-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-accent/20 mb-4">
                        <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_12px_rgba(201,151,110,0.8)]" />
                    </div>

                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight leading-[1.1]">
                        Sneak Peek
                    </h1>
                    <p className="font-tiro text-accent/70 text-lg md:text-xl italic tracking-wide">
                        Inside Praja
                    </p>
                </div>

                {/* Intro Text */}
                <div className="text-center mb-16">
                    <p className="text-white/70 font-sans text-lg leading-relaxed">
                        A glimpse of how Praja offers daily reflection.
                    </p>
                </div>

                {/* Static Example Reflection Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[30px] p-8 md:p-12 space-y-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
                    {/* Sanskrit Shlok Block */}
                    <div className="text-center space-y-2">
                        <p className="font-tiro text-2xl md:text-3xl text-accent leading-relaxed tracking-wide">
                            कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
                        </p>
                        <p className="font-tiro text-xl md:text-2xl text-accent/80 leading-relaxed tracking-wide">
                            मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥
                        </p>
                        <p className="text-white/40 text-xs tracking-[0.3em] uppercase mt-4">
                            Bhagavad Gita 2.47
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-4">
                        <span className="w-12 h-px bg-white/10" />
                        <div className="w-1.5 h-1.5 bg-accent/40 rounded-full" />
                        <span className="w-12 h-px bg-white/10" />
                    </div>

                    {/* Hindi Meaning */}
                    <div className="text-center">
                        <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-3">Hindi Meaning</p>
                        <p className="font-tiro text-white/80 text-lg md:text-xl leading-relaxed italic">
                            तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं। न तुम कर्मफल के कारण बनो, और न ही कर्म न करने में तुम्हारी आसक्ति हो।
                        </p>
                    </div>

                    {/* English Understanding */}
                    <div className="text-center">
                        <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-3">English Understanding</p>
                        <p className="font-sans text-white/70 text-base md:text-lg leading-relaxed">
                            You have the right to perform your actions, but you are not entitled to the fruits of those actions. Do not let the fruit be your motive, nor let yourself be attached to inaction.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-4">
                        <span className="w-8 h-px bg-accent/20" />
                        <div className="w-1 h-1 bg-accent/30 rounded-full" />
                        <span className="w-8 h-px bg-accent/20" />
                    </div>

                    {/* Reflective Line */}
                    <div className="text-center">
                        <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-3">Reflection</p>
                        <p className="font-serif text-white/60 text-base md:text-lg leading-relaxed italic">
                            What if your peace didn't depend on outcomes?
                        </p>
                    </div>
                </div>

                {/* Soft Message */}
                <div className="text-center mt-12 mb-10">
                    <p className="text-white/40 font-sans text-sm leading-relaxed italic">
                        This is a preview. Create a free account to experience your own reflection.
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/demo">
                        <Button className="px-10 py-6 rounded-xl bg-accent text-[#080706] font-bold tracking-[0.15em] uppercase text-sm transition-all duration-300 hover:bg-white hover:scale-105 shadow-[0_10px_30px_rgba(201,151,110,0.3)]">
                            Begin Your Reflection
                        </Button>
                    </Link>

                    <Link href="/signup">
                        <Button
                            variant="outline"
                            className="px-8 py-6 rounded-xl bg-transparent text-white/70 border border-white/20 font-medium tracking-[0.1em] uppercase text-sm transition-all duration-300 hover:bg-white/5 hover:text-white hover:border-white/30"
                        >
                            Join the Early Circle
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    )
}
