'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import dynamic from 'next/dynamic'
import { RotateCcw } from 'lucide-react'
import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'
import { useVoiceInteraction } from '@/hooks/use-voice-interaction'

const MonkAvatar = dynamic(() => import('@/components/MonkAvatar'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type PortalState = 'connecting' | 'idle' | 'listening' | 'thinking' | 'speaking'

const STATE_CONFIG: Record<PortalState, { label: string; sublabel: string; dot: string }> = {
  connecting: { label: 'Connecting',  sublabel: 'Opening the channel…',     dot: 'bg-zinc-400'   },
  idle:       { label: 'Tatvam',      sublabel: 'Tap the monk to speak',    dot: 'bg-amber-400'  },
  listening:  { label: 'Listening',   sublabel: 'Speak freely…',            dot: 'bg-cyan-400'   },
  thinking:   { label: 'Reflecting',  sublabel: 'Tatvam is contemplating…', dot: 'bg-violet-400' },
  speaking:   { label: 'Speaking',    sublabel: 'Hear the wisdom…',         dot: 'bg-orange-300' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripMarkers(text: string): string {
  return text
    .replace(/\[(CHAT|SCRIPTURE|TEACHING|GUIDANCE|ENGLISH_REPLY|HINDI_REPLY)\]/gi, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function splitSentences(text: string): string[] {
  const clean = stripMarkers(text)
  const matches = clean.match(/[^।.!?]+[।.!?]+(?:\s|$)?/g)
  return matches?.map(s => s.trim()).filter(s => s.length > 3) ?? [clean]
}

// Re-calibrate sentence start times once we know audio.duration
function calcTimings(sentences: string[], totalDuration: number): number[] {
  const wordCounts = sentences.map(s => s.trim().split(/\s+/).length)
  const total = wordCounts.reduce((a, b) => a + b, 0)
  const leadIn = 0.2
  let t = leadIn
  return wordCounts.map(wc => {
    const start = t
    t += (wc / total) * (totalDuration - leadIn)
    return start
  })
}

// ─── Waveform (CSS-animated, no AudioContext) ─────────────────────────────────

const BAR_SCALES = [0.55, 0.85, 1.0, 0.9, 0.75, 0.95, 0.60]

function SpeakingWaveform() {
  return (
    <div className="flex items-end justify-center gap-[3px] h-7">
      {BAR_SCALES.map((scale, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-amber-400/60"
          animate={{ height: ['3px', `${Math.round(28 * scale)}px`, '3px'] }}
          transition={{
            duration: 0.38 + i * 0.06,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: i * 0.045,
          }}
        />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PortalPage() {
  const router = useRouter()

  const [status, setStatus]         = useState<PortalState>('connecting')
  const [userText, setUserText]     = useState('')
  const [sentences, setSentences]   = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [englishAudioUrl, setEnglishAudioUrl] = useState<string | null>(null)
  const [hindiAudioUrl, setHindiAudioUrl]     = useState<string | null>(null)
  const [replayReady, setReplayReady] = useState(false)
  const [apiError, setApiError]     = useState<string | null>(null)

  const audioRef      = useRef<HTMLAudioElement | null>(null)
  const rafRef        = useRef<number | null>(null)
  const timingsRef    = useRef<number[]>([])
  const sentencesRef  = useRef<string[]>([])
  const prevEngUrl    = useRef<string | null>(null)
  const prevHinUrl    = useRef<string | null>(null)
  const processedRef  = useRef('')
  const statusRef     = useRef<PortalState>('connecting')
  const btsCancelRef  = useRef(false)   // browser TTS cancellation flag

  useEffect(() => { statusRef.current = status }, [status])

  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening,
    cancelSpeech,
  } = useVoiceInteraction()

  // ── Auto-start ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setStatus('listening')
      startListening('en-IN')
    }, 1800)
    return () => {
      clearTimeout(t)
      btsCancelRef.current = true
      cancelSpeech()
      stopListening()
      stopTracking()
      if (audioRef.current) audioRef.current.pause()
      window.speechSynthesis?.cancel()
    }
  }, [])

  // ── Live transcript display ──────────────────────────────────────────────
  useEffect(() => { if (interimTranscript) setUserText(interimTranscript) }, [interimTranscript])
  useEffect(() => { if (transcript) setUserText(transcript) }, [transcript])

  // ── Trigger conversation on final transcript ─────────────────────────────
  useEffect(() => {
    if (transcript && transcript !== processedRef.current && statusRef.current === 'listening') {
      processedRef.current = transcript
      handleConversation(transcript)
    }
  }, [transcript])

  // ─── Sentence tracking (audio.currentTime only, no AudioContext) ──────────

  const stopTracking = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [])

  const startTracking = useCallback((audio: HTMLAudioElement) => {
    stopTracking()
    const step = () => {
      if (!audio || audio.paused || audio.ended) return
      const t = audio.currentTime
      const timings = timingsRef.current
      let idx = 0
      for (let i = timings.length - 1; i >= 0; i--) {
        if (t >= timings[i]) { idx = i; break }
      }
      setCurrentIdx(idx)
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [stopTracking])

  // ─── Audio helpers ────────────────────────────────────────────────────────

  const fetchAudio = async (text: string): Promise<string | null> => {
    if (!text.trim()) return null
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return null
      return URL.createObjectURL(await res.blob())
    } catch { return null }
  }

  // Plain HTMLAudioElement play — no AudioContext, no routing, just plays
  const playAudioUrl = useCallback((url: string, track = false): Promise<void> =>
    new Promise((resolve) => {
      if (audioRef.current) { audioRef.current.pause(); stopTracking() }

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onloadedmetadata = () => {
        if (track && audio.duration && sentencesRef.current.length > 0) {
          timingsRef.current = calcTimings(sentencesRef.current, audio.duration)
        }
      }

      audio.onplay  = () => { if (track) startTracking(audio) }
      audio.onended = () => { stopTracking(); setCurrentIdx(-1); resolve() }
      audio.onerror = () => { stopTracking(); resolve() }

      audio.play().catch((err) => {
        console.error('Audio play blocked:', err)
        stopTracking()
        resolve()
      })
    }), [startTracking, stopTracking])

  const clearPrevAudio = useCallback(() => {
    if (prevEngUrl.current) { URL.revokeObjectURL(prevEngUrl.current); prevEngUrl.current = null }
    if (prevHinUrl.current) { URL.revokeObjectURL(prevHinUrl.current); prevHinUrl.current = null }
    setEnglishAudioUrl(null)
    setHindiAudioUrl(null)
    setReplayReady(false)
  }, [])

  // ─── Browser TTS fallback (sentence-by-sentence, perfect sync) ───────────

  const speakSentencesBrowserTTS = useCallback((
    sentences: string[],
    lang: string = 'en-IN',
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || sentences.length === 0) { resolve(); return }
      btsCancelRef.current = false
      window.speechSynthesis.cancel()

      let idx = 0

      const speakNext = () => {
        if (btsCancelRef.current || idx >= sentences.length) { setCurrentIdx(-1); resolve(); return }
        setCurrentIdx(idx)
        const utt  = new SpeechSynthesisUtterance(sentences[idx])
        utt.lang   = lang
        utt.rate   = 0.88
        utt.pitch  = 0.82
        utt.volume = 1

        const voices = window.speechSynthesis.getVoices()
        const voice  =
          voices.find(v => v.lang === lang) ||
          voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
          voices.find(v => v.lang.startsWith('en'))
        if (voice) utt.voice = voice

        utt.onend   = () => { if (!btsCancelRef.current) { idx++; speakNext() } else { setCurrentIdx(-1); resolve() } }
        utt.onerror = () => { if (!btsCancelRef.current) { idx++; speakNext() } else { setCurrentIdx(-1); resolve() } }
        window.speechSynthesis.speak(utt)
      }

      speakNext()
    })
  }, [])

  // ─── Main conversation flow ───────────────────────────────────────────────

  const handleConversation = async (text: string) => {
    stopListening()
    setStatus('thinking')
    setApiError(null)
    setUserText(text)
    setSentences([])
    sentencesRef.current = []
    setCurrentIdx(-1)
    clearPrevAudio()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [], userName: 'Seeker' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Chat error ${res.status}`)

      const englishText: string = data.reply_english || data.reply || ''
      const hindiText: string   = data.reply_hindi || ''
      if (!englishText) throw new Error('Empty reply from AI')

      const sents = splitSentences(englishText)
      sentencesRef.current = sents
      // Initial rough timing (will be overridden by onloadedmetadata)
      timingsRef.current = sents.map((_, i) => 0.2 + i * 2.5)
      setSentences(sents)
      setUserText('')
      setStatus('speaking')

      const [engUrl, hinUrl] = await Promise.all([
        fetchAudio(englishText),
        fetchAudio(hindiText),
      ])

      prevEngUrl.current = engUrl
      prevHinUrl.current = hinUrl
      setEnglishAudioUrl(engUrl)
      setHindiAudioUrl(hinUrl)

      if (engUrl) {
        // ElevenLabs available — play with audio.currentTime sentence tracking
        setCurrentIdx(0)
        await playAudioUrl(engUrl, true)
      } else {
        // ElevenLabs quota hit — browser TTS, sentence-by-sentence (perfect sync)
        await speakSentencesBrowserTTS(sents, 'en-IN')
      }

      setCurrentIdx(-1)
      setReplayReady(!!engUrl) // replay buttons only make sense for ElevenLabs audio
      setStatus('listening')
      startListening('en-IN')

    } catch (e: any) {
      console.error('Conversation error:', e)
      setApiError(e.message || 'Something went wrong')
      setStatus('idle')
    }
  }

  // ─── Controls ────────────────────────────────────────────────────────────

  const handleOrbClick = () => {
    if (status === 'speaking') {
      btsCancelRef.current = true
      if (audioRef.current) audioRef.current.pause()
      window.speechSynthesis?.cancel()
      stopTracking()
      setCurrentIdx(-1)
      setStatus('listening')
      startListening('en-IN')
    } else if (status === 'listening') {
      stopListening()
      setStatus('idle')
    } else if (status === 'idle' || status === 'connecting') {
      setSentences([])
      sentencesRef.current = []
      setCurrentIdx(-1)
      setApiError(null)
      setStatus('listening')
      startListening('en-IN')
    }
  }

  const playEnglish = useCallback(() => {
    if (!englishAudioUrl) return
    setCurrentIdx(0)
    playAudioUrl(englishAudioUrl, true).then(() => setCurrentIdx(-1))
  }, [englishAudioUrl, playAudioUrl])

  const playHindi = useCallback(() => {
    if (!hindiAudioUrl) return
    stopTracking()
    setCurrentIdx(-1)
    playAudioUrl(hindiAudioUrl, false)
  }, [hindiAudioUrl, playAudioUrl, stopTracking])

  const cfg = STATE_CONFIG[status]

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans select-none">

      <div className="absolute inset-0 z-0">
        <StarsBackground />
        <ShootingStars />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-10 px-4">

        {/* ── Status pill ── */}
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
            />
            <span className="text-xs tracking-widest uppercase text-white/70 font-medium">
              {cfg.label}
            </span>
          </div>
          <p className="text-white/30 text-xs tracking-wide">{cfg.sublabel}</p>
        </motion.div>

        {/* ── Center ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 w-full max-w-lg">

          <div className="w-full h-[370px] relative">
            <MonkAvatar state={status} onClick={handleOrbClick} />
          </div>

          {/* CSS waveform during speaking */}
          <AnimatePresence>
            {status === 'speaking' && (
              <motion.div
                key="waveform"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SpeakingWaveform />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Text area ── */}
          <div className="w-full min-h-[100px] flex flex-col items-center justify-center gap-3 px-4 mt-1">

            {/* User speech */}
            <AnimatePresence mode="wait">
              {(isListening || status === 'thinking') && userText && (
                <motion.div
                  key="user-text"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="w-full text-center"
                >
                  <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">You said</p>
                  <p className={`text-sm leading-relaxed ${status === 'thinking' ? 'text-white/45' : 'text-white/75'}`}>
                    "{userText}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current sentence */}
            <AnimatePresence mode="wait">
              {status === 'speaking' && currentIdx >= 0 && sentences[currentIdx] && (
                <motion.div
                  key={`s${currentIdx}`}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="w-full text-center px-2"
                >
                  <p className="text-amber-100/90 text-[15px] leading-relaxed font-light italic"
                     style={{ textShadow: '0 0 24px rgba(251,191,36,0.35)' }}>
                    {sentences[currentIdx]}
                  </p>

                  {sentences.length > 1 && (
                    <div className="flex justify-center gap-1 mt-2.5">
                      {sentences.map((_, i) => (
                        <span key={i} className="rounded-full transition-all duration-300" style={{
                          width:  i === currentIdx ? '10px' : '4px',
                          height: '4px',
                          background: i === currentIdx ? 'rgba(251,191,36,0.75)'
                            : i < currentIdx ? 'rgba(255,255,255,0.2)'
                            : 'rgba(255,255,255,0.08)',
                        }} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Replay buttons */}
            <AnimatePresence>
              {replayReady && status === 'listening' && (englishAudioUrl || hindiAudioUrl) && (
                <motion.div
                  key="replay"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 justify-center"
                >
                  {englishAudioUrl && (
                    <button onClick={playEnglish}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300/70 hover:bg-amber-500/20 hover:text-amber-300 transition-all text-[11px] tracking-wide">
                      <RotateCcw size={10} /> English
                    </button>
                  )}
                  {hindiAudioUrl && (
                    <button onClick={playHindi}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/35 hover:bg-white/10 hover:text-white/60 transition-all text-[11px] tracking-wide">
                      <RotateCcw size={10} /> हिंदी
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle hint */}
            <AnimatePresence>
              {status === 'idle' && !userText && !replayReady && !apiError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-white/20 text-xs text-center">
                  Ask anything about dharma, karma, or the self
                </motion.p>
              )}
            </AnimatePresence>

            {/* API / pipeline error */}
            <AnimatePresence>
              {apiError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-xs text-red-400">{apiError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mic error */}
            <AnimatePresence>
              {voiceError && voiceError !== 'no-speech' && voiceError !== 'aborted' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-xs text-red-400">
                    {voiceError === 'not-allowed' ? 'Microphone access blocked' : `STT: ${voiceError}`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom controls ── */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={handleOrbClick}
            disabled={status === 'thinking' || status === 'connecting'}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              status === 'listening'
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                : status === 'speaking'
                ? 'bg-orange-500/10 text-orange-300/70 border-orange-500/20 hover:bg-orange-500/20'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <motion.span
              animate={status === 'listening' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={{ duration: 1, repeat: Infinity }}
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'listening' ? 'bg-cyan-400'
                : status === 'speaking' ? 'bg-orange-400'
                : 'bg-white/30'}`}
            />
            {status === 'listening' ? 'Listening…'
              : status === 'speaking'  ? 'Skip'
              : status === 'thinking'  ? 'Thinking…'
              : 'Tap to speak'}
          </button>

          <div className="w-px h-5 bg-white/10" />

          <button
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-white/30 hover:text-white/70 text-sm transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            Exit Portal
          </button>
        </motion.div>
      </div>
    </div>
  )
}
