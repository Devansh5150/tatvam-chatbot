'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'cinematic' | 'manual';

interface Act {
  readonly id: number;
  readonly sanskrit: string;
  readonly title: string;
  readonly subtitle: string;
}

// ─── Act durations (ms) ───────────────────────────────────────────────────────

const ACT_DURATIONS = [2800, 2600, 2800, 2800, 2600];

// ─── Sky backgrounds per act ─────────────────────────────────────────────────

const SKY_CLASSES: Record<number, string> = {
  0: 'from-[#0A0818] via-[#1A1030] to-[#0A0806]',
  1: 'from-[#1A0E04] via-[#3D1A08] to-[#0A0806]',
  2: 'from-[#2A1408] via-[#8B3A08] to-[#1A0E06]',
  3: 'from-[#1A1208] via-[#2A1A08] to-[#0A0806]',
  4: 'from-[#080612] via-[#0D0A18] to-[#080706]',
};

// ─── Scene data ───────────────────────────────────────────────────────────────

const ACTS: Act[] = [
  {
    id: 0,
    sanskrit: 'रामो विग्रहवान् धर्मः',
    title: 'The journey begins in the golden city of Ayodhya...',
    subtitle: 'RAMAYANA — THE PATH OF RIGHTEOUSNESS',
  },
  {
    id: 1,
    sanskrit: 'धैर्यं सर्वत्र साधनम्',
    title: 'Fourteen years of exile. A heart of gold, tested by fate.',
    subtitle: 'THE SACRIFICE OF RAMA',
  },
  {
    id: 2,
    sanskrit: 'दृष्ट्वेमं स्वजनं कृष्ण',
    title: 'Years later, on the dusty fields of Kurukshetra...',
    subtitle: 'MAHABHARATA — THE FIELD OF DHARMA',
  },
  {
    id: 3,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
    title: '"I do not see the point in this war, Krishna... my limbs fail."',
    subtitle: "BHAGAVAD GITA — THE SEEKER'S DILEMMA",
  },
  {
    id: 4,
    sanskrit: 'तत्त्वमसि',
    title: 'These ancient echoes were not just for them. They are for you.',
    subtitle: 'TATVAM — WHERE EVERY EPOS MEETS YOUR SOUL',
  },
];

// ─── Fireflies ────────────────────────────────────────────────────────────────

const STATIC_FIREFLIES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 90,
  size: (i % 3) + 1.2,
  duration: 4 + (i % 5),
  delay: i * 0.23,
}));

const Fireflies = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {STATIC_FIREFLIES.map((p) => (
      <div
        key={p.id}
        className="absolute rounded-full bg-[#FFD700] opacity-0"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          animation: `ks-firefly ${p.duration}s ${p.delay}s ease-in-out infinite`,
          boxShadow: `0 0 ${p.size * 3}px rgba(255,215,0,0.8)`,
        }}
      />
    ))}
  </div>
);

// ─── SVG Mountains ───────────────────────────────────────────────────────────

const Mountains = () => (
  <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
    <svg viewBox="0 0 1440 200" className="w-full h-full" preserveAspectRatio="none">
      <path d="M0,200 L0,120 L80,60 L160,100 L280,20 L400,80 L520,30 L640,90 L720,40 L840,100 L960,50 L1080,110 L1200,60 L1320,90 L1440,70 L1440,200 Z" fill="#0A0806" />
      <path d="M0,200 L0,140 L100,100 L200,130 L320,80 L440,120 L560,90 L680,140 L800,100 L920,130 L1040,95 L1160,130 L1280,110 L1440,125 L1440,200 Z" fill="rgba(26,22,20,0.6)" />
    </svg>
  </div>
);

// ─── Custom Hook: Cinematic Logic ─────────────────────────────────────────────

function useCinematicLogic(isActive: boolean, onDone: () => void) {
  const [act, setAct] = useState<number>(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actRef = useRef(act);
  actRef.current = act;

  const scheduleNext = useCallback((currentAct: number) => {
    timerRef.current = setTimeout(() => {
      const next = currentAct + 1;
      if (next < ACTS.length) {
        setAct(next);
        scheduleNext(next);
      } else {
        onDone();
      }
    }, ACT_DURATIONS[currentAct]);
  }, [onDone]);

  const start = useCallback(() => {
    if (actRef.current === -1) {
      setAct(0);
      scheduleNext(0);
    }
  }, [scheduleNext]);

  const skip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAct(ACTS.length - 1);
    onDone();
  }, [onDone]);

  const jumpTo = useCallback((index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAct(index);
    if (index < ACTS.length - 1) {
      scheduleNext(index);
    } else {
      onDone();
    }
  }, [scheduleNext, onDone]);

  // Scroll lock while cinematic is playing
  useEffect(() => {
    if (isActive && act >= 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [act, isActive]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.body.style.overflow = '';
    };
  }, []);

  return { act, start, skip, jumpTo };
}

