'use client';

import React from 'react';
import Link from 'next/link';
import MythicalPortal from '@/components/MythicalPortal';

export default function ReflectionErrorPage() {
  return (
    <main className="min-h-screen bg-[#080706] flex flex-col items-center justify-center relative overflow-hidden py-12 px-6">
      <MythicalPortal>
        <div className="relative z-10 w-full max-w-md mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="font-serif text-4xl md:text-6xl text-destructive font-light tracking-tight">
              Path Restricted
            </h1>
            <div className="h-px w-24 bg-destructive/30 mx-auto" />
            <p className="text-foreground/60 font-sans text-sm md:text-base leading-relaxed">
              The reflection chamber is currently undergoing sacred purification. 
              New journeys cannot be initiated at this moment.
            </p>
          </div>

          <div className="pt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold tracking-[0.2em] uppercase text-[11px] transition-all duration-500 hover:bg-accent/20 hover:scale-105 active:scale-95"
            >
              Return to Silence
            </Link>
          </div>
        </div>
      </MythicalPortal>
    </main>
  );
}
