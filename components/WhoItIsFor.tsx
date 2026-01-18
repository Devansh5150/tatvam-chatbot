export default function WhoItIsFor() {
  const situations = [
    'When you face a difficult decision and need clarity',
    'When grief or loss feels overwhelming',
    'When you struggle with purpose or meaning',
    'When conflict arises in your relationships',
    'When fear or doubt paralyzes you',
    'When success leaves you empty',
    'When you feel lost or disconnected',
    'When you need to understand yourself better',
    'When the world feels chaotic or unjust',
    'When you seek a deeper way of living'
  ]

  return (
    <section className="px-6 md:px-12 py-20 md:py-32 bg-secondary/30 border-t border-border">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="font-serif text-4xl md:text-5xl font-600 leading-tight text-balance text-foreground">
          Who It Is For
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {situations.map((situation, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-2 h-2 mt-2.5 bg-accent rounded-full"></div>
              <p className="text-foreground leading-relaxed">
                {situation}
              </p>
            </div>
          ))}
        </div>

        <p className="text-lg text-foreground leading-relaxed pt-4 border-t border-border">
          Tatvam is for anyone who seeks understanding. Not advice, not instruction—but the gentle wisdom that helps you see your own path more clearly.
        </p>
      </div>
    </section>
  )
}
