export default function TatvamSources() {
    const sources = [
        'Bhagavad Gita',
        'Ramayana',
        'Mahabharata',
        'Classical Indian philosophical thought'
    ]

    return (
        <section className="px-6 md:px-12 py-24 md:py-32 relative">
            <div className="max-w-4xl mx-auto space-y-16">
                <div className="space-y-4 text-center">
                    <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground">
                        Rooted in Timeless Wisdom
                    </h2>
                    <div className="h-0.5 w-24 bg-accent/30 mx-auto" />
                    <p className="text-xl text-muted-foreground font-light pt-8">
                        Tatvam respectfully draws from:
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sources.map((source, idx) => (
                        <div key={idx} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-accent/40 transition-all duration-500 shadow-sm backdrop-blur-sm">
                            <span className="font-serif text-2xl text-foreground/90 group-hover:text-accent transition-colors">
                                {source}
                            </span>
                            <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-accent text-xl">🕉️</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <p className="font-light italic text-muted-foreground tracking-wide">
                        Presented without distortion and without agenda.
                    </p>
                </div>
            </div>
        </section>
    )
}
