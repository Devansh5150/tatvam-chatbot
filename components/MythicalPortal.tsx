'use client';

import React, { useEffect, useState } from 'react';

interface MythicalPortalProps {
    children: React.ReactNode;
    isOpen?: boolean;
}

export default function MythicalPortal({ children, isOpen = true }: MythicalPortalProps) {
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setShouldRender(true);
    }, [isOpen]);

    const handleAnimationEnd = () => {
        if (!isOpen) setShouldRender(false);
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`flex items-center justify-center transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onTransitionEnd={handleAnimationEnd}
        >
            {/* Portal Container */}
            <div className={`relative w-[95vmin] h-[95vmin] md:w-[85vmin] md:h-[85vmin] max-w-[700px] max-h-[700px] flex items-center justify-center transition-all duration-1000 ${isOpen ? 'animate-portal-open scale-100' : 'scale-0'}`}>

                {/* Rotating Spark Rings */}
                <div className="absolute inset-0 animate-portal-spin origin-center will-change-transform">
                    {/* Ring 1 - Sharp Energized Spark */}
                    <div className="absolute inset-0 rounded-full border-[2px] md:border-[3px] border-accent/60 shadow-[0_0_15px_rgba(201,151,110,0.4),_inset_0_0_15px_rgba(201,151,110,0.4)] md:shadow-[0_0_25px_rgba(201,151,110,0.6),_inset_0_0_20px_rgba(201,151,110,0.5)] animate-spark-flicker will-change-[opacity]" />

                    {/* Ring 2 - Subtle High-Resonance Glow */}
                    <div className="absolute -inset-1 rounded-full border-1 border-primary/10 shadow-[0_0_15px_rgba(184,149,109,0.1)] blur-[1px]" />

                    {/* Highly Energized Spark Particles */}
                    {[...Array(24)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-accent rounded-full shadow-[0_0_8px_#C9976E] animate-spark-flicker will-change-[opacity]"
                            style={{
                                top: '50%',
                                left: '50%',
                                transformOrigin: 'center',
                                transform: `translate(-50%, -50%) rotate(${i * 15}deg) translate(49.5%, 0) scale(${0.7 + (i % 3) * 0.1})`,
                                animationDelay: `${(i % 5) * 0.3}s`
                            }}
                        />
                    ))}
                </div>

                {/* Mystical Mandala Background (Indian Version) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none origin-center">
                    <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] text-accent fill-none stroke-current stroke-[0.5]">
                        <defs>
                            <path id="symbolCircle" d="M 100, 100 m -88, 0 a 88,88 0 1,1 176,0 a 88,88 0 1,1 -176,0" />
                        </defs>

                        {/* Outer Symbol Ring */}
                        <g className="animate-[portal-spin_60s_linear_infinite] will-change-transform" style={{ transformOrigin: 'center' }}>
                            <circle cx="100" cy="100" r="95" className="stroke-[1] opacity-30" />
                            <circle cx="100" cy="100" r="88" className="stroke-[0.5] opacity-20" />

                            {/* Tatvam Asi Symbols */}
                            {[...Array(24)].map((_, i) => (
                                <text key={i} className="text-[12px] fill-accent opacity-90 font-serif font-bold">
                                    <textPath href="#symbolCircle" startOffset={`${(i * 100) / 24}%`} textAnchor="middle">
                                        {['ॐ', 'त', 'तत्त्व', 'म', 'अ', 'सि'][i % 6]}
                                    </textPath>
                                </text>
                            ))}
                        </g>

                        {/* Geometric Middle Layer */}
                        <g className="animate-[portal-spin_40s_linear_infinite_reverse] will-change-transform" style={{ transformOrigin: 'center' }}>
                            <path d="M100 20 L180 100 L100 180 L20 100 Z" className="opacity-30" />
                            <path d="M100 20 L180 100 L100 180 L20 100 Z" className="opacity-15" transform="rotate(45 100 100)" />
                            <circle cx="100" cy="100" r="75" className="stroke-accent/30" strokeDasharray="2 4" />
                        </g>

                        {/* Inner Sacred Star */}
                        <g className="animate-[portal-spin_20s_linear_infinite] will-change-transform" style={{ transformOrigin: 'center' }}>
                            {[...Array(12)].map((_, i) => (
                                <path
                                    key={i}
                                    d="M100 40 L110 90 L100 100 L90 90 Z"
                                    className="fill-accent/10 stroke-accent/40"
                                    transform={`rotate(${i * 30} 100 100)`}
                                />
                            ))}
                            <circle cx="100" cy="100" r="30" className="stroke-accent/50" />
                        </g>
                    </svg>
                </div>

                {/* Portal Interior Content Container */}
                <div className="relative z-10 w-[84%] h-[84%] rounded-full overflow-hidden flex items-center justify-center p-4 md:p-10 bg-black/60 border border-white/5 shadow-inner backdrop-blur-xl">
                    <div className="w-full h-full flex items-center justify-center">
                        {children}
                    </div>
                </div>
            </div>
        </div>

    );
}
