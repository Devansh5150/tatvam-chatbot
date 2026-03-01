export default function WhatTatvamIsNot() {
    const points = [
        'Not a chatbot that gives life instructions',
        'Not preaching or moral policing',
        'Not astrology or prediction',
        'Not therapy or counselling',
        'Not motivational quotes'
    ]

    return (
        <section className="px-6 md:px-12 py-24 md:py-32 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/5 blur-[120px] rounded-full translate-x-32 -translate-y-32" />

            <div className="max-w-4xl mx-auto space-y-16 relative z-10">
                <div className="space-y-4 text-center">
                    <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground">
                        What Tatvam is Not
                    </h2>
                    <div className="h-0.5 w-24 bg-destructive/20 mx-auto" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        {points.map((point, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-destructive/20 transition-all duration-300 backdrop-blur-sm">
                                <div className="w-6 h-6 rounded-full border border-destructive/30 flex items-center justify-center text-destructive text-xs group-hover:bg-destructive group-hover:text-white transition-colors">
                                    ✕
                                </div>
                                <span className="text-lg font-light text-foreground/80">{point}</span>
                            </div>
                        ))}
                    </div>

                    <div className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 text-center space-y-6 relative overflow-hidden group shadow-sm backdrop-blur-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <p className="font-tiro text-3xl md:text-4xl leading-tight text-white relative z-10">
                            Tatvam is only a mirror—<br />
                            <span className="text-destructive font-medium">never a commander.</span>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
