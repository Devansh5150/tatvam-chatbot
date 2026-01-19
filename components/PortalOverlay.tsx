'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import WaitlistForm from './WaitlistForm';

interface PortalOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PortalOverlay({ isOpen, onClose }: PortalOverlayProps) {
    const [shouldRender, setShouldRender] = useState(isOpen);

    React.useEffect(() => {
        if (isOpen) setShouldRender(true);
    }, [isOpen]);

    const handleAnimationEnd = () => {
        if (!isOpen) setShouldRender(false);
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onTransitionEnd={handleAnimationEnd}
        >
            {/* Dark Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

            {/* Portal Container */}
            <div className={`relative w-[95vmin] h-[95vmin] md:w-[90vmin] md:h-[90vmin] max-w-[800px] max-h-[800px] flex items-center justify-center transition-all duration-1000 ${isOpen ? 'animate-portal-open scale-100' : 'scale-0'}`}>

                {/* Rotating Spark Rings */}
                <div className="absolute inset-0 animate-portal-spin origin-center">
                    {/* Ring 1 - Intense Spark */}
                    <div className="absolute inset-0 rounded-full md:rounded-full border-[4px] md:border-[6px] border-accent/40 shadow-[0_0_20px_rgba(201,151,110,0.6),_inset_0_0_20px_rgba(201,151,110,0.6)] md:shadow-[0_0_40px_rgba(201,151,110,0.8),_inset_0_0_40px_rgba(201,151,110,0.8)] blur-[2px] animate-spark-flicker" />

                    {/* Ring 2 - Outer Glow */}
                    <div className="absolute -inset-2 md:-inset-4 rounded-full border-2 border-primary/20 shadow-[0_0_30px_rgba(184,149,109,0.2)] md:shadow-[0_0_60px_rgba(184,149,109,0.3)] blur-[4px]" />

                    {/* Spark Particles (Simulated with rotating dots) */}
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-accent rounded-full shadow-[0_0_15px_#C9976E] animate-spark-flicker"
                            style={{
                                top: '50%',
                                left: '50%',
                                transformOrigin: 'center',
                                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translate(48%, 0) scale(${Math.random() * 0.5 + 0.5})`,
                                animationDelay: `${Math.random()}s`
                            }}
                        />
                    ))}
                </div>

                {/* Mystical Mandala Background (Inspired by Dr. Strange) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none origin-center">
                    <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] text-accent fill-none stroke-current stroke-[0.5]">
                        <defs>
                            {/* Path for Symbols */}
                            <path id="symbolCircle" d="M 100, 100 m -88, 0 a 88,88 0 1,1 176,0 a 88,88 0 1,1 -176,0" />
                        </defs>

                        {/* Outer Symbol Ring (Slow Rotation) */}
                        <g className="animate-[portal-spin_60s_linear_infinite]" style={{ transformOrigin: 'center' }}>
                            <circle cx="100" cy="100" r="95" className="stroke-[1] opacity-30" />
                            <circle cx="100" cy="100" r="88" className="stroke-[0.5] opacity-20" />

                            {/* Precisely Anchored Symbols */}
                            {[...Array(24)].map((_, i) => (
                                <text key={i} className="text-[11px] fill-accent opacity-90 font-serif font-bold">
                                    <textPath href="#symbolCircle" startOffset={`${(i * 100) / 24}%`} textAnchor="middle">
                                        {['ॐ', 'त', 'त्व', 'म', 'अ', 'सि'][i % 6]}
                                    </textPath>
                                </text>
                            ))}
                        </g>

                        {/* Geometric Middle Layer (Opposite Rotation) */}
                        <g className="animate-[portal-spin_40s_linear_infinite_reverse]" style={{ transformOrigin: 'center' }}>
                            <path d="M100 20 L180 100 L100 180 L20 100 Z" className="opacity-30" /> {/* Square 1 */}
                            <path d="M100 20 L180 100 L100 180 L20 100 Z" className="opacity-15" transform="rotate(45 100 100)" /> {/* Square 2 */}
                            <circle cx="100" cy="100" r="75" className="stroke-accent/30 dash-array-2" />
                        </g>

                        {/* Inner Sacred Star (Fast Rotation) */}
                        <g className="animate-[portal-spin_20s_linear_infinite]" style={{ transformOrigin: 'center' }}>
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

                {/* Portal Interior */}
                <div className="relative z-10 w-full h-full rounded-[40px] md:rounded-full overflow-hidden flex items-center justify-center p-4 md:p-12 bg-[#1a1614]/60 border border-white/10 shadow-inner backdrop-blur-md">
                    <div className="w-full h-full flex items-center justify-center px-2 md:px-4">
                        <WaitlistForm isInsidePortal onClose={onClose} />
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-4 md:-top-12 md:right-0 lg:-right-12 text-white/40 hover:text-white transition-colors p-2"
                >
                    <X className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
}