// ─── Custom Hook: Manual Scroll Logic ─────────────────────────────────────────

function useManualScrollLogic(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [act, setAct] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sticky = container.querySelector('[data-sticky]') as HTMLElement | null;
      if (!sticky) return;
      const scrollTop = window.scrollY - container.offsetTop;
      const scrollableHeight = container.scrollHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrollTop / scrollableHeight));
      const newAct = Math.min(ACTS.length - 1, Math.floor(progress * ACTS.length));
      setAct(newAct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  const jumpTo = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const scrollableHeight = container.scrollHeight - window.innerHeight;
    const targetProgress = index / ACTS.length;
    const targetScroll = container.offsetTop + targetProgress * scrollableHeight;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  }, [containerRef]);

  return { act, jumpTo };
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

interface ProgressDotsProps {
  readonly act: number;
  readonly onDotClick: (index: number) => void;
}

function ProgressDots({ act, onDotClick }: ProgressDotsProps) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
      {ACTS.map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          aria-label={`Go to scene ${i + 1}`}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-500 cursor-pointer',
            'hover:scale-150 focus:outline-none focus:ring-2 focus:ring-accent/50'
          )}
          style={{
            background: i === act ? '#C9976E' : 'rgba(201,151,110,0.25)',
            transform: i === act ? 'scale(1.3)' : 'scale(1)',
            boxShadow: i === act ? '0 0 8px rgba(201,151,110,0.6)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ─── Mode Toggle ──────────────────────────────────────────────────────────────

interface ModeToggleProps {
  readonly mode: Mode;
  readonly onToggle: () => void;
}

function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={mode === 'cinematic' ? 'Switch to manual scroll mode' : 'Switch to cinematic mode'}
      className={cn(
        'absolute top-6 right-16 z-40 flex items-center gap-2 px-4 py-2 rounded-full',
        'text-xs tracking-widest uppercase font-sans border transition-all duration-500',
        'backdrop-blur-md shadow-lg hover:scale-105 active:scale-95',
        mode === 'cinematic'
          ? 'bg-[#1a1614]/70 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
          : 'bg-accent/20 border-accent/30 text-accent hover:bg-accent/30'
      )}
    >
      <span>{mode === 'cinematic' ? '↕ Manual Scroll' : '▶ Cinematic'}</span>
    </button>
  );
}

// ─── Skip Button ──────────────────────────────────────────────────────────────

interface SkipButtonProps {
  readonly onSkip: () => void;
}

function SkipButton({ onSkip }: SkipButtonProps) {
  return (
    <button
      onClick={onSkip}
      aria-label="Skip cinematic sequence"
      className={cn(
        'absolute top-6 left-6 z-40 px-4 py-2 rounded-full',
        'text-xs tracking-widest uppercase font-sans border transition-all duration-500',
        'bg-[#1a1614]/70 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20',
        'backdrop-blur-md hover:scale-105 active:scale-95'
      )}
    >
      Skip ↓
    </button>
  );
}

// ─── Inner Scene (shared by both modes) ──────────────────────────────────────

interface SceneProps {
  readonly act: number;
}

