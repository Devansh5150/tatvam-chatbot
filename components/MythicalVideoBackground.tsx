'use client';

import React, { useEffect, useState } from 'react';

interface MythicalVideoBackgroundProps {
  videoId?: string;
  opacity?: number;
}

// Ambient/cinematic videos that allow embedding
const SACRED_VIDEOS = [
  'mPnP2Bom4Es', // Hindu temple ambience - nature/ambient, embeddable
  'aatr_2MstrI', // Om chanting ambience
  '77ZozI0rw7w', // Cosmic space ambient
  'hHW1oY26kxQ', // Indian classical music ambience
];

export default function MythicalVideoBackground({
  videoId,
  opacity = 0.45,
}: MythicalVideoBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState('');

  useEffect(() => {
    setMounted(true);
    const vid = videoId || SACRED_VIDEOS[Math.floor(Math.random() * SACRED_VIDEOS.length)];
    setSelectedVideo(vid);
  }, [videoId]);

  if (!mounted || !selectedVideo) return <div className="fixed inset-0 bg-[#080706]" />;

  const src = `https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playlist=${selectedVideo}&rel=0&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0`;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#080706]"
      aria-hidden="true"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full min-h-[56.25vw] h-full">
        <iframe
          className="w-full h-full"
          style={{ opacity, filter: 'contrast(1.1) brightness(1.05)' }}
          src={src}
          allow="autoplay; encrypted-media"
          frameBorder="0"
          title="background"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#080706] via-transparent to-[#080706] opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080706] via-transparent to-[#080706] opacity-60" />
    </div>
  );
}
