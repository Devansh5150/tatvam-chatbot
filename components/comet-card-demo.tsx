import { CometCard } from "@/components/ui/comet-card";

export default function CometCardDemo() {
    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-portal-open">
            <CometCard>
                <div
                    className="relative w-64 md:w-72 cursor-pointer flex flex-col items-stretch rounded-[24px] overflow-hidden border border-white/10 bg-[#1a1614] shadow-2xl"
                    style={{
                        transformStyle: "preserve-3d",
                        opacity: 1,
                    }}
                >
                    {/* Main Imagery */}
                    <div className="mx-3 mt-3 overflow-hidden rounded-[20px] relative aspect-[3/4]">
                        <img
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover contrast-[0.8] brightness-[0.7]"
                            alt="Sacred Space"
                            src="https://images.unsplash.com/photo-1505506874110-6a7a69069a08?q=80&w=1287&auto=format&fit=crop"
                        />

                        {/* Sacred 'Om' Overlay */}
                        <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                            style={{ transform: "translateZ(30px)" }}
                        >
                            <span className="text-8xl md:text-9xl text-accent font-tiro opacity-90 drop-shadow-[0_0_30px_rgba(201,151,110,0.8)] animate-pulse-slow">
                                ॐ
                            </span>
                        </div>

                        {/* Gradient Scrim */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1614] via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Invitation Details */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between font-mono text-xs tracking-widest uppercase opacity-40 text-white">
                            <span>Mystical Invitation</span>
                            <span>#TATVAM-INIT</span>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-white text-xl font-serif tracking-wide">The Journey Begins</h3>
                            <p className="text-accent/60 text-sm font-light italic">"You are the answer."</p>
                        </div>
                    </div>

                    {/* Holographic Border Effect */}
                    <div className="absolute inset-0 rounded-[24px] border-[0.5px] border-white/20 pointer-events-none" />
                </div>
            </CometCard>

            <p className="text-white/40 text-xs font-mono tracking-[0.3em] uppercase animate-pulse">
                Keep this invitation close.
            </p>
        </div>
    );
}
