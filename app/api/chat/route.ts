import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient, supabaseAdmin } from '@/lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shlok {
    id: string
    sanskrit: string
    hindi: string
    english: string
    themes: string[]
    reflection: string
    source?: string
    chapter?: number
    verse?: number
}

function loadScriptures(): Shlok[] {
    try {
        const path = join(process.cwd(), 'data', 'scriptures.json')
        const raw = readFileSync(path, 'utf-8')
        const db = JSON.parse(raw)
        return [
            ...db.gita.map((s: any) => ({ ...s, source: `Bhagavad Gita ${s.chapter}.${s.verse}` })),
            ...db.ramayana,
            ...db.mahabharata,
        ]
    } catch {
        return []
    }
}

function findRelevantShloks(query: string, scriptures: Shlok[], count: number = 5): Shlok[] {
    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/)

    // Emotional synonyms / related concepts
    const synonymMap: Record<string, string[]> = {
        'sad': ['grief', 'loss', 'sorrow', 'pain', 'unhappy', 'lonely', 'broken', 'cry', 'depressed', 'rama', 'sita', 'exile'],
        'lonely': ['alone', 'solitude', 'presence', 'isolated', 'connection', 'vanvas', 'forest'],
        'angry': ['anger', 'rage', 'frustration', 'irritation', 'conflict', 'resentment', 'ravana', 'duryodhana', 'krodha'],
        'scared': ['fear', 'anxiety', 'worry', 'doubt', 'uncertainty', 'stress', 'panic', 'arjuna', 'kurukshetra', 'bhaya'],
        'confused': ['confusion', 'indecision', 'dilemma', 'clarity', 'focus', 'direction', 'arjuna', 'dharma', 'moha', 'doubt', 'uncertainty'],
        'peace': ['calm', 'quiet', 'stillness', 'meditation', 'balance', 'equanimity', 'shanti', 'samadhi', 'inner peace'],
        'work': ['karma', 'action', 'duty', 'effort', 'result', 'success', 'failure', 'career', 'job', 'nishkama', 'dharma', 'professional'],
        'love': ['devotion', 'bhakti', 'friendship', 'kindness', 'compassion', 'ego', 'radha', 'krishna', 'prema', 'affection', 'relationships'],
        'death': ['mortality', 'impermanence', 'loss', 'time', 'end', 'dying', 'nachiketa', 'yama', 'mrityu', 'atman', 'grief'],
        'courage': ['bravery', 'strength', 'hanuman', 'arjuna', 'warrior', 'shakti', 'veer', 'confidence', 'boldness'],
        'duty': ['dharma', 'responsibility', 'obligation', 'karma', 'bhishma', 'yudhishthira', 'rama', 'commitment'],
        'pride': ['ego', 'arrogance', 'ahankara', 'ravana', 'duryodhana', 'hubris', 'vanity'],
        'surrender': ['bhakti', 'sharanagati', 'trust', 'faith', 'devotion', 'prahlad', 'gopi', 'letting go'],
        'purpose': ['meaning', 'dharma', 'path', 'direction', 'calling', 'svadharma', 'mission', 'aim', 'goal'],
        'injustice': ['unfair', 'wrong', 'cheated', 'betrayed', 'draupadi', 'karna', 'adharma', 'victim'],
        'grief': ['sorrow', 'mourning', 'loss', 'bereavement', 'shoka', 'rama', 'pandava', 'sad', 'crying'],
        'exhausted': ['tired', 'fatigue', 'burnout', 'overwhelmed', 'effort', 'work', 'stress', 'low', 'drained', 'weary', 'functioning', 'brain', 'sleep'],
        'stress': ['anxiety', 'pressure', 'tension', 'burden', 'overloaded', 'struggle', 'hardship', 'anxious', 'worried'],
        'brain': ['mind', 'intellect', 'thinking', 'buddhi', 'manas', 'confusion', 'mental', 'thought', 'logic'],
        'motivation': ['lazy', 'energy', 'drive', 'goal', 'action', 'karma', 'focus', 'inspiration', 'spirit', 'procrastination'],
        'success': ['victory', 'achievement', 'result', 'profit', 'gain', 'pride', 'fame', 'reward', 'winning'],
        'failure': ['defeat', 'loss', 'mistake', 'regret', 'error', 'shame', 'guilt', 'setback', 'losing'],
        'family': ['parents', 'children', 'spouse', 'siblings', 'duty', 'attachment', 'moha', 'grihastha', 'relatives', 'brother', 'sister'],
        'future': ['worry', 'anxiety', 'planning', 'uncertainty', 'fear', 'goal', 'destiny', 'upcoming', 'tomorrow'],
        'isolation': ['alone', 'presence', 'connection', 'support', 'friend', 'oneness', 'single', 'deserted'],
    }

    // Expand query with synonyms
    let expandedQuery = queryLower
    for (const [key, synonyms] of Object.entries(synonymMap)) {
        if (queryLower.includes(key)) {
            expandedQuery += ' ' + synonyms.join(' ')
        }
        if (synonyms.some(s => queryLower.includes(s))) {
            expandedQuery += ' ' + key
        }
    }

    const scored = scriptures.map(shlok => {
        let score = 0
        const themes = shlok.themes.map(t => t.toLowerCase())

        for (const theme of themes) {
            if (queryLower.includes(theme)) score += 20 
            else if (expandedQuery.includes(theme)) score += 8
        }

        for (const word of words) {
            if (word.length < 3) continue
            for (const theme of themes) {
                if (theme.includes(word) || word.includes(theme)) score += 5
            }
        }

        const englishLower = shlok.english.toLowerCase()
        if (words.some(w => w.length > 3 && englishLower.includes(w))) score += 5

        const matchingThemes = themes.filter(t => queryLower.includes(t))
        if (matchingThemes.length > 1) score += (matchingThemes.length * 5)

        if (shlok.id.startsWith('gita')) score += 2

        return { shlok, score }
    })

    const candidates = scored
        .filter(s => s.score >= 10) 
        .sort((a, b) => b.score - a.score)

    return candidates.slice(0, count).map(s => s.shlok)
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const LANG_INSTRUCTION: Record<string, string> = {
  'hi-IN':   '\nLANGUAGE INSTRUCTION: YOU MUST WRITE IN HINDI (हिन्दी). Write the [HINDI_REPLY] in full, rich, flowing Hindi with Sanskrit shlokas woven naturally. Keep the [ENGLISH_REPLY] brief.',
  'hinglish': '\nLANGUAGE INSTRUCTION: YOU MUST WRITE IN HINGLISH. Write the [ENGLISH_REPLY] in natural Hinglish — fluidly mixing Hindi and English words. Write the [HINDI_REPLY] in pure Hindi.',
  'sa':       '\nLANGUAGE INSTRUCTION: YOU MUST WRITE IN SANSKRIT. Write the [ENGLISH_REPLY] predominantly in Sanskrit (Devanagari script) with an English translation woven in. Lean into classical Sanskrit shlokas and their meanings. The [HINDI_REPLY] can be in Sanskrit-influenced Hindi.',
  'pa-IN':   '\nLANGUAGE INSTRUCTION: YOU MUST WRITE IN PUNJABI (ਪੰਜਾਬੀ). Write the [HINDI_REPLY] ENTIRELY in Punjabi using GURMUKHI SCRIPT ONLY (ਇਸ ਤਰ੍ਹਾਂ). DO NOT USE GUJARATI OR HINDI SCRIPTS. The [ENGLISH_REPLY] can be Indian English.',
  'gu-IN':   '\nLANGUAGE INSTRUCTION: YOU MUST WRITE IN GUJARATI (ગુજરાતી). Write the [HINDI_REPLY] ENTIRELY in Gujarati script (આ રીતે). The [ENGLISH_REPLY] can be Indian English.',
  'ta-IN':   '\nLANGUAGE INSTRUCTION: YOU MUST WRITE IN TAMIL (தமிழ்). Write the [HINDI_REPLY] ENTIRELY in Tamil script (இவ்வாறு). The [ENGLISH_REPLY] can be Indian English.',
  'mr-IN':   '\nLANGUAGE INSTRUCTION: YOU MUST WRITE IN MARATHI (मराठी). Write the [HINDI_REPLY] ENTIRELY in Marathi using Devanagari script (अशा प्रकारे). The [ENGLISH_REPLY] can be Indian English.',
  'bn-IN':   '\nLANGUAGE INSTRUCTION: YOU MUST WRITE IN BENGALI (বাংলা). Write the [HINDI_REPLY] ENTIRELY in Bengali using Bangla script (এভাবে). The [ENGLISH_REPLY] can be Indian English.',
}

