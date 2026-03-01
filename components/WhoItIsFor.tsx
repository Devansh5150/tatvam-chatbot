export default function WhoItIsFor() {
  const situations = [
    'When loneliness becomes heavy',
    'When duty and desire collide',
    'When fear is louder than reason',
    'When relationships feel unclear',
    'When success or failure disturb the mind',
    'When you need silence more than advice'
  ]

  return (
    <section className="px-6 md:px-12 py-24 md:py-32 relative">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="space-y-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground">
            For moments like these
          </h2>
          <div className="h-0.5 w-24 bg-accent/30 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {situations.map((situation, index) => (
            <div key={index} className="flex flex-col p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:shadow-xl hover:border-accent/20 transition-all duration-500 group backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors backdrop-blur-sm">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              </div>
              <p className="text-xl font-light text-foreground/90 leading-relaxed">
                {situation}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto text-center pt-8 border-t border-border/30">
          <p className="text-lg text-muted-foreground font-light leading-relaxed">
            Tatvam meets you where you are. Not with another voice telling you how to live, but with the quiet clarity of ages.
          </p>
        </div>
      </div>
    </section>
  )
}
