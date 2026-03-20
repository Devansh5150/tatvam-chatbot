'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import PortalOverlay from './PortalOverlay';

export default function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const joined = localStorage.getItem('tatvam_waitlist_joined') === 'true';
    if (joined) setIsJoined(true);
  }, []);

  const toggleSound = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleJoinClick = () => {
    if (!isJoined) {
      setIsPortalOpen(true);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <PortalOverlay isOpen={isPortalOpen} onClose={() => setIsPortalOpen(false)} />

      {/* Top CTA Button */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50">
        <div className="relative inline-flex items-center justify-center gap-4 group">
          {!isJoined && (
            <div
              className="absolute inset-0 duration-1000 opacity-60 transition-all bg-gradient-to-r from-accent via-primary to-accent rounded-xl blur-lg filter group-hover:opacity-100 group-hover:duration-200"
            ></div>
          )}
          <button
            onClick={handleJoinClick}
            disabled={isJoined}
            className={`group relative inline-flex items-center justify-center text-base rounded-xl px-16 md:px-24 py-3 font-semibold transition-all duration-200 ${isJoined
              ? 'bg-[#1a1614]/80 text-[#c9976e] border border-accent/20 cursor-default opacity-90 font-tiro py-4 text-xl'
              : 'bg-[#1a1614] text-white hover:bg-[#25201d] hover:shadow-lg hover:-translate-y-0.5 hover:shadow-accent/20'
              }`}
            title={isJoined ? "Joined" : "Join Us"}
          >
            {isJoined ? 'जल्द ही आपके पास' : 'Join Us!'}
            {!isJoined && (
              <svg
                aria-hidden="true"
                viewBox="0 0 10 10"
                height="10"
                width="10"
                fill="none"
                className="mt-0.5 ml-2 -mr-1 stroke-white stroke-2"
              >
                <path
                  d="M0 5h7"
                  className="transition opacity-0 group-hover:opacity-100"
                ></path>
                <path
                  d="M1 1l4 4-4 4"
                  className="transition group-hover:translate-x-[3px]"
                ></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Meditative Audio Player */}
      <audio
        ref={audioRef}
        src="/om-chant.mp3"
        loop
      />

      {/* Floating Sound Toggle */}
      <button
        onClick={toggleSound}
        className={`fixed bottom-10 right-10 z-50 flex items-center gap-3 px-6 py-4 rounded-full transition-all duration-500 group shadow-[0_10px_40px_rgba(0,0,0,0.4)] border backdrop-blur-md ${isPlaying
          ? 'bg-accent/90 border-accent/20 text-white'
          : 'bg-[#1a1614]/80 border-white/10 text-white'
          } hover:scale-105 active:scale-95`}
      >
        <div className="relative">
          {isPlaying ? (
            <Volume2 className="w-6 h-6 text-accent animate-pulse" />
          ) : (
            <VolumeX className="w-6 h-6 text-white/40" />
          )}
          {isPlaying && (
            <span className="absolute -inset-2 rounded-full border border-accent/30 animate-ping" />
          )}
        </div>
        <span className="text-sm font-light tracking-widest text-white/80 uppercase">
          {isPlaying ? 'Energy Active' : 'Engage Energy'}
        </span>
      </button>

      {/* Full-Screen Blurred Background with Deep Fade */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{
            backgroundImage: "url('/krishna-arjun.png')",
            filter: 'blur(20px)',
          }}
        />
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#080706]/20 to-[#080706]" />
        {/* The "Fade" - Deep Bottom Transition */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#080706] to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center space-y-0 max-w-4xl px-6 -mt-8 md:-mt-12">
        {/* Sharpened Logo at Top */}
        <div className="transition-transform duration-500 hover:scale-105 -mb-10 md:-mb-16 lg:-mb-24 z-20">
          <img
            src="/logo_v3.png"
            alt="Tatvam"
            className="w-full max-w-[25rem] md:max-w-[45rem] lg:max-w-[55rem] h-auto drop-shadow-md"
          />
        </div>

        {/* Themed Description Box */}
        <div className="w-full max-w-2xl p-8 md:p-12 rounded-[32px] bg-white/[0.04] backdrop-blur-3xl border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] space-y-8 relative group overflow-hidden">
          {/* Decorative Corner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -translate-y-16 translate-x-16 group-hover:bg-accent/10 transition-colors duration-1000" />

          <div className="flex flex-col items-center space-y-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

            <div className="space-y-6 text-center">
              <p className="text-3xl md:text-5xl text-accent font-tiro leading-relaxed tracking-wide drop-shadow-sm">
                जहाँ शब्द नहीं, अर्थ बोलता है.
              </p>

              <div className="space-y-4">
                <p className="text-base md:text-lg text-white/70 font-light tracking-[0.25em] uppercase leading-relaxed font-sans">
                  Wisdom from the Gita, Ramayana, and Mahabharata—
                </p>
                <div className="flex items-center justify-center gap-6 text-white/40">
                  <span className="w-12 h-px bg-white/10" />
                  <p className="text-sm md:text-base italic font-tiro tracking-widest">
                    shlok, meaning, and reflection, offered gently.
                  </p>
                  <span className="w-12 h-px bg-white/10" />
                </div>
              </div>
            </div>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          </div>
        </div>

        {/* CTA Buttons Row - Refined */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-16 scale-95 md:scale-100">
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center px-12 py-5 rounded-2xl bg-accent text-[#080706] font-bold tracking-[0.2em] uppercase text-[11px] transition-all duration-500 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(201,151,110,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(255,255,255,0.2)]"
          >
            Begin Reflection
          </Link>

          <Link
            href="/sneak-peek"
            className="inline-flex items-center justify-center px-12 py-5 rounded-2xl bg-white/[0.03] text-white/80 border border-white/10 font-bold tracking-[0.2em] uppercase text-[11px] transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105 active:scale-95"
          >
            Sneak Peek
          </Link>
        </div>
      </div>
    </section>
  )
}
