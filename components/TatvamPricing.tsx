'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { motion } from "motion/react"
import { ShootingStars } from "@/components/ui/shooting-stars"
import { StarsBackground } from "@/components/ui/stars-background"

const Aurora = ({ className = "" }: { className?: string }) => (
    <div className={`pointer-events-none absolute blur-[120px] rounded-full mix-blend-screen opacity-20 ${className}`} />
)

const CheckIcon = () => (
    <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
        <div className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_rgba(201,151,110,0.8)]" />
    </div>
)

export default function TatvamPricing() {
    const tiers = [
        {
            id: 'praja',
            name: 'PRAJA',
            subtitle: 'Reflection',
            status: 'Basic Path',
            features: [
                'Text chat with Tatvam',
                'Sanskrit shlok display',
                'Hindi meaning',
                'English understanding',
                'Limited daily reflections'
            ],
            cta: 'Start with Praja',
            aura: 'bg-accent/10 top-0 left-0'
        },
        {
            id: 'purohit',
            name: 'PUROHIT',
            subtitle: 'Listening',
            status: 'The Seeker Path',
            features: [
                'Everything in Praja',
                'Shlok listening',
                'Deeper explanations',
                'Save favorite shloks',
                'Theme-based paths'
            ],
            cta: 'Choose Purohit',
            isMid: true,
            aura: 'bg-accent/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        },
        {
            id: 'shahak',
            name: 'SHAHAK',
            subtitle: 'Voice of the Bindu',
            status: 'Full Companionship',
            description: 'Experience Tatvam as a gentle presence. A calm voice arises from the Bindu — the circle of inner stillness.',
            features: [
                'Everything in Praja and Purohit',
                'Immersive Bindu Mode',
                'Voice conversations based on shlok',
                'Guided listening sessions',
                'Personal reflection journal',
                'Offline library'
            ],
            cta: 'Enter Shahak',
            isPremium: true,
            aura: 'bg-accent/30 bottom-0 right-0',
            ethicalNote: 'The voice is Tatvam reflecting the scriptures. It is not a deity and does not claim divinity.'
        }
    ]

    return (
        <section id="pricing" className="px-6 md:px-12 py-48 md:py-72 relative overflow-hidden">
            {/* The Space Effect - Higher Density */}
            <StarsBackground
                starDensity={0.0004}
                allStarsTwinkle={true}
                twinkleProbability={0.9}
                minTwinkleSpeed={0.2}
                maxTwinkleSpeed={0.7}
            />
            <ShootingStars
                starColor="#C9976E"
                trailColor="rgba(201, 151, 110, 0.2)"
                minSpeed={20}
                maxSpeed={35}
                minDelay={1500}
                maxDelay={4000}
            />

            <Aurora className="w-[800px] h-[800px] bg-accent/15 -top-64 -left-64" />
            <Aurora className="w-[1000px] h-[1000px] bg-accent/10 -bottom-[32rem] -right-64" />

            <div className="max-w-[1400px] mx-auto relative z-10">
                {/* Header Section - Larger Scale */}
                <div className="flex flex-col items-center text-center mb-56">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="mb-12"
                    >
                        <div className="w-20 h-20 rounded-full border border-accent/30 flex items-center justify-center p-5 relative group">
                            <div className="absolute inset-x-0 inset-y-0 bg-accent/20 blur-2xl rounded-full animate-pulse group-hover:bg-accent/30 transition-all duration-1000" />
                            <div className="w-3 h-3 bg-accent rounded-full z-10" />
                        </div>
                    </motion.div>

                    <h2 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white font-light tracking-tighter leading-[0.85] mb-12">
                        The Sacred <br className="hidden md:block" /> Reflection
                    </h2>
                    <p className="text-accent/60 font-tiro text-2xl tracking-[0.2em] italic animate-pulse">
                        Sadhna of silence and understanding.
                    </p>
                </div>

                {/* Pricing Deck - Swelled Scale */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 xl:gap-14 items-stretch pt-24">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={tier.id}
                            initial={{ opacity: 0, y: 60 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, delay: idx * 0.2 }}
                            className={`group relative flex flex-col p-14 md:p-16 lg:p-20 rounded-[50px] transition-all duration-1000 overflow-hidden ${tier.isPremium
                                ? 'bg-[#12100E]/90 border-2 border-accent/40 shadow-[0_60px_120px_rgba(0,0,0,0.9)] backdrop-blur-xl'
                                : 'bg-white/[0.04] border border-white/10 backdrop-blur-3xl'
                                }`}
                        >
                            {/* Individual Tier Aura */}
                            <div className={`absolute -inset-40 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none ${tier.aura}`} />

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Header */}
                                <div className="mb-20 border-b border-white/10 pb-12">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="space-y-2">
                                            <h3 className="font-tiro text-5xl tracking-widest text-white">{tier.name}</h3>
                                            <p className="font-serif text-accent/80 italic text-base">{tier.subtitle}</p>
                                        </div>
                                        {tier.isPremium && (
                                            <div className="px-6 py-2 rounded-full bg-accent text-[#080706] text-[11px] font-black tracking-[0.3em] shadow-[0_0_30px_rgba(201,151,110,0.5)]">
                                                MOST SACRED
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-white/40 text-xs tracking-[0.4em] font-bold uppercase">{tier.status}</p>
                                </div>

                                {/* Content */}
                                {tier.description && (
                                    <div className="mb-16 p-8 rounded-[30px] bg-accent/[0.05] border border-accent/20">
                                        <p className="text-lg font-serif italic leading-relaxed text-white/70">
                                            {tier.description}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-10 flex-grow mb-20">
                                    <div className="space-y-8">
                                        {tier.features.map((feature, fIdx) => (
                                            <div key={fIdx} className="flex gap-6 group/item items-center">
                                                <CheckIcon />
                                                <span className="text-lg font-sans font-light text-white/80 group-hover/item:text-white transition-colors duration-300">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer & CTA */}
                                <div className="mt-auto space-y-12">
                                    {tier.ethicalNote && (
                                        <div className="px-8 py-6 rounded-2xl border border-white/10 bg-white/[0.03] text-center">
                                            <p className="text-xs leading-relaxed text-accent/50 font-tiro italic tracking-wider">
                                                {tier.ethicalNote}
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        disabled
                                        className={`w-full py-12 rounded-[30px] text-xs font-black tracking-[0.5em] uppercase transition-all duration-700 opacity-50 cursor-not-allowed ${tier.isPremium
                                            ? 'bg-accent/40 text-[#080706] border-accent/20'
                                            : 'bg-white/5 text-white/40 border border-white/20'
                                            }`}
                                    >
                                        Coming Soon
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Cinematic Floor Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-[32rem] bg-gradient-to-t from-[#080706] via-[#080706]/80 to-transparent pointer-events-none" />
        </section>
    )
}
