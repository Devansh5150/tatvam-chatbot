export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'You share what you face',
      description: 'Tell Tatvam about the situation, challenge, or question on your mind.'
    },
    {
      number: 2,
      title: 'A shlok is offered',
      description: 'We present a verse from the scriptures that speaks directly to your moment.'
    },
    {
      number: 3,
      title: 'Sanskrit + Hindi + English + audio',
      description: 'Experience the wisdom in its original form, translated meanings, and listened voice.'
    },
    {
      number: 4,
      title: 'Gentle reflection',
      description: 'Contemplate the verse and how it illuminates your own understanding.'
    }
  ]

  return (
    <section className="px-6 md:px-12 py-20 md:py-32 bg-secondary/40 border-t border-border">
      <div className="max-w-4xl mx-auto space-y-12">
        <h2 className="font-serif text-4xl md:text-5xl font-600 leading-tight text-balance text-foreground">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {steps.map((step) => (
            <div key={step.number} className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-accent text-accent rounded-full">
                  <span className="font-serif text-sm font-600">{step.number}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-600 mb-2 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
