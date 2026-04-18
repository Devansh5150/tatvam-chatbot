'use client'

import React from 'react'
import { Mic, Square, Play } from 'lucide-react'
import { useVoiceChat } from '@/hooks/useVoiceChat'

export function VoiceChat() {
  const {
    state,
    transcript,
    englishAudioUrl,
    hindiAudioUrl,
    error,
    startListening,
    stopListening,
    playEnglish,
    playHindi,
  } = useVoiceChat()

  const isActive = state === 'listening' || state === 'thinking' || state === 'speaking'
  const hasAudio = englishAudioUrl || hindiAudioUrl

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto space-y-8 p-6">
      {/* Mic Button */}
      <div className="relative">
        {isActive && (
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping blur-sm"></div>
        )}
        <button
          onClick={state === 'listening' ? stopListening : startListening}
          disabled={state === 'thinking' || state === 'speaking'}
          className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
            state === 'listening'
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]'
              : state === 'thinking' || state === 'speaking'
              ? 'bg-accent/80 text-[#080706]'
              : 'bg-accent hover:bg-accent/90 text-[#080706] shadow-[0_10px_30px_rgba(201,151,110,0.3)]'
          }`}
        >
          {state === 'listening' ? (
            <Square fill="currentColor" size={28} />
          ) : (
            <Mic size={28} />
          )}
        </button>
      </div>

      {/* Status */}
      <div className="text-center h-6">
        {state === 'listening' && <p className="text-accent tracking-[0.2em] uppercase text-xs font-bold animate-pulse">Listening...</p>}
        {state === 'thinking' && <p className="text-white/60 tracking-[0.2em] uppercase text-xs font-bold animate-pulse">Thinking...</p>}
        {state === 'speaking' && <p className="text-accent tracking-[0.2em] uppercase text-xs font-bold animate-bounce">Speaking...</p>}
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* User transcript */}
      {transcript && (
        <div className="flex justify-end w-full">
          <div className="max-w-[80%] bg-white/10 border border-white/5 rounded-2xl rounded-tr-sm p-4 backdrop-blur-sm">
            <p className="text-white/80 font-sans text-sm leading-relaxed">{transcript}</p>
          </div>
        </div>
      )}

      {/* Audio playback buttons */}
      {hasAudio && (
        <div className="flex gap-4 w-full justify-center">
          {englishAudioUrl && (
            <button
              onClick={playEnglish}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all duration-200 font-sans text-sm tracking-wide"
            >
              <Play size={16} fill="currentColor" />
              English
            </button>
          )}
          {hindiAudioUrl && (
            <button
              onClick={playHindi}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all duration-200 font-sans text-sm tracking-wide"
            >
              <Play size={16} fill="currentColor" />
              हिंदी
            </button>
          )}
        </div>
      )}
    </div>
  )
}
