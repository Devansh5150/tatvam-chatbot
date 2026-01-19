'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

const Bindu = ({ intensity = 1 }: { intensity?: number }) => (
    <div className="relative flex items-center justify-center">
        <div
            className="w-16 h-16 rounded-full bg-accent/20 blur-2xl animate-pulse"
            style={{ opacity: intensity }}
        />
        <div
            className="absolute w-4 h-4 rounded-full bg-accent shadow-[0_0_15px_rgba(201,151,110,0.8)]"
            style={{ opacity: intensity * 0.8 }}
        />
    </div>
)

export default function TatvamPricing() {
    const tiers = [
        {
            id: 'praja',
            name: 'PRAJA',
            subtitle: 'Reflection',
            price: 'Basic',
            features: [
                'Text chat with Tatvam',
                'Sanskrit shlok display',
                'Hindi meaning',
                'English understanding',
                'Limited daily reflections'
            ],
            cta: 'Start with Praja'
        },
        {
            id: 'purohit',
            name: 'PUROHIT',
            subtitle: 'Listening',
            price: 'Deeper Seeking',
            features: [
                'Everything in Praja',
                'Shlok listening (Hindi & English audio)',
                'Deeper explanations',
                'Save favorite shloks',
                'Theme-based paths'
            ],
            cta: 'Choose Purohit',
            isMid: true
        },
        {
            id: 'shahak',
            name: 'SHAHAK',
            subtitle: 'Voice of the Bindu',
            price: 'Full Presence',
            description: 'Experience Tatvam as a gentle presence. A calm voice arises from the Bindu — the circle of inner stillness — sharing wisdom from the scriptures, not as command, but as companionship.',
            features: [
                'Everything in Praja and Purohit',
                'Immersive Bindu Mode (glowing circle, no form, no avatar)',
                'Voice conversations based on shlok',
                'Guided listening sessions',
                'Personal reflection journal',
                'Offline library'
            ],
            cta: 'Enter Shahak',
            isPremium: true,
            ethicalNote: 'The voice is Tatvam reflecting the scriptures. It is not a deity and does not claim divine authority. Tatvam offers understanding, never commands.'
        }
    ]

    return (
        <section id="pricing" className="px-6 md:px-12 py-24 md:py-32 bg-[#141110] border-t border-white/5 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-20 relative z-10">
                <div className="space-y-6 text-center">
                    <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-white">
                        Presence & Support
                    </h2>
                    <div className="h-px w-24 bg-accent/30 mx-auto" />
                    <p className="text-white/40 font-light tracking-widest uppercase text-sm">Choose your path of reflection</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {tiers.map((tier) => (
                        <div
                            key={tier.id}
                            className={`relative group flex flex-col p-10 rounded-[2.5rem] transition-all duration-700 border ${tier.isPremium
                                ? 'bg-accent/[0.05] border-accent/20 shadow-[0_0_50px_rgba(201,151,110,0.05)]'
                                : 'bg-white/[0.02] border-white/10'
                                } hover:border-accent/40`}
                        >
                            <div className="flex flex-col items-center text-center space-y-6 mb-10">
                                <Bindu intensity={tier.isPremium ? 1 : tier.isMid ? 0.6 : 0.3} />
                                <div className="space-y-1">
                                    <h3 className="font-tiro text-3xl tracking-wider text-white">{tier.name}</h3>
                                    <p className="font-serif italic text-accent">{tier.subtitle}</p>
                                </div>
                            </div>

                            {tier.description && (
                                <p className="text-sm font-light leading-relaxed text-white/70 text-center mb-8 italic">
                                    {tier.description}
                                </p>
                            )}

                            <ul className="space-y-5 flex-grow mb-10">
                                {tier.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm font-light text-white/80 leading-snug">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {tier.ethicalNote && (
                                <div className="mb-10 p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                                    <p className="text-[13px] leading-relaxed text-accent/90 font-light italic">
                                        {tier.ethicalNote}
                                    </p>
                                </div>
                            )}

                            <Button
                                className={`w-full py-7 text-lg font-tiro rounded-xl transition-all duration-500 ${tier.isPremium
                                    ? 'bg-accent text-[#1a1614] hover:bg-white shadow-[0_0_30px_rgba(201,151,110,0.3)]'
                                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-accent/40'
                                    }`}
                            >
                                {tier.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
