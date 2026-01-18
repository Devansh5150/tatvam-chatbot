export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'You share your state of mind',
      description: 'Write freely—confusion, loneliness, fear, or a question about life. Tatvam listens without judgment.',
      icon: '✍️'
    },
    {
      number: '02',
      title: 'A relevant shlok appears',
      description: 'Chosen from the Gita, Ramayana, or Mahabharata to illuminate your present moment.',
      icon: '📜'
    },
    {
      number: '03',
      title: 'You receive it in three layers',
      description: 'Sanskrit (original voice), Hindi (living meaning), and English (present relevance).',
      icon: '🧘'
    },
    {
      number: '04',
      title: 'A gentle reflection',
      description: 'Not advice—only a doorway to awareness. A single line to sit with in silence.',
      icon: '✨'
    }
  ]

  return (
    <section className="px-6 md:px-12 py-24 md:py-32 bg-secondary/20 border-t border-border/50">
      <div className="max-w-6xl mx-auto space-y-20">
        <div className="space-y-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground">
            How it Works
          </h2>
          <p className="text-muted-foreground text-lg font-light tracking-wide uppercase">4 Simple Steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="relative group p-8 rounded-3xl bg-background border border-border/50 hover:border-accent/30 transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1">
              <div className="text-4xl mb-6">{step.icon}</div>
              <div className="space-y-4">
                <span className="text-xs font-mono text-accent/60 tracking-tighter block">{step.number}</span>
                <h3 className="font-serif text-xl font-medium text-foreground leading-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-light text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