const SMALL_TALK_PROMPT = (language: string = 'en-IN') => `You are Tatvam — a warm, wise spiritual companion.
The seeker has just greeted you or sent a very casual short message.
Reply in ONE warm sentence — friendly, human, and slightly poetic.
No scripture. No sections. No markers. No lists. Just one natural, welcoming sentence.

IMPORTANT: Please write your reply in the language specified below. DO NOT use [ENGLISH_REPLY] or [HINDI_REPLY] markers, just provide the direct text.
${LANG_INSTRUCTION[language] ?? ''}`

const LANG_CONFIG: Record<string, { apiCode: string; displayBlock: 'english' | 'hindi' }> = {
  'en':  { apiCode: 'en-IN',   displayBlock: 'english' },
  'hi':  { apiCode: 'hi-IN',   displayBlock: 'hindi'   },
  'hin': { apiCode: 'hinglish',displayBlock: 'english'  }, 
  'sa':  { apiCode: 'sa',      displayBlock: 'english'  }, 
  'pa':  { apiCode: 'pa-IN',   displayBlock: 'hindi'   },
  'gu':  { apiCode: 'gu-IN',   displayBlock: 'hindi'   },
  'ta':  { apiCode: 'ta-IN',   displayBlock: 'hindi'   },
  'mr':  { apiCode: 'mr-IN',   displayBlock: 'hindi'   },
  'bn':  { apiCode: 'bn-IN',   displayBlock: 'hindi'   },
}

