'use client';

import SectionOrnament from './SectionOrnament';

// SVG lotus node for the timeline
function LotusNode({ active = false }: { active?: boolean }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" stroke={active ? '#D4A85A' : '#C9976E'} strokeWidth="1" opacity={active ? 0.7 : 0.35} />
      {/* Petals */}
      <path d="M18 8 Q18 5 18 5 Q20 11 18 15 Q16 11 18 5 Z" fill="#C9976E" opacity="0.6" />
      <path d="M18 15 Q14 9 11 11 Q13 15 18 15 Z" fill="#C9976E" opacity="0.4" />
      <path d="M18 15 Q22 9 25 11 Q23 15 18 15 Z" fill="#C9976E" opacity="0.4" />
      {/* Center */}
      <circle cx="18" cy="13" r="2" fill="#D4A85A" opacity="0.9" />
    </svg>
  );
}

const values = [
  {
    title: 'Restraint over noise',
    subtitle: 'मौन का बल',
    description: 'In a world of constant notification, we choose the power of silence.',
  },
  {
    title: 'Understanding over advice',
    subtitle: 'बोध, उपदेश नहीं',
    description: 'We don\'t fix you; we offer the wisdom for you to find your own clarity.',
  },
  {
    title: 'Tradition without rigidity',
    subtitle: 'परम्परा, बंधन नहीं',
    description: 'Ancient roots, meeting the modern mind with grace and openness.',
  },
  {
    title: 'Technology with humility',
    subtitle: 'विनम्र तकनीक',
    description: 'AI and code, serving as a quiet bridge to the eternal.',
  },
  {
    title: 'Presence over persuasion',
    subtitle: 'उपस्थिति, प्रेरणा नहीं',
    description: 'We are here when you need us, not a moment before or after.',
  },
];

export default function TatvamValues() {
  return (
    <section className="px-6 md:px-12 py-28 md:py-36 relative overflow-hidden">
      {/* Om watermarks */}
      {['-10% 20%', '90% 60%', '40% 85%'].map((pos, i) => (
        <div key={i}
          className="absolute pointer-events-none select-none font-tiro text-[#C9976E]"
          style={{ left: pos.split(' ')[0], top: pos.split(' ')[1], fontSize: '180px', opacity: 0.02, transform: 'rotate(-15deg)', lineHeight: 1 }}>
          ॐ
        </div>
      ))}
      {/* Saffron pillar glow */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none hidden md:block"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,151,110,0.08), transparent)' }} />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">

        {/* Heading */}
        <div className="space-y-5 text-center">
          <p className="font-tiro text-[#D4A85A] text-lg tracking-[0.2em] opacity-80">
            तत्त्व के मूल्य
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground">
            The Spirit of Tatvam
          </h2>
          <SectionOrnament />
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Temple pillar line */}
          <div className="absolute left-[1.125rem] top-0 bottom-0 w-px pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, #D4A85A55, #C9976E33, rgba(201,151,110,0.05))' }} />

          <div className="space-y-0">
            {values.map((value, idx) => (
              <div key={idx} className="relative pl-14 pb-14 group last:pb-0 flex gap-0">
                {/* Lotus node */}
                <div className="absolute left-0 top-0 transition-transform duration-500 group-hover:scale-110">
                  <LotusNode active={idx === 0} />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <p className="font-tiro text-[#C9976E]/50 text-xs tracking-wider">{value.subtitle}</p>
                  <h3 className="font-serif text-2xl md:text-3xl text-foreground group-hover:text-[#D4A85A]
                                 transition-colors duration-500">
                    {value.title}
                  </h3>
                  <p className="text-lg font-light text-muted-foreground leading-relaxed max-w-2xl">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
