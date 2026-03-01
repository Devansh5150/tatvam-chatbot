export default function TatvamValues() {
    const values = [
        { title: 'Restraint over noise', description: 'In a world of constant notification, we choose the power of silence.' },
        { title: 'Understanding over advice', description: 'We don’t fix you; we offer the wisdom for you to find your own clarity.' },
        { title: 'Tradition without rigidity', description: 'Ancient roots, meeting the modern mind with grace and openness.' },
        { title: 'Technology with humility', description: 'AI and code, serving as a quiet bridge to the eternal.' },
        { title: 'Presence over persuasion', description: 'We are here when you need us, not a moment before or after.' }
    ]

    return (
        <section className="px-6 md:px-12 py-24 md:py-32 relative">
            <div className="max-w-4xl mx-auto space-y-16">
                <div className="space-y-4 text-center">
                    <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground">
                        The Spirit of Tatvam
                    </h2>
                    <div className="h-0.5 w-24 bg-accent/30 mx-auto" />
                </div>

                <div className="space-y-0 relative">
                    <div className="absolute left-[1.125rem] top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-accent/20 to-transparent" />

                    {values.map((value, idx) => (
                        <div key={idx} className="relative pl-12 pb-16 group last:pb-0">
                            <div className="absolute left-0 top-1.5 w-9 h-9 rounded-full bg-white/5 border border-accent/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 backdrop-blur-sm">
                                <div className="w-2 h-2 bg-accent rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-serif text-2xl text-foreground group-hover:text-accent transition-colors duration-500">
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
        </section>
    )
}