function Scene({ act }: SceneProps) {
  const currentSky = SKY_CLASSES[act] ?? SKY_CLASSES[0];
  const currentAct = ACTS[act] ?? ACTS[0];

  return (
    <>
      {/* Sky */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`sky-${act}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4 }}
          className={`absolute inset-0 bg-gradient-to-b ${currentSky}`}
        />
      </AnimatePresence>

      {/* Stars */}
      <div
        className="absolute top-0 left-0 right-0 h-2/3 pointer-events-none opacity-60"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '80px 80px' }}
      />

      {/* Fireflies */}
      <Fireflies />

      {/* Art */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`art-${act}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}
          className="absolute inset-0"
        >
          <Mountains />
        </motion.div>
      </AnimatePresence>

      {/* Text */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`text-${act}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center px-6 md:px-20 z-20 pointer-events-none space-y-4"
        >
          {currentAct.sanskrit && (
            <p className="font-tiro text-2xl md:text-4xl text-[#C9976E] leading-relaxed drop-shadow-[0_2px_12px_rgba(201,151,110,0.5)]">
              {currentAct.sanskrit}
            </p>
          )}
          <p className="font-serif text-xl md:text-3xl text-white/90 leading-relaxed max-w-2xl">
            {currentAct.title}
          </p>
          <p className="font-sans text-xs md:text-sm text-white/40 tracking-[0.3em] uppercase">
            {currentAct.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080706] to-transparent pointer-events-none" />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KurukshetraScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('cinematic');
  const [cinematicDone, setCinematicDone] = useState(false);

  const handleCinematicDone = useCallback(() => {
    setCinematicDone(true);
    document.body.style.overflow = '';
  }, []);

  const { act: cinematicAct, start, skip, jumpTo: cinematicJumpTo } = useCinematicLogic(
    mode === 'cinematic' && !cinematicDone,
    handleCinematicDone
  );

  const { act: manualAct, jumpTo: manualJumpTo } = useManualScrollLogic(wrapperRef);

  const activeAct = mode === 'cinematic' ? Math.max(0, cinematicAct) : manualAct;
  const activeJumpTo = mode === 'cinematic' ? cinematicJumpTo : manualJumpTo;

  // Start cinematic on intersection
  useEffect(() => {
    if (mode !== 'cinematic') return;
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) start();
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode, start]);

  const handleModeToggle = () => {
    if (mode === 'cinematic') {
      // Switch to manual: release scroll lock first
      document.body.style.overflow = '';
      setMode('manual');
    } else {
      setMode('cinematic');
      setCinematicDone(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ks-firefly {
          0%,100% { opacity:0; transform:translate(0,0) scale(0.5); }
          25% { opacity:0.8; transform:translate(8px,-12px) scale(1); }
          50% { opacity:0.4; transform:translate(-6px,-20px) scale(0.8); }
          75% { opacity:0.9; transform:translate(12px,-8px) scale(1.1); }
        }
      `}</style>

      {/* ── CINEMATIC MODE ── */}
      {mode === 'cinematic' && (
        <div
          ref={wrapperRef}
          className="relative w-full h-screen overflow-hidden"
          aria-label="Mythological journey cinematic sequence"
        >
          <Scene act={activeAct} />

          {/* Mode toggle */}
          <ModeToggle mode="cinematic" onToggle={handleModeToggle} />

          {/* Skip button (only while playing) */}
          {!cinematicDone && cinematicAct >= 0 && (
            <SkipButton onSkip={skip} />
          )}

          {/* Dots */}
          {cinematicAct >= 0 && (
            <ProgressDots act={activeAct} onDotClick={cinematicJumpTo} />
          )}

          {/* Done: scroll hint */}
          <AnimatePresence>
            {cinematicDone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30 pointer-events-none"
              >
                <p className="text-white/40 text-xs tracking-[0.3em] uppercase font-sans">Continue</p>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="w-px h-8 bg-gradient-to-b from-accent/60 to-transparent"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === 'manual' && (
        <div
          ref={wrapperRef}
          className="relative w-full"
          style={{ height: `${ACTS.length * 100}vh` }}
          aria-label="Mythological journey - scroll to explore"
        >
          {/* Sticky inner panel */}
          <div
            data-sticky
            className="sticky top-0 w-full h-screen overflow-hidden"
          >
            <Scene act={activeAct} />

            {/* Mode toggle */}
            <ModeToggle mode="manual" onToggle={handleModeToggle} />

            {/* Clickable dots */}
            <ProgressDots act={activeAct} onDotClick={manualJumpTo} />

            {/* Scroll progress indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30 pointer-events-none">
              <p className="text-white/30 text-xs tracking-[0.3em] uppercase font-sans">
                {activeAct + 1} / {ACTS.length}
              </p>
              <div className="w-24 h-px bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent/60 rounded-full"
                  animate={{ width: `${((activeAct + 1) / ACTS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              {activeAct < ACTS.length - 1 && (
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="w-px h-6 bg-gradient-to-b from-white/30 to-transparent mt-1"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
