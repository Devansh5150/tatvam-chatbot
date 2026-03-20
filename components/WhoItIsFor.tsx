'use client';

import SectionOrnament from './SectionOrnament';

const situations = [
  { text: 'When loneliness becomes heavy', sanskrit: 'एकाकीपन' },
  { text: 'When duty and desire collide', sanskrit: 'कर्तव्य vs इच्छा' },
  { text: 'When fear is louder than reason', sanskrit: 'भय' },
  { text: 'When relationships feel unclear', sanskrit: 'सम्बन्ध' },
  { text: 'When success or failure disturb the mind', sanskrit: 'सफलता' },
  { text: 'When you need silence more than advice', sanskrit: 'मौन' },
];

export default function WhoItIsFor() {
  return (
    <section className="px-6 md:px-12 py-28 md:py-36 relative overflow-hidden">
      {/* Indigo night sky gradient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(26,26,46,0.5) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(201,151,110,0.04), transparent)' }} />
      {/* Subtle starfield */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
        }} />

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">

        {/* Heading */}
        <div className="space-y-5 text-center">
          <p className="font-tiro text-[#D4A85A] text-lg tracking-[0.2em] opacity-80">
            अर्जुन की तरह
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground">
            For moments like these
          </h2>
          <SectionOrnament />
          <p className="text-muted-foreground text-base font-light italic font-tiro">
            Like Arjuna on the battlefield — when the weight of life silences words.
          </p>
        </div>

        {/* Situation grid — palm leaf scroll cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {situations.map((situation, index) => (
            <div key={index}
              className="relative flex flex-col p-7 rounded-2xl border border-[#C9976E]/10
                         hover:border-[#D4A85A]/35 transition-all duration-500 group backdrop-blur-sm
                         hover:shadow-[0_8px_40px_-8px_rgba(201,151,110,0.2)] hover:-translate-y-1"
              style={{ background: 'linear-gradient(145deg, rgba(12,9,5,0.95) 0%, rgba(20,15,8,0.9) 100%)' }}>

              {/* Dharma chakra dot */}
              <div className="w-10 h-10 rounded-full border border-[#C9976E]/25 flex items-center justify-center
                              mb-5 group-hover:border-[#D4A85A]/50 group-hover:bg-[#D4A85A]/5 transition-all duration-400">
                {/* Mini chakra */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" opacity="0.7">
                  <circle cx="8" cy="8" r="6.5" stroke="#C9976E" strokeWidth="1" />
                  <circle cx="8" cy="8" r="2" fill="#C9976E" />
                  {[0, 45, 90, 135].map(a => (
                    <line key={a}
                      x1={8 + 2.5 * Math.cos(a * Math.PI / 180)}
                      y1={8 + 2.5 * Math.sin(a * Math.PI / 180)}
                      x2={8 + 6 * Math.cos(a * Math.PI / 180)}
                      y2={8 + 6 * Math.sin(a * Math.PI / 180)}
                      stroke="#C9976E" strokeWidth="1" strokeLinecap="round" />
                  ))}
                </svg>
              </div>

              {/* Sanskrit label */}
              <p className="font-tiro text-[#C9976E]/50 text-xs tracking-wider mb-1">{situation.sanskrit}</p>
              <p className="text-lg font-light text-foreground/90 leading-relaxed italic font-serif">
                {situation.text}
              </p>
            </div>
          ))}
        </div>

        {/* Closing wisdom */}
        <div className="max-w-2xl mx-auto text-center pt-4 border-t border-[#C9976E]/10 space-y-3">
          <p className="text-lg text-muted-foreground font-light leading-relaxed">
            Tatvam meets you where you are. Not with another voice telling you how to live,
            but with the <span className="text-[#D4A85A] font-serif italic">quiet clarity of ages.</span>
          </p>
          <p className="font-tiro text-[#C9976E]/40 text-sm">युगों की शांत स्पष्टता</p>
        </div>

      </div>
    </section>
  );
}
