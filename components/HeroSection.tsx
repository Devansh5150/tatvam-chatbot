'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

interface HeroSectionProps {
  isPlaying?: boolean;
  onToggleSound?: () => void;
}

export default function HeroSection({ isPlaying = false, onToggleSound }: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState({ sanskrit: '', english: '', source: '' });

  const SACRED_QUOTES = [
    {
      sanskrit: 'सुख-दुःख में धैर्य ही समाधान है।',
      english: 'Learning to endure the fleeting seasons of the soul.',
      source: 'Patience from the Gita'
    },
    {
      sanskrit: 'रामो विग्रहवान् धर्मः',
      english: 'Rama is the living embodiment of dharma.',
      source: 'Righteousness from Ramayana'
    },
    {
      sanskrit: 'धर्मो रक्षति रक्षितः',
      english: 'Dharma protects those who protect it.',
      source: 'Duty from Mahabharata'
    },
    {
      sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
      english: 'Act without attachment to the outcome.',
      source: 'Action from Bhagavad Gita'
    }
  ];

  useEffect(() => {
    setMounted(true);
    const random = SACRED_QUOTES[Math.floor(Math.random() * SACRED_QUOTES.length)];
    setSelectedQuote(random);
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pb-32">

      {/* Floating Sound Toggle */}
      <button
        onClick={onToggleSound}
        aria-label={isPlaying ? 'Mute meditation music' : 'Unmute meditation music'}
        aria-pressed={isPlaying}
        className={`fixed bottom-10 right-10 z-50 flex items-center gap-3 px-6 py-4 rounded-full transition-all duration-500 group shadow-[0_10px_40px_rgba(0,0,0,0.4)] border backdrop-blur-md ${isPlaying
          ? 'bg-accent/90 border-accent/20 text-[#080706]'
          : 'bg-[#1a1614]/80 border-white/10 text-white/90'
          } hover:scale-105 active:scale-95`}
      >
        <div className="relative">
          {isPlaying ? (
            <Volume2 className="w-6 h-6 animate-pulse" />
          ) : (
            <VolumeX className="w-6 h-6 text-white/40" />
          )}
          {isPlaying && (
            <span className="absolute -inset-2 rounded-full border border-accent/30 animate-ping" />
          )}
        </div>
        <span className="text-sm font-light tracking-widest uppercase">
          {isPlaying ? 'Energy Active' : 'Engage Energy'}
        </span>
      </button>

      {/* Full-Screen Blurred Background with Deep Fade */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{
            backgroundImage: "url('/sacred_mythology_hero_bg_1774808391877.png')", // Generated inclusive background
            filter: 'blur(20px)',
          }}
        />
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#080706]/20 to-[#080706]" />
        {/* The "Fade" - Deep Bottom Transition */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#080706] to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center space-y-0 max-w-4xl px-6 -mt-20 md:-mt-32">
        {/* Sharpened Logo at Top */}
        <div className="transition-transform duration-500 hover:scale-105 -mb-10 md:-mb-16 lg:-mb-24 z-20">
          <img
            src="/logo_v3.png"
            alt="Tatvam - Connecting with Ancient Wisdom"
            className="w-full max-w-[25rem] md:max-w-[45rem] lg:max-w-[55rem] h-auto drop-shadow-md"
          />
        </div>

        {/* Themed Description Box */}
        <div className="w-full max-w-2xl p-8 md:p-12 rounded-[32px] bg-accent/[0.04] backdrop-blur-3xl border border-accent/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] space-y-8 relative group overflow-hidden">
          {/* Decorative Corner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -translate-y-16 translate-x-16 group-hover:bg-accent/10 transition-colors duration-1000" />

          <div className="flex flex-col items-center space-y-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

            <div className="space-y-6 text-center">
              <p className="text-3xl md:text-5xl text-accent font-tiro leading-relaxed tracking-wide drop-shadow-sm transition-opacity duration-1000" style={{ opacity: mounted ? 1 : 0 }}>
                {selectedQuote.sanskrit || 'सुख-दुःख में धैर्य ही समाधान है।'}
              </p>

              <div className="space-y-4">
                <p className="text-base md:text-lg text-accent/80 font-light tracking-[0.25em] uppercase leading-relaxed font-sans transition-opacity duration-1000 delay-300" style={{ opacity: mounted ? 1 : 0 }}>
                  {selectedQuote.english || 'Learning to endure the fleeting seasons of the soul.'}
                </p>
                <div className="flex items-center justify-center gap-6 text-accent/40 transition-opacity duration-1000 delay-500" style={{ opacity: mounted ? 1 : 0 }}>
                  <span className="w-12 h-px bg-accent/10" />
                  <p className="text-sm md:text-base italic font-tiro tracking-widest">
                    {selectedQuote.source || 'shlok, meaning, and reflection, found in patience.'}
                  </p>
                  <span className="w-12 h-px bg-accent/10" />
                </div>
              </div>
            </div>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          </div>
        </div>

        {/* CTA Buttons Row - Refined */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-10 scale-95 md:scale-100">
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center px-12 py-5 rounded-2xl bg-accent text-[#080706] font-bold tracking-[0.2em] uppercase text-[11px] transition-all duration-500 hover:bg-accent/80 hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(201,151,110,0.3)]"
          >
            Begin Reflection
          </Link>

          <Link
            href="/sneak-peek"
            className="inline-flex items-center justify-center px-12 py-5 rounded-2xl bg-accent/[0.03] text-accent/80 border border-accent/20 font-bold tracking-[0.2em] uppercase text-[11px] transition-all duration-500 hover:bg-accent/10 hover:border-accent/40 hover:text-accent hover:scale-105 active:scale-95"
          >
            Sneak Peek
          </Link>
        </div>
      </div>

    </section>
  )
}
