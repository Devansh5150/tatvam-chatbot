'use client';

import SectionOrnament from './SectionOrnament';
import { motion } from 'motion/react';

const features = [
  { label: 'Sanskrit shlok', icon: '𑀩', sanskrit: 'श्लोक' },
  { label: 'Hindi meaning', icon: '𑀫', sanskrit: 'अर्थ' },
  { label: 'English understanding', icon: '𑀓', sanskrit: 'बोध' },
  { label: 'Gentle audio', icon: '𑀝', sanskrit: 'नाद' },
  { label: 'A single line for reflection', icon: '𑀣', sanskrit: 'ध्यान' },
];

export default function WhatTatvamIs() {
  return (
    <section className="px-6 md:px-12 py-28 md:py-36 relative overflow-hidden">
      {/* Background mandala watermark */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #C9976E 1px, transparent 1px),
                            radial-gradient(circle at 50% 50%, transparent 60px, #C9976E 61px, transparent 62px),
                            radial-gradient(circle at 50% 50%, transparent 100px, #C9976E 101px, transparent 102px),
                            radial-gradient(circle at 50% 50%, transparent 140px, #C9976E 141px, transparent 142px)`,
          backgroundSize: '320px 320px',
          backgroundPosition: 'center',
        }}
      />
      {/* Saffron ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C9976E]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">

        {/* Heading */}
        <div className="space-y-5 text-center">
          <p className="font-tiro text-[#D4A85A] text-lg md:text-xl tracking-[0.2em] opacity-80">
            तत् त्वम् असि
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground">
            What is Tatvam?
          </h2>
          <SectionOrnament />
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Left: description */}
          <div className="space-y-8 text-xl leading-relaxed">
            {/* Temple stone quote */}
            <div className="relative p-6 rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(12,9,5,0.95) 0%, rgba(20,14,8,0.9) 100%)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ background: 'linear-gradient(to bottom, #D4A85A, #C9976E, #D4A85A)' }} />
              <div className="absolute top-2 right-3 text-[#D4A85A]/10 text-6xl font-tiro leading-none select-none">"</div>
              <p className="font-tiro text-[#E8DCC8] text-xl md:text-2xl italic leading-relaxed pl-4 relative z-10">
                Tatvam is a reflective companion rooted in Indian wisdom.
              </p>
            </div>
            <p className="font-light text-muted-foreground text-lg leading-loose">
              It draws from the Bhagavad Gita, Ramayana, and Mahabharata — offering shlok, meaning, and
              reflection, gently, without advice.
            </p>
            <p className="font-tiro text-[#C9976E]/70 text-base tracking-wide">
              ॐ तत् सत् — That which is.
            </p>
          </div>

          {/* Right: feature scroll card */}
          <div className="relative group">
            {/* Outer glow on hover */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#D4A85A]/10 via-transparent to-[#C9976E]/10
                            opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
            <div className="relative p-8 rounded-3xl border border-[#C9976E]/15 hover:border-[#C9976E]/35
                            transition-all duration-500 hover:-translate-y-1 backdrop-blur-md space-y-7"
              style={{ background: 'linear-gradient(160deg, rgba(13,10,6,0.95) 0%, rgba(20,15,9,0.9) 100%)' }}>

              {/* Card header */}
              <div className="flex items-center gap-3">
                <span className="text-[#D4A85A] text-xl">🪷</span>
                <h3 className="font-serif text-2xl text-[#D4A85A]">What you receive:</h3>
              </div>

              {/* Thin divider */}
              <div className="h-px bg-gradient-to-r from-[#C9976E]/30 via-[#D4A85A]/20 to-transparent" />

              <ul className="space-y-5">
                {features.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4 group/item">
                    {/* Lotus bullet */}
                    <div className="w-8 h-8 rounded-full border border-[#C9976E]/30 flex items-center justify-center
                                    flex-shrink-0 group-hover/item:border-[#D4A85A]/60 group-hover/item:bg-[#D4A85A]/5
                                    transition-all duration-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9976E] group-hover/item:bg-[#D4A85A] transition-colors" />
                    </div>
                    <div>
                      <span className="font-light tracking-wide text-foreground/80 text-base">{item.label}</span>
                      <span className="ml-2 font-tiro text-[#C9976E]/50 text-sm">{item.sanskrit}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Closing wisdom line */}
        <div className="max-w-2xl mx-auto text-center pt-4 space-y-4">
          <p className="text-xl md:text-2xl font-light leading-relaxed text-foreground/80">
            Tatvam does not tell you what to do. <br />
            It only places a thought beside you, so you can{' '}
            <span className="text-[#D4A85A] underline decoration-[#D4A85A]/30 underline-offset-8 font-serif">
              meet your own answer.
            </span>
          </p>
          <p className="font-tiro text-[#C9976E]/50 text-sm tracking-widest">— ॐ —</p>
        </div>

      </div>
    </section>
  );
}
