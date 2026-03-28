'use client';

import React, { useEffect, useState } from 'react';

interface MythicalVideoBackgroundProps {
  videoId?: string;
  opacity?: number;
}

export default function MythicalVideoBackground({
  videoId = 'idFMw9hEPgk',
  opacity = 0.12,
}: MythicalVideoBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[-10] overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#080706]/40 z-10" />
      
      {/* Container to scale the iframe to 'cover' */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[100%] min-h-[100%] w-screen aspect-video">
        <iframe
          className="w-full h-full scale-[1.35] opacity-[var(--bg-opacity)] filter grayscale-[0.2] contrast-[1.1] brightness-[0.9]"
          style={{ '--bg-opacity': opacity } as React.CSSProperties}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playlist=${videoId}&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1`}
          allow="autoplay; encrypted-media"
          frameBorder="0"
        />
      </div>

      {/* Foreground gradient blend */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080706] via-transparent to-[#080706] z-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080706]/80 via-transparent to-[#080706]/80 z-20" />
    </div>
  );
}
