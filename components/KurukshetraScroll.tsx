'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Act = 0 | 1 | 2 | 3 | 4 | 5;

// ─── Act durations (ms) ───────────────────────────────────────────────────────

const ACT_DURATIONS = [2800, 2600, 2800, 2800, 2600]; // 5 acts, total ~13.6s

// ─── Sky backgrounds per act ─────────────────────────────────────────────────

const SKY_CLASSES: Record<number, string> = {
  0: 'from-[#0A0818] via-[#1A1030] to-[#0A0806]',
  1: 'from-[#1A0E04] via-[#3D1A08] to-[#0A0806]',
  2: 'from-[#2A1408] via-[#8B3A08] to-[#1A0E06]',
  3: 'from-[#1A1208] via-[#2A1A08] to-[#0A0806]',
  4: 'from-[#080612] via-[#0D0A18] to-[#080706]',
};

// ─── Fireflies ────────────────────────────────────────────────────────────────

const STATIC_FIREFLIES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 11) % 97),
  y: ((i * 53 + 7) % 90),
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

// ─── SVG Art ─────────────────────────────────────────────────────────────────

const Mountains = () => (
  <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
    <svg viewBox="0 0 1440 200" className="w-full h-full" preserveAspectRatio="none">
      <path d="M0,200 L0,120 L80,60 L160,100 L280,20 L400,80 L520,30 L640,90 L720,40 L840,100 L960,50 L1080,110 L1200,60 L1320,90 L1440,70 L1440,200 Z" fill="#0A0806" />
      <path d="M0,200 L0,140 L100,100 L200,130 L320,80 L440,120 L560,90 L680,140 L800,100 L920,130 L1040,95 L1160,130 L1280,110 L1440,125 L1440,200 Z" fill="rgba(26,22,20,0.6)" />
    </svg>
  </div>
);

// ─── Scene data ───────────────────────────────────────────────────────────────

const ACTS = [
  {
    id: 0,
    art: <Mountains />,
    title: 'At the dawn of the greatest war ever witnessed...',
    subtitle: 'KURUKSHETRA — THE FIELD OF DHARMA',
  },
  {
    id: 1,
    art: <Mountains />,
    title: 'Two great armies stood facing each other, bound by duty.',
    subtitle: 'THE PANDAVAS AND KAURAVAS',
  },
  {
    id: 2,
    art: <Mountains />,
    title: 'Arjuna rode between two worlds, the chariot guided by the divine.',
    subtitle: 'KRISHNA AND ARJUNA — TEACHER AND SEEKER',
  },
  {
    id: 3,
    art: <Mountains />,
    sanskrit: 'दृष्ट्वेमं स्वजनं कृष्ण युयुत्सुं समुपस्थितम्',
    title: '"Seeing my own kin standing ready for battle, Krishna... my limbs fail."',
    subtitle: 'BHAGAVAD GITA 1.28 — ARJUNA\'S GRIEF',
  },
  {
    id: 4,
    art: <Mountains />,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
    title: 'These words were not for Arjuna alone. They were for every seeker. For you.',
    subtitle: 'TATVAM — WHERE ANCIENT WISDOM MEETS YOUR PRESENT MOMENT',
  },
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressDots({ act }: { act: number }) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
      {ACTS.map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full transition-all duration-500"
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function KurukshetraScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState<number>(-1); // -1 = not started
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actRef = useRef(act);
  actRef.current = act;

  // ─ Start animation when section enters viewport ─
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && actRef.current === -1) {
          startAnimation();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ─ Lock scroll while animation plays ─
  useEffect(() => {
    if (act >= 0 && !done) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [act, done]);

  const startAnimation = () => {
    setAct(0);
    scheduleNext(0);
  };

  const scheduleNext = (currentAct: number) => {
    const duration = ACT_DURATIONS[currentAct];
    timerRef.current = setTimeout(() => {
      const next = currentAct + 1;
      if (next < ACTS.length) {
        setAct(next);
        scheduleNext(next);
      } else {
        setDone(true);
        document.body.style.overflow = '';
      }
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.body.style.overflow = '';
    };
  }, []);

  const currentSky = act >= 0 ? SKY_CLASSES[act] : SKY_CLASSES[0];
  const currentAct = ACTS[act] ?? ACTS[0];

  return (
    <>
      <style>{`
        @keyframes ks-firefly {
          0%,100% { opacity:0; transform:translate(0,0) scale(0.5); }
          25% { opacity:0.8; transform:translate(8px,-12px) scale(1); }
          50% { opacity:0.4; transform:translate(-6px,-20px) scale(0.8); }
          75% { opacity:0.9; transform:translate(12px,-8px) scale(1.1); }
        }
        @keyframes ks-wheel {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div ref={wrapperRef} className="relative w-full h-screen overflow-hidden">

        {/* ── Sky ── */}
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

        {/* ── Stars ── */}
        <div
          className="absolute top-0 left-0 right-0 h-2/3 pointer-events-none opacity-60"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '80px 80px' }}
        />

        {/* ── Fireflies ── */}
        <Fireflies />

        {/* ── Art layer (cross-fades per act) ── */}
        <AnimatePresence mode="sync">
          <motion.div
            key={`art-${act}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
            className="absolute inset-0"
          >
            {act >= 0 && currentAct.art}
          </motion.div>
        </AnimatePresence>

        {/* ── Text layer ── */}
        <AnimatePresence mode="sync">
          {act >= 0 && (
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
          )}
        </AnimatePresence>

        {/* ── Progress dots ── */}
        {act >= 0 && <ProgressDots act={act} />}

        {/* ── Before animation starts ── */}
        {act === -1 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0818] via-[#1A1030] to-[#0A0806]" />
            <div
              className="absolute top-0 left-0 right-0 h-2/3 pointer-events-none opacity-50"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '80px 80px' }}
            />
            <Fireflies />
          </div>
        )}

        {/* ── Done: scroll hint ── */}
        <AnimatePresence>
          {done && (
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

        {/* ── Bottom fade ── */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080706] to-transparent pointer-events-none" />
      </div>
    </>
  );
}
