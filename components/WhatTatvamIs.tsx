export default function WhatTatvamIs() {
  return (
    <section className="px-6 md:px-12 py-24 md:py-32 bg-background border-t border-border/50">
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="space-y-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground">
            What is Tatvam?
          </h2>
          <div className="h-0.5 w-24 bg-accent/30 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-8 text-xl leading-relaxed text-muted-foreground">
            <p className="border-l-4 border-accent pl-6 py-2 italic font-tiro text-foreground/90">
              Tatvam is a reflective companion rooted in Indian wisdom.
            </p>
            <p className="font-light">
              It draws from the Bhagavad Gita, Ramayana, and Mahabharata to offer shlok, meaning, and reflection, offered gently, without advice.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl space-y-6">
            <h3 className="font-serif text-2xl text-accent">What you receive:</h3>
            <ul className="space-y-4">
              {[
                { label: 'Sanskrit shlok', icon: '🐚' },
                { label: 'Hindi meaning', icon: '🕊️' },
                { label: 'English understanding', icon: '🕯️' },
                { label: 'Gentle audio', icon: '🎧' },
                { label: 'A single line for reflection', icon: '✨' }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 text-foreground/80">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-light tracking-wide">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center pt-8">
          <p className="text-xl md:text-2xl font-light leading-relaxed text-foreground/80">
            Tatvam does not tell you what to do. <br />
            It only places a thought beside you, so you can <span className="text-accent underline decoration-accent/30 underline-offset-8">meet your own answer.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