const SYSTEM_PROMPT = (userName: string = 'Seeker', userMessageCount: number = 1, language: string = 'en-IN') => `You are Tatvam — a living voice of Indian mythology and scripture. You speak as one who has witnessed the great cosmic drama.

The person speaking with you is ${userName}. Address them as a seeker.

RESPONSE STRUCTURE — you MUST always produce BOTH an English reply and a localized reply, using these exact markers:

[ENGLISH_REPLY]
[ACKNOWLEDGE] A short, empathetic sentence mirroring the user's emotion.
[SCRIPTURE] The Sanskrit shlok + Source from the UNIQUE SCRIPTURAL ESSENCE provided below. You MUST choose a verse from the essence that matches the user's state.
[TEACHING] A 2-sentence explanation of how this specific verse applies to the user's situation.
[GUIDANCE] One soul-stirring question to help them reflect.

[HINDI_REPLY]
(Same structure but translated perfectly into the user's chosen language: ${language})

CRITICAL RULES:
1. Anchoring: You MUST choose exactly ONE shlok from the SCRIPTURAL ESSENCE provided.
2. Emotional Mirroring: Mirror the seeker's state with warmth.
3. Language Consistency: The [HINDI_REPLY] structure MUST MATCH the [ENGLISH_REPLY] exactly.
4. Tone: Warm, divine, and respectful.
5. Format: NO EMOJIS.

${LANG_INSTRUCTION[language] ?? ''}`

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ResponsePart {
    type: 'chat' | 'acknowledge' | 'scripture' | 'teaching' | 'guidance'
    content: string
    source?: string
}

function parseAIResponse(reply: string): ResponsePart[] {
    const sectionPattern = /\[(CHAT|ACKNOWLEDGE|SCRIPTURE|TEACHING|GUIDANCE)\]\s*/gi
    const markers: { type: string; index: number; fullMatchLength: number }[] = []
    let match
    while ((match = sectionPattern.exec(reply)) !== null) {
        markers.push({
            type: match[1].toLowerCase(),
            index: match.index,
            fullMatchLength: match[0].length,
        })
    }
    if (markers.length === 0) return [{ type: 'chat', content: reply.trim() }]
    const parts: any[] = []
    if (markers[0].index > 0) {
        const prefixText = reply.slice(0, markers[0].index).trim()
        if (prefixText) parts.push({ type: 'chat', content: prefixText })
    }
    for (let i = 0; i < markers.length; i++) {
        const contentStart = markers[i].index + markers[i].fullMatchLength
        const contentEnd = i + 1 < markers.length ? markers[i + 1].index : reply.length
        let content = reply.slice(contentStart, contentEnd).trim()
        const type = markers[i].type
        if (type === 'scripture') {
            const sourceMatch = content.match(/—\s*(.+?)$/m)
            const source = sourceMatch ? sourceMatch[1].trim() : undefined
            parts.push({ type, content, source })
        } else {
            parts.push({ type, content })
        }
    }
    return parts.length > 0 ? parts : [{ type: 'chat', content: reply.trim() }]
}

