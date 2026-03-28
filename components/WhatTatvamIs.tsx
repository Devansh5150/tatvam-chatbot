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
    <section className="px-6 md:px-12 py-28 md:py-36 relative overflow-hidden" aria-labelledby="what-is-tatvam">
      {/* Background mandala watermark */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, var(--accent) 1px, transparent 1px),
                            radial-gradient(circle at 50% 50%, transparent 60px, var(--accent) 61px, transparent 62px),
                            radial-gradient(circle at 50% 50%, transparent 100px, var(--accent) 101px, transparent 102px),
                            radial-gradient(circle at 50% 50%, transparent 140px, var(--accent) 141px, transparent 142px)`,
          backgroundSize: '320px 320px',
          backgroundPosition: 'center',
        }}
      />
      {/* Saffron ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" aria-hidden="true" />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">

        {/* Heading */}
        <div className="space-y-5 text-center">
          <p className="font-tiro text-accent text-lg md:text-xl tracking-[0.2em] opacity-80">
            तत् त्वम् असि
          </p>
          <h2 id="what-is-tatvam" className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground">
            What is Tatvam?
          </h2>
          <SectionOrnament />
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Left: description */}
          <div className="space-y-8 text-xl leading-relaxed">
            {/* Temple stone quote */}
            <div className="relative p-6 rounded-2xl overflow-hidden glass-morphism"
              style={{ background: 'linear-gradient(135deg, rgba(8,7,6,0.95) 0%, rgba(20,14,8,0.9) 100%)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ background: 'linear-gradient(to bottom, var(--accent), var(--primary), var(--accent))' }} />
              <div className="absolute top-2 right-3 text-accent/10 text-6xl font-tiro leading-none select-none" aria-hidden="true">"</div>
              <p className="font-tiro text-[#E8DCC8] text-xl md:text-2xl italic leading-relaxed pl-4 relative z-10">
                Tatvam is a reflective companion rooted in Indian wisdom.
              </p>
            </div>
            <p className="font-light text-foreground/70 text-lg leading-loose">
              It draws from the Bhagavad Gita, Ramayana, and Mahabharata — offering shlok, meaning, and
              reflection, gently, without advice.
            </p>
            <p className="font-tiro text-accent/70 text-base tracking-wide">
              ॐ तत् सत् — That which is.
            </p>
          </div>

          {/* Right: feature scroll card */}
          <div className="relative group">
            {/* Outer glow on hover */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-accent/10 via-transparent to-primary/10
                            opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" aria-hidden="true" />
            <div className="relative p-8 rounded-3xl border border-accent/15 hover:border-accent/35
                            transition-all duration-500 hover:-translate-y-1 backdrop-blur-md space-y-7"
              style={{ background: 'linear-gradient(160deg, rgba(13,10,6,0.95) 0%, rgba(20,15,9,0.9) 100%)' }}>

              {/* Card header */}
              <div className="flex items-center gap-3">
                <span className="text-accent text-xl" aria-hidden="true">🪷</span>
                <h3 className="font-serif text-2xl text-accent">What you receive:</h3>
              </div>

              {/* Thin divider */}
              <div className="h-px bg-gradient-to-r from-accent/30 via-primary/20 to-transparent" aria-hidden="true" />

              <ul className="space-y-5" role="list">
                {features.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4 group/item" role="listitem">
                    {/* Lotus bullet */}
                    <div className="w-8 h-8 rounded-full border border-accent/30 flex items-center justify-center
                                    flex-shrink-0 group-hover/item:border-accent/60 group-hover/item:bg-accent/5
                                    transition-all duration-300" aria-hidden="true">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent transition-colors" />
                    </div>
                    <div>
                      <span className="font-light tracking-wide text-foreground/80 text-base">{item.label}</span>
                      <span className="ml-2 font-tiro text-accent/50 text-sm">{item.sanskrit}</span>
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
            <span className="text-accent underline decoration-accent/30 underline-offset-8 font-serif">
              meet your own answer.
            </span>
          </p>
          <p className="font-tiro text-accent/50 text-sm tracking-widest">— ॐ —</p>
        </div>


      </div>
    </section>
  );
}
