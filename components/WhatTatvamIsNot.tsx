'use client';

import SectionOrnament from './SectionOrnament';

const points = [
  { text: 'Not a chatbot that gives life instructions', sanskrit: 'आदेश नहीं' },
  { text: 'Not preaching or moral policing', sanskrit: 'उपदेश नहीं' },
  { text: 'Not astrology or prediction', sanskrit: 'भविष्य नहीं' },
  { text: 'Not therapy or counselling', sanskrit: 'चिकित्सा नहीं' },
  { text: 'Not motivational quotes', sanskrit: 'प्रेरणा नहीं' },
];

export default function WhatTatvamIsNot() {
  return (
    <section className="px-6 md:px-12 py-28 md:py-36 overflow-hidden relative" aria-labelledby="what-tatvam-is-not">
      {/* Sacred crimson ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[130px] -translate-y-20 translate-x-20 pointer-events-none"
        style={{ background: 'rgba(122,26,26,0.12)' }} aria-hidden="true" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-32 blur-[80px] pointer-events-none"
        style={{ background: 'rgba(122,26,26,0.06)' }} aria-hidden="true" />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">

        {/* Heading */}
        <div className="space-y-5 text-center">
          <p className="font-tiro text-[#C06060] text-lg tracking-[0.2em] opacity-80" aria-hidden="true">
            सीमा का बोध
          </p>
          <h2 id="what-tatvam-is-not" className="font-serif text-4xl md:text-5xl font-medium text-foreground">
            What Tatvam is Not
          </h2>
          <SectionOrnament />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

          {/* Left: negation list */}
          <div className="space-y-3" role="list" aria-label="What Tatvam is NOT">
            {points.map((point, idx) => (
              <div key={idx}
                role="listitem"
                className="flex items-center gap-4 p-5 rounded-2xl border border-accent/5 group
                           hover:border-[#7A1A1A]/30 transition-all duration-300 backdrop-blur-sm"
                style={{ background: 'linear-gradient(135deg, rgba(8,7,6,0.9), rgba(18,8,8,0.85))' }}>
                {/* Crossed chakra icon */}
                <div className="w-8 h-8 rounded-full border border-[#7A1A1A]/40 flex items-center justify-center
                                flex-shrink-0 group-hover:bg-[#7A1A1A]/15 transition-colors" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="1" y1="1" x2="9" y2="9" stroke="#C06060" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="9" y1="1" x2="1" y2="9" stroke="#C06060" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <span className="text-base font-light text-foreground/80">{point.text}</span>
                  <span className="ml-2 font-tiro text-[#C06060]/40 text-xs">{point.sanskrit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: ancient mirror quote */}
          <div className="relative group">
            <div className="absolute -inset-px rounded-[2.5rem] pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(192,96,96,0.2), transparent, rgba(122,26,26,0.1))' }} aria-hidden="true" />
            <div className="relative p-10 rounded-[2.5rem] border border-[#7A1A1A]/20 group-hover:border-[#7A1A1A]/40
                            transition-all duration-700 text-center space-y-6 backdrop-blur-xl overflow-hidden"
              style={{ background: 'linear-gradient(160deg, rgba(18,8,8,0.95) 0%, rgba(12,5,5,0.98) 100%)' }}>
              {/* Mirror frame top ornament */}
              <div className="flex items-center justify-center gap-2 opacity-30" aria-hidden="true">
                <div className="h-px w-12 bg-[#C06060]" />
                <span className="font-tiro text-[#C06060] text-xs">दर्पण</span>
                <div className="h-px w-12 bg-[#C06060]" />
              </div>
              <p className="font-tiro text-3xl md:text-4xl leading-tight text-foreground relative z-10">
                Tatvam is only a mirror —
                <br />
                <span className="text-[#C06060] font-medium">never a commander.</span>
              </p>
              {/* Sanskrit echo */}
              <p className="font-tiro text-[#7A1A1A]/50 text-sm tracking-widest" aria-hidden="true">
                तत्त्वम् केवलं दर्पणम्
              </p>
              {/* Bottom ornament */}
              <div className="flex items-center justify-center gap-2 opacity-30" aria-hidden="true">
                <div className="h-px w-12 bg-[#C06060]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C06060]" />
                <div className="h-px w-12 bg-[#C06060]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  );
}
