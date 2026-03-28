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
    <section className="px-6 md:px-12 py-28 md:py-36 relative overflow-hidden" aria-labelledby="how-it-works-heading">
      {/* Indigo depth glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/60 blur-[130px] rounded-full -translate-y-24 translate-x-24 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/6 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

      <div className="max-w-5xl mx-auto space-y-20 relative z-10">

        {/* Heading */}
        <div className="space-y-5 text-center">
          <p className="font-tiro text-accent text-lg tracking-[0.2em] opacity-80" aria-hidden="true">
            साधक का मार्ग
          </p>
          <h2 id="how-it-works-heading" className="font-serif text-4xl md:text-5xl font-medium text-foreground">
            The Path of the Seeker
          </h2>
          <SectionOrnament />
          <p className="text-foreground/40 text-base font-light tracking-[0.3em] uppercase">
            Four sacred steps
          </p>
        </div>

        {/* Vertical timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Connecting pillar line */}
          <div className="absolute left-9 top-0 bottom-0 w-px pointer-events-none"
            aria-hidden="true"
            style={{ background: 'linear-gradient(to bottom, var(--accent), var(--primary), transparent)' }} />

          <div className="space-y-0" role="list" aria-label="Steps to Reflection">
            {steps.map((step, idx) => (
              <div key={step.number} role="listitem" className="relative flex gap-8 group pb-16 last:pb-0">
                {/* Step node */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center
                                  border border-accent/30 group-hover:border-accent/60
                                  transition-all duration-500 group-hover:scale-110"
                    aria-hidden="true"
                    style={{ background: 'linear-gradient(135deg, rgba(8,7,6,0.98), rgba(22,16,8,0.95))' }}>
                    <div className="text-center">
                      <div className="font-tiro text-accent text-xl leading-none">{step.deva}</div>
                    </div>
                    {/* Outer pulse ring on hover */}
                    <div className="absolute inset-0 rounded-full border border-accent/0 group-hover:border-accent/30
                                    group-hover:scale-125 transition-all duration-700" />
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 pt-2 pb-2">
                  <div className="p-7 rounded-2xl border border-accent/10 group-hover:border-accent/30
                                  transition-all duration-500 group-hover:shadow-[0_8px_40px_-8px_rgba(201,151,110,0.15)]
                                  group-hover:-translate-y-0.5 backdrop-blur-sm"
                    style={{ background: 'linear-gradient(135deg, rgba(8,7,6,0.9) 0%, rgba(18,13,7,0.85) 100%)' }}>
                    {/* Sanskrit subtitle */}
                    <p className="font-tiro text-accent/60 text-sm tracking-wider mb-1" aria-hidden="true">{step.subtitle}</p>
                    <h3 className="font-serif text-xl md:text-2xl font-medium text-foreground leading-tight mb-3
                                   group-hover:text-accent transition-colors duration-500">
                      {step.title}
                    </h3>
                    <p className="text-foreground/60 leading-relaxed font-light text-sm">
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
