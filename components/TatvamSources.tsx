'use client';

import SectionOrnament from './SectionOrnament';

const sources = [
  {
    name: 'Bhagavad Gita',
    sanskrit: 'श्रीमद्भगवद्गीता',
    language: '700 verses · Sanskrit',
    desc: 'The dialogue between Krishna and Arjuna on duty, action, and the eternal self.',
    color: '#D4A85A',
    glow: 'rgba(212,168,90,0.12)',
  },
  {
    name: 'Ramayana',
    sanskrit: 'वाल्मीकि रामायण',
    language: '24,000 verses · Sanskrit',
    desc: 'Valmiki\'s epic of Rama — dharma, devotion, and the ideal human life.',
    color: '#C9976E',
    glow: 'rgba(201,151,110,0.12)',
  },
  {
    name: 'Mahabharata',
    sanskrit: 'महाभारत',
    language: '100,000 verses · Sanskrit',
    desc: 'The longest epic — war, wisdom, morality, and the infinite complexity of human nature.',
    color: '#A87B50',
    glow: 'rgba(168,123,80,0.12)',
  },
  {
    name: 'Classical Indian Philosophy',
    sanskrit: 'भारतीय दर्शन',
    language: 'Vedanta · Nyaya · Samkhya',
    desc: 'The distilled philosophical traditions that have guided seekers for millennia.',
    color: '#8B9E6E',
    glow: 'rgba(139,158,110,0.1)',
  },
];

export default function TatvamSources() {
  return (
    <section className="px-6 md:px-12 py-28 md:py-36 relative overflow-hidden" aria-labelledby="tatvam-sources-heading">
      {/* Deep warm glow */}
      <div className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, var(--sacred-glow), transparent 70%)' }} />

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">

        {/* Heading */}
        <div className="space-y-5 text-center">
          <p className="font-tiro text-accent text-lg tracking-[0.2em] opacity-80" aria-hidden="true">
            शाश्वत ज्ञान की जड़ें
          </p>
          <h2 id="tatvam-sources-heading" className="font-serif text-4xl md:text-5xl font-medium text-foreground">
            Rooted in Timeless Wisdom
          </h2>
          <SectionOrnament />
          <p className="text-xl text-foreground/60 font-light font-tiro pt-2">
            Tatvam respectfully draws from:
          </p>
        </div>

        {/* Manuscript cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" role="list" aria-label="Wisdom Sources">
          {sources.map((source, idx) => (
            <div key={idx} role="listitem" className="relative group overflow-hidden">
              {/* Hover glow */}
              <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                aria-hidden="true"
                style={{ background: `radial-gradient(circle at 50% 50%, ${source.glow}, transparent 70%)` }} />

              <div className="relative p-8 rounded-2xl border transition-all duration-500 group-hover:-translate-y-1
                              group-hover:shadow-[0_12px_50px_-10px] backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(145deg, rgba(8,7,6,0.97), rgba(18,14,10,0.93))',
                  borderColor: `${source.color}22`,
                  ['--tw-shadow-color' as string]: source.glow,
                }}>

                {/* Top accent bar */}
                <div className="absolute top-0 left-8 right-8 h-px"
                  aria-hidden="true"
                  style={{ background: `linear-gradient(to right, transparent, ${source.color}50, transparent)` }} />

                {/* Content */}
                <div className="space-y-4">
                  {/* Sanskrit name */}
                  <p className="font-tiro text-sm tracking-wider" aria-hidden="true" style={{ color: `${source.color}80` }}>
                    {source.sanskrit}
                  </p>

                  {/* Title with flame hover icon */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-2xl text-foreground/90 group-hover:text-foreground
                                   transition-colors duration-400 leading-tight">
                      {source.name}
                    </h3>
                    {/* Diya glow icon */}
                    <div className="w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      aria-hidden="true"
                      style={{ borderColor: `${source.color}40`, background: `${source.glow}` }}>
                      <span className="text-base" style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}>🪔</span>
                    </div>
                  </div>

                  {/* Language/scale tag */}
                  <p className="text-xs tracking-[0.2em] uppercase opacity-50" style={{ color: source.color }}>
                    {source.language}
                  </p>

                  {/* Description */}
                  <p className="text-sm font-light text-foreground/60 leading-relaxed">
                    {source.desc}
                  </p>
                </div>

                {/* Bottom accent bar */}
                <div className="absolute bottom-0 left-8 right-8 h-px"
                  aria-hidden="true"
                  style={{ background: `linear-gradient(to right, transparent, ${source.color}20, transparent)` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Closing line */}
        <div className="text-center space-y-3">
          <p className="font-tiro text-accent/40 text-2xl" aria-hidden="true">🕉️</p>
          <p className="font-light italic text-foreground/70 tracking-wide">
            Presented without distortion and without agenda.
          </p>
          <p className="font-tiro text-accent/40 text-sm tracking-widest" aria-hidden="true">
            बिना विकृति, बिना उद्देश्य
          </p>
        </div>


      </div>
    </section>
  );
}