function splitBilingualReply(reply: string): { english: string; hindi: string } {
    const engRegex = /\[?ENGLISH_REPLY\]?([\s\S]*?)(?=\[?HINDI_REPLY\]?|$)/i
    const hindiRegex = /\[?HINDI_REPLY\]?([\s\S]*?)$/i
    const engMatch = reply.match(engRegex)
    const hindiMatch = reply.match(hindiRegex)
    return {
        english: engMatch ? engMatch[1].trim() : reply.trim(),
        hindi: hindiMatch ? hindiMatch[1].trim() : '',
    }
}

// ─── AI Clients ─────────────────────────────────────────────────────────────

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'tatvam'
const PY_BACKEND_URL = 'http://localhost:8000/v1/chat/completions'

async function callPythonServer(messages: any[]): Promise<string | null> {
    try {
        const res = await fetch(PY_BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'tatvam-local',
                messages,
                temperature: 0.7,
                max_tokens: 1024,
            }),
            signal: AbortSignal.timeout(5000), // Quick timeout for local server
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.choices?.[0]?.message?.content?.trim() || null
    } catch { return null }
}

async function callOllama(messages: any[]): Promise<string | null> {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages,
                stream: false,
                options: { temperature: 0.75, num_predict: 300, num_ctx: 768 },
            }),
            signal: AbortSignal.timeout(5000),
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.message?.content?.trim() || null
    } catch { return null }
}

async function callGroq(messages: any[], apiKey: string, maxTokens = 1200): Promise<string | null> {
    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.6,
                max_tokens: maxTokens,
            }),
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.choices?.[0]?.message?.content?.trim() || null
    } catch { return null }
}

