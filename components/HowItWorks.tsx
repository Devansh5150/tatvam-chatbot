'use client';

import SectionOrnament from './SectionOrnament';

const DEVANAGARI_NUMS = ['१', '२', '३', '४'];

const steps = [
  {
    number: '01',
    deva: '१',
    title: 'You share your state of mind',
    subtitle: 'मन की अवस्था',
    description: 'Write freely — confusion, loneliness, fear, or a question about life. Tatvam listens without judgment.',
    glyph: '✍️',
  },
  {
    number: '02',
    deva: '२',
    title: 'A relevant shlok appears',
    subtitle: 'श्लोक प्रकट होता है',
    description: 'Chosen from the Gita, Ramayana, or Mahabharata to illuminate your present moment.',
    glyph: '📜',
  },
  {
    number: '03',
    deva: '३',
    title: 'You receive it in three layers',
    subtitle: 'त्रिस्तरीय ज्ञान',
    description: 'Sanskrit (original voice), Hindi (living meaning), and English (present relevance).',
    glyph: '🕉️',
  },
  {
    number: '04',
    deva: '४',
    title: 'A gentle reflection',
    subtitle: 'शांत विचार',
    description: 'Not advice — only a doorway to awareness. A single line to sit with in silence.',
    glyph: '🪷',
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 md:px-12 py-28 md:py-36 relative overflow-hidden">
      {/* Indigo depth glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#1A1A2E]/60 blur-[130px] rounded-full -translate-y-24 translate-x-24 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9976E]/6 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-20 relative z-10">

        {/* Heading */}
        <div className="space-y-5 text-center">
          <p className="font-tiro text-[#D4A85A] text-lg tracking-[0.2em] opacity-80">
            साधक का मार्ग
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground">
            The Path of the Seeker
          </h2>
          <SectionOrnament />
          <p className="text-muted-foreground text-base font-light tracking-[0.3em] uppercase">
            Four sacred steps
          </p>
        </div>

        {/* Vertical timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Connecting pillar line */}
          <div className="absolute left-9 top-0 bottom-0 w-px pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, #D4A85A44, #C9976E33, transparent)' }} />

          <div className="space-y-0">
            {steps.map((step, idx) => (
              <div key={step.number} className="relative flex gap-8 group pb-16 last:pb-0">
                {/* Step node */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center
                                  border border-[#C9976E]/30 group-hover:border-[#D4A85A]/60
                                  transition-all duration-500 group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg, rgba(13,10,6,0.98), rgba(22,16,8,0.95))' }}>
                    <div className="text-center">
                      <div className="font-tiro text-[#D4A85A] text-xl leading-none">{step.deva}</div>
                    </div>
                    {/* Outer pulse ring on hover */}
                    <div className="absolute inset-0 rounded-full border border-[#D4A85A]/0 group-hover:border-[#D4A85A]/30
                                    group-hover:scale-125 transition-all duration-700" />
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 pt-2 pb-2">
                  <div className="p-7 rounded-2xl border border-[#C9976E]/10 group-hover:border-[#C9976E]/30
                                  transition-all duration-500 group-hover:shadow-[0_8px_40px_-8px_rgba(201,151,110,0.15)]
                                  group-hover:-translate-y-0.5 backdrop-blur-sm"
                    style={{ background: 'linear-gradient(135deg, rgba(12,9,5,0.9) 0%, rgba(18,13,7,0.85) 100%)' }}>
                    {/* Sanskrit subtitle */}
                    <p className="font-tiro text-[#C9976E]/60 text-sm tracking-wider mb-1">{step.subtitle}</p>
                    <h3 className="font-serif text-xl md:text-2xl font-medium text-foreground leading-tight mb-3
                                   group-hover:text-[#D4A85A] transition-colors duration-500">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed font-light text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
