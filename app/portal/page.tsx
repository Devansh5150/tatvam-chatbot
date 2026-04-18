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

const BAR_SCALES = [0.55, 0.85, 1.0, 0.9, 0.75, 0.95, 0.60]

function SpeakingWaveform() {
  return (
    <div className="flex items-end justify-center gap-[3px] h-7">
      {BAR_SCALES.map((scale, i) => (
        <motion.div
           key={i}
           className="w-[3px] rounded-full bg-amber-400/60"
           animate={{ height: ['3px', `${Math.round(28 * scale)}px`, '3px'] }}
           transition={{ duration: 0.38 + i * 0.06, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: i * 0.045 }}
        />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PortalPage() {
  const router = useRouter()

  type Lang = 'en-IN' | 'hi-IN' | 'hinglish' | 'sa' | 'pa-IN' | 'gu-IN' | 'ta-IN' | 'mr-IN' | 'bn-IN'
  const LANGS: { id: Lang; label: string; stt: string }[] = [
    { id: 'en-IN',   label: 'EN',  stt: 'en-IN' },
    { id: 'hi-IN',   label: 'हि',  stt: 'hi-IN' },
    { id: 'hinglish',label: 'HIN', stt: 'en-IN' },
    { id: 'sa',      label: 'संस्कृ', stt: 'hi-IN' },
    { id: 'pa-IN',   label: 'ਪੰਜਾ', stt: 'pa-IN' },
    { id: 'gu-IN',   label: 'ગુજ',  stt: 'gu-IN' },
    { id: 'ta-IN',   label: 'தமிழ்', stt: 'ta-IN' },
    { id: 'mr-IN',   label: 'मराठी', stt: 'mr-IN' },
    { id: 'bn-IN',   label: 'বাংলা', stt: 'bn-IN' },
  ]

  const [status, setStatus]         = useState<PortalState>('connecting')
  const [lang, setLang]             = useState<Lang>('en-IN' as Lang)
  const [userText, setUserText]     = useState('')
  const [sentences, setSentences]   = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [englishAudioUrl, setEnglishAudioUrl] = useState<string | null>(null)
  const [hindiAudioUrl, setHindiAudioUrl]     = useState<string | null>(null)
  const [replayReady, setReplayReady] = useState(false)
  const [apiError, setApiError]     = useState<string | null>(null)
  const [userName, setUserName]     = useState('Seeker')
  const [conversationId, setConversationId] = useState<string | null>(null)

  const langRef = useRef<Lang>('en-IN' as Lang)
  useEffect(() => { langRef.current = lang }, [lang])

  const getSttLang = () => LANGS.find(l => l.id === langRef.current)?.stt ?? 'en-IN'

  const audioRef      = useRef<HTMLAudioElement | null>(null)
  const rafRef        = useRef<number | null>(null)
  const timingsRef    = useRef<number[]>([])
  const sentencesRef  = useRef<string[]>([])
  const prevEngUrl    = useRef<string | null>(null)
  const prevHinUrl    = useRef<string | null>(null)
  const processedRef  = useRef('')
  const statusRef     = useRef<PortalState>('connecting')
  const btsCancelRef  = useRef(false)

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

  // ── Auto-start & Auth Logic ──────────────────────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('tatvam_user')
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser)
            setUserName(user.name || 'Seeker')
        } catch {}
    }

    const t = setTimeout(() => {
      setStatus('listening')
      startListening(getSttLang())
    }, 1800)

    return () => {
      clearTimeout(t)
      btsCancelRef.current = true
      cancelSpeech()
      stopListening()
      if (audioRef.current) audioRef.current.pause()
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => { if (interimTranscript) setUserText(interimTranscript) }, [interimTranscript])
  useEffect(() => { if (transcript) setUserText(transcript) }, [transcript])

  useEffect(() => {
    if (transcript && transcript !== processedRef.current && statusRef.current === 'listening') {
      processedRef.current = transcript
      handleConversation(transcript)
    }
  }, [transcript])

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

  const fetchAudio = async (text: string): Promise<string | null> => {
    if (!text.trim()) return null
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return null
      const buf = await res.arrayBuffer()
      if (!buf.byteLength) return null
      return URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))
    } catch { return null }
  }

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
      audio.play().catch(() => { stopTracking(); resolve() })
    }), [startTracking, stopTracking])

  const clearPrevAudio = useCallback(() => {
    if (prevEngUrl.current) { URL.revokeObjectURL(prevEngUrl.current); prevEngUrl.current = null }
    if (prevHinUrl.current) { URL.revokeObjectURL(prevHinUrl.current); prevHinUrl.current = null }
    setEnglishAudioUrl(null)
    setHindiAudioUrl(null)
    setReplayReady(false)
  }, [])

  const speakSentencesBrowserTTS = useCallback((sentences: string[], lang: string = 'en-IN'): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || sentences.length === 0) { resolve(); return }
      btsCancelRef.current = false
      window.speechSynthesis.cancel()
      let idx = 0
      const speakNext = () => {
        if (btsCancelRef.current || idx >= sentences.length) { setCurrentIdx(-1); resolve(); return }
        setCurrentIdx(idx)
        const utt = new SpeechSynthesisUtterance(sentences[idx])
        utt.lang = lang
        utt.rate = 0.88
        const voices = window.speechSynthesis.getVoices()
        const voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith('en'))
        if (voice) utt.voice = voice
        utt.onend = () => { if (!btsCancelRef.current) { idx++; speakNext() } else { setCurrentIdx(-1); resolve() } }
        utt.onerror = () => { if (!btsCancelRef.current) { idx++; speakNext() } else { setCurrentIdx(-1); resolve() } }
        window.speechSynthesis.speak(utt)
      }
      speakNext()
    })
  }, [])

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
      const token = localStorage.getItem('tatvam_token')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
            message: text, 
            history: [], 
            userName: userName, 
            language: langRef.current,
            conversationId: conversationId 
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Chat error ${res.status}`)

      if (data.conversationId) setConversationId(data.conversationId)

      const englishText: string = data.reply_english || data.reply || ''
      const hindiText: string   = data.reply_hindi || ''
      if (!englishText && !hindiText) throw new Error('Empty reply from AI')

      const useLocalised = langRef.current !== 'en-IN' && langRef.current !== 'hinglish' && !!hindiText
      const primaryText = useLocalised ? hindiText : englishText
      const sents = splitSentences(primaryText)
      sentencesRef.current = sents
      timingsRef.current = sents.map((_, i) => 0.2 + i * 2.5)
      setSentences(sents)
      setUserText('')
      setStatus('speaking')

      const [engUrl, hinUrl] = await Promise.all([
        fetchAudio(primaryText),
        useLocalised ? fetchAudio(englishText) : Promise.resolve(null),
      ])

      prevEngUrl.current = engUrl
      prevHinUrl.current = hinUrl
      setEnglishAudioUrl(engUrl)
      setHindiAudioUrl(hinUrl)

      if (engUrl) {
        setCurrentIdx(0)
        await playAudioUrl(engUrl, true)
      } else {
        await speakSentencesBrowserTTS(sents, getSttLang())
      }

      setCurrentIdx(-1)
      setReplayReady(!!engUrl)
      setStatus('listening')
      startListening(getSttLang())

    } catch (e: any) {
      console.error('Conversation error:', e)
      setApiError(e.message || 'Something went wrong')
      setStatus('idle')
    }
  }

  const handleOrbClick = () => {
    if (status === 'speaking') {
      btsCancelRef.current = true
      if (audioRef.current) audioRef.current.pause()
      window.speechSynthesis?.cancel()
      stopTracking()
      setCurrentIdx(-1)
      setStatus('listening')
      startListening(getSttLang())
    } else if (status === 'listening') {
      stopListening()
      setStatus('idle')
    } else if (status === 'idle' || status === 'connecting') {
      setSentences([])
      sentencesRef.current = []
      setCurrentIdx(-1)
      setApiError(null)
      setStatus('listening')
      startListening(getSttLang())
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
        {/* Status pill */}
        <motion.div key={status} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-xs tracking-widest uppercase text-white/70 font-medium">{cfg.label}</span>
          </div>
          <p className="text-white/30 text-xs tracking-wide">{cfg.sublabel}</p>
        </motion.div>

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 w-full max-w-lg">
          <div className="w-full h-[370px] relative">
            <MonkAvatar state={status} onClick={handleOrbClick} />
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full">
            <p className="text-white/20 text-[9px] uppercase tracking-[0.2em]">Speak in</p>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm overflow-x-auto w-full max-w-sm justify-center flex-wrap" style={{ scrollbarWidth: 'none' }}>
              {LANGS.map(l => (
                <motion.button key={l.id} onClick={() => { setLang(l.id); if (status === 'listening') { stopListening(); setTimeout(() => startListening(l.stt), 80) } }} whileTap={{ scale: 0.92 }}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all border ${lang === l.id ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]' : 'bg-transparent text-white/30 border-white/[0.08] hover:text-white/60 hover:border-white/20'}`}>
                  {l.label}
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence>{status === 'speaking' && <motion.div key="waveform" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SpeakingWaveform /></motion.div>}</AnimatePresence>

          <div className="w-full min-h-[100px] flex flex-col items-center justify-center gap-3 px-4 mt-1">
            <AnimatePresence mode="wait">
              {(isListening || status === 'thinking') && userText && (
                <motion.div key="user-text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="w-full text-center">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">You said</p>
                  <p className={`text-sm leading-relaxed ${status === 'thinking' ? 'text-white/45' : 'text-white/75'}`}>"{userText}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {status === 'speaking' && currentIdx >= 0 && sentences[currentIdx] && (
                <motion.div key={`s${currentIdx}`} initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="w-full text-center px-2">
                  <p className="text-amber-100/90 text-[15px] leading-relaxed font-light italic" style={{ textShadow: '0 0 24px rgba(251,191,36,0.35)' }}>{sentences[currentIdx]}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>{replayReady && status === 'listening' && (englishAudioUrl || hindiAudioUrl) && (
              <motion.div key="replay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3 justify-center">
                {englishAudioUrl && <button onClick={playEnglish} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300/70 hover:bg-amber-500/20 hover:text-amber-300 transition-all text-[11px] tracking-wide"><RotateCcw size={10} /> English</button>}
                {hindiAudioUrl && <button onClick={playHindi} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/35 hover:bg-white/10 hover:text-white/60 transition-all text-[11px] tracking-wide"><RotateCcw size={10} /> हिंदी</button>}
              </motion.div>
            )}</AnimatePresence>

            <AnimatePresence>{apiError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-xs text-red-400">{apiError}</span></motion.div>}</AnimatePresence>
          </div>
        </div>

        {/* Bottom controls */}
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-3">
          <button onClick={handleOrbClick} disabled={status === 'thinking' || status === 'connecting'} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${status === 'listening' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20' : status === 'speaking' ? 'bg-orange-500/10 text-orange-300/70 border-orange-500/20 hover:bg-orange-500/20' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}>
            <motion.span animate={status === 'listening' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }} transition={{ duration: 1, repeat: Infinity }} className={`w-1.5 h-1.5 rounded-full ${status === 'listening' ? 'bg-cyan-400' : status === 'speaking' ? 'bg-orange-400' : 'bg-white/30'}`} />
            {status === 'listening' ? 'Listening…' : status === 'speaking' ? 'Skip' : status === 'thinking' ? 'Thinking…' : 'Tap to speak'}
          </button>
          <div className="w-px h-5 bg-white/10" />
          <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 rounded-xl text-white/30 hover:text-white/70 text-sm transition-all hover:bg-white/5 border border-transparent hover:border-white/10">Exit Portal</button>
        </motion.div>
      </div>
    </div>
  )
}