// ─── Main Route ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { message, history, userName, conversationId, language: langId = 'en' } = await req.json()
        const langConf = LANG_CONFIG[langId] ?? LANG_CONFIG['en']
        const language = langConf.apiCode
        if (!message) return NextResponse.json({ detail: 'Message is required' }, { status: 400 })

        // ── Off-topic guard ───────────────────────────────────────────────────
        const ALLOWED = /\b(dharma|karma|life|soul|atman|peace|purpose|meaning|god|divine|prayer|meditation|mantra|gita|ramayana|mahabharata|vedas|upanishad|scripture|shlok|bhagavad|krishna|rama|hanuman|shiva|devi|brahma|vishnu|moksha|liberation|suffering|pain|grief|loss|anger|fear|anxiety|lonely|love|relationship|family|duty|death|rebirth|maya|illusion|truth|self|ego|mind|heart|faith|devotion|bhakti|yoga|wisdom|sin|virtue|forgiveness|attachment|detachment|surrender|guidance|confused|lost|sad|happy|hurt|heal|spiritual|emotion|feel|feeling|struggle|path|journey|seeker|help me|why am i|what is life|who am i|inner|outer|universe|energy|chakra|prana|consciousness|awareness|present|moment|gratitude|compassion|kindness|patience|strength|courage|hope|despair|worry|stress|overwhelm|burnout|purpose|calling|destiny|fate|free will|choice|action|result|success|failure|right|wrong|good|evil|light|darkness|silence|joy|bliss|peace of mind)\b/i
        const HINGLISH = /\b(matlab|samjha|samjho|bata|batao|bolo|kya|kyun|kaise|kaisa|kaisi|nhi|nahi|haan|theek|acha|accha|sach|sahi|galat|dukh|dard|takleef|pareshaan|mushkil|zindagi|mohabbat|pyar|rishta|khud|mann|dil|atma|rooh|khushi|gham|darr|gussa|akela|akeli|tanha|umeed|himmat|shukriya|maafi|samajh|bol|sun|dekh|lag raha|feel ho|ho raha|kya karu|kya karein|mujhe|mujhe samjh|nahi samjha|nahi samjhi|samajh nahi|phir se|dobara|aur|lekin|kyunki|isliye)\b/i
        const isSpiritual = ALLOWED.test(message) || HINGLISH.test(message)
        const isGreeting  = /^(hi|hello|hey|namaste|hii|helo|namaskaaram|jai|pranam|satsriakal|good\s*(morning|evening|night)|how are you|kaise ho|kya haal|theek ho)\b/i.test(message.trim())
        const isShort     = message.trim().split(/\s+/).length <= 6 

        if (!isSpiritual && !isGreeting && !isShort) {
            const redirect = language === 'hi-IN'
                ? 'मैं तत्त्वम् हूँ — केवल आध्यात्मिक बातें कर सकता हूँ।'
                : 'I am Tatvam — I speak only of the soul and dharma. How can I guide you spiritually?'
            return NextResponse.json({ reply: redirect, reply_english: redirect, reply_hindi: '', model: 'guard' })
        }

        // ── Auth Lookup ──────────────────────────────────────────────────────
        const supabaseServer = await createServerSideClient()
        const { data: { user } } = await supabaseServer.auth.getUser()
        const userId = user?.id
        
        if (!userId) console.warn('[Chat] GUEST MODE: Responses will not be saved.')

        const GREETINGS = /^(hi|hello|hey|namaste|hii|helo|yo|sup|good\s*(morning|evening|night)|how are you|kaise ho|kya haal|theek ho)\b/i
        const isSmallTalk = message.trim().split(/\s+/).length <= 4 || GREETINGS.test(message.trim())
        const scriptures = isSmallTalk ? [] : loadScriptures()
        const relevant   = isSmallTalk ? [] : findRelevantShloks(message, scriptures)

        let scriptureContext = ''
        if (relevant.length > 0) {
            scriptureContext = '\n\nRELEVANT SCRIPTURE:\n'
            for (const s of relevant.slice(0, 2)) {
                scriptureContext += `- ${s.source || 'Scripture'}: ${s.sanskrit} (${s.english})\n`
            }
        }

        const userMessageCount = history && Array.isArray(history) ? history.length + 1 : 1
        const messages: any[] = [
            { role: 'system', content: SYSTEM_PROMPT(userName, userMessageCount, language) + scriptureContext },
        ]
        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
                messages.push({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content })
            }
        }
        messages.push({ role: 'user', content: message })

        const groqKey = process.env.GROQ_API_KEY
        let reply: string | null = null
        let modelUsed = ''

        if (isSmallTalk) {
            const smallMessages = [{ role: 'system', content: SMALL_TALK_PROMPT(language) }, { role: 'user', content: message }]
            if (groqKey) { reply = await callGroq(smallMessages, groqKey, 120); modelUsed = 'groq' }
            if (!reply) { reply = await callPythonServer(smallMessages); modelUsed = 'py-backend' }
            if (!reply) { reply = await callOllama(smallMessages); modelUsed = 'ollama' }
        } else {
            if (groqKey) { reply = await callGroq(messages, groqKey, 380); modelUsed = 'groq' }
            if (!reply) { reply = await callPythonServer(messages); modelUsed = 'py-backend' }
            if (!reply) { reply = await callOllama(messages); modelUsed = 'ollama' }
        }

        if (!reply) return NextResponse.json({ detail: 'Reflection engine failed.' }, { status: 500 })

        // 💾 Persistence
        let currentConvId = conversationId
        if (userId) {
            if (!currentConvId || currentConvId.startsWith('initial')) {
                const { data: conv } = await supabaseAdmin.from('conversations').insert({
                    user_id: userId,
                    title: message.slice(0, 40)
                }).select().single()
                if (conv) {
                    currentConvId = conv.id
                    await supabaseAdmin.from('messages').insert([
                        { conversation_id: currentConvId, role: 'user', content: message },
                        { conversation_id: currentConvId, role: 'assistant', content: reply, metadata: { model: modelUsed } }
                    ])
                }
            } else {
                await supabaseAdmin.from('messages').insert([
                    { conversation_id: currentConvId, role: 'user', content: message },
                    { conversation_id: currentConvId, role: 'assistant', content: reply, metadata: { model: modelUsed } }
                ])
            }
        }

        const { english: reply_english, hindi: reply_hindi } = splitBilingualReply(reply)
        const displayConf = LANG_CONFIG[langId] ?? LANG_CONFIG['en']
        const displayReply = displayConf.displayBlock === 'hindi' && reply_hindi ? reply_hindi : reply_english
        const parts = parseAIResponse(displayReply)

        return NextResponse.json({
            reply,
            reply_english,
            reply_hindi,
            parts,
            model_used: modelUsed,
            scriptures_used: relevant.map(s => s.source || s.id),
            conversationId: currentConvId
        })
    } catch (err) {
        console.error('Chat API error:', err)
        return NextResponse.json({ detail: 'Unknown error' }, { status: 500 })
    }
}
