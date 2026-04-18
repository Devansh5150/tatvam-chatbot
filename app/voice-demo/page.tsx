'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'
import { VoiceVisualizer } from '@/components/ui/voice-visualizer'
import { useVoiceInteraction } from '@/hooks/use-voice-interaction'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ChevronLeft, Play, Pause, Sparkles, Volume2 } from 'lucide-react'

const PRESETS = [
  {
    title: "Duty & Detachment",
    verse: "Bhagavad Gita 2.47",
    hindi: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    english: "You have the right to perform your actions, but you are not entitled to the fruits of those actions.",
    full: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥ You have the right to perform your duties, but you are not entitled to the fruits of your actions. Let not the fruits of action be your motive, nor let your attachment be to inaction."
  },
  {
    title: "Inner Peace",
    verse: "Reflection",
    hindi: "शान्तिः आपके भीतर है, उसे बाहर न खोजें।",
    english: "Peace is within you; do not seek it without.",
    full: "Peace is within you; do not seek it without. In the stillness of your heart, the truth resides. Let the high-fidelity voice of ElevenLabs guide you back to your center."
  }
]

export default function VoiceDemoPage() {
  const [inputText, setInputText] = useState(PRESETS[0].full)
  const [activePreset, setActivePreset] = useState(0)
  
  const { 
    isSpeaking, 
    speak, 
    cancelSpeech,
    error: voiceError
  } = useVoiceInteraction()

  const handleSpeak = async () => {
    if (isSpeaking) {
      cancelSpeech()
    } else {
      await speak(inputText)
    }
  }

  const applyPreset = (index: number) => {
    setActivePreset(index)
    setInputText(PRESETS[index].full)
    if (isSpeaking) cancelSpeech()
  }

  return (
    <main className="min-h-screen bg-[#080706] text-white overflow-hidden relative selection:bg-accent/30">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <StarsBackground />
        <ShootingStars />
      </div>

      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col min-h-screen">
        {/* Navigation */}
        <header className="mb-12 flex items-center justify-between">
          <Link href="/sneak-peek" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium tracking-wider uppercase">Back to Sneak Peek</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-amber-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">ElevenLabs Premium</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-center flex-1">
          {/* Left: Interactive Controls */}
          <div className="space-y-10">
            <div className="space-y-4">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight leading-tight">
                Premium <span className="text-accent italic">Voice</span> Experience
              </h1>
              <p className="text-white/50 text-lg max-w-md font-sans leading-relaxed">
                Experience the soul-stirring depth of high-fidelity spiritual reflections powered by ElevenLabs.
              </p>
            </div>

            {/* Language Presets */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-accent/80">
                <Sparkles size={14} />
                <span>Selected Wisdom</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(i)}
                    className={`px-6 py-3 rounded-2xl border transition-all duration-500 text-sm font-medium ${
                      activePreset === i 
                        ? 'bg-accent/10 border-accent text-accent shadow-[0_0_20px_rgba(201,151,110,0.15)]' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-white/40">
                  <Volume2 size={14} />
                  <span>Input Reflection</span>
                </div>
                <button 
                  onClick={() => setInputText('')}
                  className="text-[10px] text-white/30 hover:text-white uppercase tracking-widest"
                >
                  Clear
                </button>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-transparent rounded-[24px] blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter wisdom to hear it spoken..."
                  className="relative min-h-[200px] bg-[#0c0b0a]/90 border-white/10 rounded-[20px] p-6 text-lg font-serif italic text-white/80 focus:ring-accent/40 focus:border-accent/40 transition-all resize-none shadow-2xl"
                />
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleSpeak}
              disabled={!inputText.trim()}
              className={`w-full py-8 rounded-[20px] text-lg font-bold tracking-[0.2em] uppercase transition-all duration-500 group relative overflow-hidden ${
                isSpeaking 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                  : 'bg-accent text-[#080706] hover:scale-[1.02] shadow-[0_20px_40px_rgba(201,151,110,0.2)]'
              }`}
            >
              <span className="relative z-10 flex items-center gap-3">
                {isSpeaking ? (
                  <>
                    <Pause fill="currentColor" size={20} />
                    Silence Voice
                  </>
                ) : (
                  <>
                    <Play fill="currentColor" size={20} />
                    Awaken Reflection
                  </>
                )}
              </span>
              {!isSpeaking && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
            </Button>
            
            {voiceError && (
              <p className="text-red-400/80 text-xs text-center font-medium animate-pulse">
                Note: {voiceError === 'not-allowed' ? 'Provide mic permission for full interaction' : 'Check ElevenLabs configuration'}
              </p>
            )}
          </div>

          {/* Right: Visual Experience */}
          <div className="relative flex items-center justify-center min-h-[400px]">
            {/* Visualizer Container */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <VoiceVisualizer isSpeaking={isSpeaking} />
            </div>

            {/* Central Orb */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isSpeaking ? 'speaking' : 'idle'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="relative z-10 flex flex-col items-center"
              >
                {/* Spiritual Core */}
                <div className="relative">
                  <motion.div
                    animate={{ 
                      scale: isSpeaking ? [1, 1.2, 1] : [1, 1.05, 1],
                      rotate: isSpeaking ? [0, 90, 180, 270, 360] : [0, 360]
                    }}
                    transition={{ 
                      duration: isSpeaking ? 3 : 20, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    className={`w-32 h-32 rounded-full border-2 flex items-center justify-center border-dashed ${
                      isSpeaking ? 'border-accent shadow-[0_0_50px_rgba(201,151,110,0.4)]' : 'border-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
                      isSpeaking ? 'bg-accent scale-150 blur-[2px]' : 'bg-white/20'
                    }`} />
                  </motion.div>
                  
                  {/* Aura rings */}
                  {isSpeaking && [...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 0.5, 0], scale: [0.5, 2.5] }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        delay: i * 0.6,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 rounded-full border border-accent/30"
                    />
                  ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                >
                  <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-accent/60 mb-1">
                    {isSpeaking ? 'Soul is Speaking' : 'Waiting for Stillness'}
                  </p>
                  <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-accent/30 to-transparent mx-auto" />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-xs font-serif italic text-white/70">
            "Words are but footprints of the thought that has already flown."
          </p>
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Stability</span>
              <span className="text-xs text-accent">0.6</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Similarity</span>
              <span className="text-xs text-accent">0.75</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Model</span>
              <span className="text-xs text-accent uppercase">Multilingual v2</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
