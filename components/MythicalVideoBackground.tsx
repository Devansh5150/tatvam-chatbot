'use client';

import React, { useEffect, useState } from 'react';

interface MythicalVideoBackgroundProps {
  videoId?: string;
  opacity?: number;
}

export default function MythicalVideoBackground({
  videoId = 'idFMw9hEPgk',
  opacity = 0.4, // Increased default
}: MythicalVideoBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none bg-[#080706]"
      aria-hidden="true"
    >
      {/* Container to scale the iframe to 'cover' */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[112vw] h-[112vh]">
        <iframe
          className="w-full h-full opacity-[var(--bg-opacity)] filter contrast-[1.1] brightness-[1.05]"
          style={{ '--bg-opacity': opacity } as React.CSSProperties}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playlist=${videoId}&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          allow="autoplay; encrypted-media; gyroscope;"
          frameBorder="0"
        />
      </div>

      {/* Sacred Blend Overlays - Adjusted for higher visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080706] via-transparent to-[#080706] opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080706] via-transparent to-[#080706] opacity-60" />
    </div>
  );
}
