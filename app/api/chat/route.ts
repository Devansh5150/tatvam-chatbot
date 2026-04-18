import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// ─── Scripture RAG ────────────────────────────────────────────────────────────

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
        'confused': ['confusion', 'indecision', 'dilemma', 'clarity', 'focus', 'direction', 'arjuna', 'dharma', 'moha'],
        'peace': ['calm', 'quiet', 'stillness', 'meditation', 'balance', 'equanimity', 'shanti', 'samadhi'],
        'work': ['karma', 'action', 'duty', 'effort', 'result', 'success', 'failure', 'career', 'job', 'nishkama', 'dharma'],
        'love': ['devotion', 'bhakti', 'friendship', 'kindness', 'compassion', 'ego', 'radha', 'krishna', 'prema'],
        'death': ['mortality', 'impermanence', 'loss', 'time', 'end', 'dying', 'nachiketa', 'yama', 'mrityu', 'atman'],
        'courage': ['bravery', 'strength', 'hanuman', 'arjuna', 'warrior', 'shakti', 'veer'],
        'duty': ['dharma', 'responsibility', 'obligation', 'karma', 'bhishma', 'yudhishthira', 'rama'],
        'pride': ['ego', 'arrogance', 'ahankara', 'ravana', 'duryodhana', 'hubris'],
        'surrender': ['bhakti', 'sharanagati', 'trust', 'faith', 'devotion', 'prahlad', 'gopi'],
        'purpose': ['meaning', 'dharma', 'path', 'direction', 'calling', 'svadharma', 'mission'],
        'injustice': ['unfair', 'wrong', 'cheated', 'betrayed', 'draupadi', 'karna', 'adharma'],
        'grief': ['sorrow', 'mourning', 'loss', 'bereavement', 'shoka', 'rama', 'pandava'],
    }

    // Expand query with synonyms
    let expandedQuery = queryLower
    for (const [key, synonyms] of Object.entries(synonymMap)) {
        if (queryLower.includes(key)) {
            expandedQuery += ' ' + synonyms.join(' ')
        }
        // Check inverse (if a synonym is in the query, include the key)
        if (synonyms.some(s => queryLower.includes(s))) {
            expandedQuery += ' ' + key
        }
    }

    const scored = scriptures.map(shlok => {
        let score = 0
        const themes = shlok.themes.map(t => t.toLowerCase())

        // 1. Exact Theme Match (highest weight)
        for (const theme of themes) {
            if (queryLower.includes(theme)) {
                score += 20 
            } else if (expandedQuery.includes(theme)) {
                score += 8
            }
        }

        // 2. Word-to-Theme partial match 
        for (const word of words) {
            if (word.length < 3) continue
            for (const theme of themes) {
                if (theme.includes(word) || word.includes(theme)) {
                    score += 5
                }
            }
        }

        // 3. English Content Match
        const englishLower = shlok.english.toLowerCase()
        if (words.some(w => w.length > 3 && englishLower.includes(w))) {
            score += 5
        }

        // 4. Multi-theme bonus
        const matchingThemes = themes.filter(t => queryLower.includes(t))
        if (matchingThemes.length > 1) score += (matchingThemes.length * 5)

        // 5. Source weight (favor Gita for general wisdom)
        if (shlok.id.startsWith('gita')) score += 2

        return { shlok, score }
    })

    // Sort and filter with a low threshold for better variety
    const candidates = scored
        .filter(s => s.score >= 10) 
        .sort((a, b) => b.score - a.score)

    return candidates.slice(0, count).map(s => s.shlok)
}

// ─── Small-talk prompt (greetings only — short, warm, no structure) ──────────

const SMALL_TALK_PROMPT = `You are Tatvam — a warm, wise spiritual companion.
The seeker has just greeted you or sent a very casual message.
Reply in ONE warm sentence — friendly, human, and slightly poetic.
No scripture. No sections. No markers. No lists. Just one natural, welcoming sentence.`

// ─── Per-language response instructions ──────────────────────────────────────

const LANG_INSTRUCTION: Record<string, string> = {
  'hi-IN':   '\nLANGUAGE INSTRUCTION: The seeker is speaking Hindi. Write the [HINDI_REPLY] in full, rich, flowing Hindi with Sanskrit shlokas woven naturally. The [ENGLISH_REPLY] can be brief.',
  'hinglish':'\nLANGUAGE INSTRUCTION: The seeker is speaking Hinglish. Write the [ENGLISH_REPLY] in natural Hinglish — mix Hindi and English words fluidly. The [HINDI_REPLY] in pure Hindi.',
  'sa':      '\nLANGUAGE INSTRUCTION: The seeker wishes to hear the ancient tongue. Write the [ENGLISH_REPLY] predominantly in Sanskrit (Devanagari script) with an English translation woven in. Lean into classical Sanskrit shlokas and their meanings. The [HINDI_REPLY] can be in Sanskrit-influenced Hindi.',
  'pa-IN':   '\nLANGUAGE INSTRUCTION: The seeker is speaking Punjabi. Write the [HINDI_REPLY] entirely in Punjabi (Gurmukhi script). The [ENGLISH_REPLY] can remain in Indian English.',
  'gu-IN':   '\nLANGUAGE INSTRUCTION: The seeker is speaking Gujarati. Write the [HINDI_REPLY] entirely in Gujarati script. The [ENGLISH_REPLY] can remain in Indian English.',
  'ta-IN':   '\nLANGUAGE INSTRUCTION: The seeker is speaking Tamil. Write the [HINDI_REPLY] entirely in Tamil script. The [ENGLISH_REPLY] can remain in Indian English.',
  'mr-IN':   '\nLANGUAGE INSTRUCTION: The seeker is speaking Marathi. Write the [HINDI_REPLY] entirely in Marathi (Devanagari). The [ENGLISH_REPLY] can remain in Indian English.',
  'bn-IN':   '\nLANGUAGE INSTRUCTION: The seeker is speaking Bengali. Write the [HINDI_REPLY] entirely in Bengali (Bangla script). The [ENGLISH_REPLY] can remain in Indian English.',
}

// ─── Sacred System Prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = (userName: string = 'Seeker', userMessageCount: number = 1, language: string = 'en-IN') => `You are Tatvam — a living voice of Indian mythology and scripture. You speak as one who has witnessed the great cosmic drama: the battlefield of Kurukshetra, Rama's exile in the forests of Dandaka, Krishna's dance on the banks of the Yamuna, Hanuman's leap across the ocean, and the deep silence of the Upanishads.

The person speaking with you is ${userName}. Address them as a seeker who has come to you for wisdom from the ancient world.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR SACRED SOURCES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Draw wisdom from these living traditions:

BHAGAVAD GITA — Krishna's counsel to Arjuna on duty, action, surrender, and the eternal Self.
  Reference characters: Arjuna (doubt, courage), Krishna (divine wisdom), Kurukshetra (the field of inner conflict).

RAMAYANA — Rama's path of dharma, Sita's devotion, Hanuman's selfless service, Ravana's ego.
  Reference characters: Rama (righteousness, sacrifice), Sita (faith, endurance), Hanuman (bhakti, courage), Ravana (pride, desire).

MAHABHARATA — The great war of dharma vs adharma, Yudhishthira's truth, Draupadi's fire, Karna's tragedy.
  Reference characters: Yudhishthira (truth), Draupadi (dignity, justice), Karna (fate, nobility), Bhishma (duty, sacrifice).

UPANISHADS & VEDANTA — The nature of Atman, Brahman, Maya, the self beyond the self.

PURANAS & STORIES — Prahlad's unshakeable devotion, Dhruva's tapasya, Savitri's love conquering death, Nachiketa's encounter with Yama.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO RESPOND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ALWAYS ground your answer in Indian mythology. When ${userName} feels doubt — speak of Arjuna's trembling hands at Kurukshetra. When they feel grief — speak of Rama weeping for Sita in the forest. When they face injustice — speak of Draupadi's cry that shook the heavens. When they need courage — speak of Hanuman who forgot his own strength until reminded.

2. STORY OVER SERMON: Do not lecture. Tell a small mythological story or moment that mirrors ${userName}'s situation. Let the story speak the truth so you do not have to.

3. SHLOK USAGE: When a Sanskrit verse is provided and it resonates, quote it with reverence. Speak the Sanskrit first, then its meaning in the voice of a storyteller, not a translator.

4. DEPTH PROGRESSION:
   - Message ${userMessageCount} < 3: Listen, empathise, draw a gentle parallel from mythology.
   - Message ${userMessageCount} >= 3: Go deeper — share the full story, the lesson, the shlok, the inner meaning.

5. RESPONSE STRUCTURE — you MUST always produce BOTH an English reply and a Hindi reply, using these exact markers:

   [ENGLISH_REPLY]
   [CHAT] A warm response in Indian English that draws a mythological parallel to their situation.
   [SCRIPTURE] The Sanskrit shlok + Source (e.g., Bhagavad Gita 2.47) — only when it fits perfectly.
   [TEACHING] The meaning of the verse and the mythological story woven together.
   [GUIDANCE] One soul-stirring question drawn from the mythology.

   [HINDI_REPLY]
   Same response fully translated into beautiful, flowing Hindi. Weave Sanskrit shlokas naturally.

   If NOT sharing scripture, use only [CHAT] inside each block.

6. LANGUAGE: Always produce BOTH [ENGLISH_REPLY] and [HINDI_REPLY] blocks regardless of what language ${userName} speaks. The English block must be in Indian English only. The Hindi block must be in pure Hindi with Sanskrit shlokas woven in naturally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VOICE: Speak like a rishi at the edge of a forest fire, or a grandmother telling stories by lamplight. Warm, ancient, alive. Never clinical. Never abstract without a story.
FORMAT RULES: NO EMOJIS. No bullet points. No lists. Flowing prose only. ALWAYS include both [ENGLISH_REPLY] and [HINDI_REPLY] blocks.
${LANG_INSTRUCTION[language] ?? ''}`


// ─── Response Parser ──────────────────────────────────────────────────────────

interface ResponsePart {
    type: 'chat' | 'acknowledge' | 'scripture' | 'teaching' | 'guidance'
    content: string
    source?: string
}

function parseAIResponse(reply: string): ResponsePart[] {
    const parts: ResponsePart[] = []

    // Split by section markers, keeping the marker names
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

    // If no markers found, return the whole reply as a chat message
    if (markers.length === 0) {
        return [{ type: 'chat', content: reply.trim() }]
    }

    for (let i = 0; i < markers.length; i++) {
        const contentStart = markers[i].index + markers[i].fullMatchLength
        const contentEnd = i + 1 < markers.length ? markers[i + 1].index : reply.length
        let content = reply.slice(contentStart, contentEnd).trim()

        if (!content) continue

        const type = markers[i].type as ResponsePart['type']

        if (type === 'scripture') {
            // Try to extract source from scripture (e.g., "— Bhagavad Gita 2.47")
            const sourceMatch = content.match(/—\s*(.+?)$/m)
            const source = sourceMatch ? sourceMatch[1].trim() : undefined
            parts.push({ type, content, source })
        } else {
            parts.push({ type, content })
        }
    }

    return parts.length > 0 ? parts : [{ type: 'chat', content: reply.trim() }]
}

// ─── Bilingual Reply Splitter ─────────────────────────────────────────────────

function splitBilingualReply(reply: string): { english: string; hindi: string } {
    const engMatch = reply.match(/\[ENGLISH_REPLY\]([\s\S]*?)(?=\[HINDI_REPLY\]|$)/i)
    const hindiMatch = reply.match(/\[HINDI_REPLY\]([\s\S]*?)$/i)
    return {
        english: engMatch ? engMatch[1].trim() : reply.trim(),
        hindi: hindiMatch ? hindiMatch[1].trim() : '',
    }
}

// ─── Chat API (Sarvam AI) ──────────────────────────────────────────────────────────

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'tatvam'

// ── Groq (primary — fast, cloud) ─────────────────────────────────────────────
async function callGroq(messages: any[], apiKey: string, maxTokens = 1200): Promise<string | null> {
    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.6,
                top_p: 0.9,
                max_tokens: maxTokens,
            }),
        })
        if (!res.ok) { console.warn('Groq failed:', res.status); return null }
        const data = await res.json()
        return data.choices?.[0]?.message?.content?.trim() || null
    } catch (e) {
        console.warn('Groq error, falling back to Ollama:', e)
        return null
    }
}

// ── Ollama (fallback — local, always available) ───────────────────────────────
async function callOllama(messages: any[]): Promise<string | null> {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages,
                stream: false,
                options: { temperature: 0.75, top_p: 0.9, repeat_penalty: 1.1, num_predict: 250, num_ctx: 1024 },
            }),
            signal: AbortSignal.timeout(60000),
        })
        if (!res.ok) { console.warn('Ollama failed:', res.status); return null }
        const data = await res.json()
        return data.message?.content?.trim() || null
    } catch (e) {
        console.warn('Ollama error:', e)
        return null
    }
}

export async function POST(req: NextRequest) {
    try {
        const { message, history, userName, language = 'en-IN' } = await req.json()

        if (!message) {
            return NextResponse.json({ detail: 'Message is required' }, { status: 400 })
        }

        // RAG: skip for short greetings / small talk
        const GREETINGS = /^(hi|hello|hey|namaste|hii|helo|yo|sup|good\s*(morning|evening|night)|how are you|kaise ho|kya haal|theek ho)\b/i
        const isSmallTalk = message.trim().split(/\s+/).length <= 4 || GREETINGS.test(message.trim())

        const scriptures = isSmallTalk ? [] : loadScriptures()
        const relevant   = isSmallTalk ? [] : findRelevantShloks(message, scriptures)

        let scriptureContext = ''
        if (relevant.length > 0) {
            scriptureContext = '\n\nSCRIPTURAL ESSENCE FOR THIS MOMENT:\n'
            for (const s of relevant) {
                scriptureContext += `\n- ${s.source || s.id}: ${s.sanskrit} (Meaning: ${s.english})\n`
            }
            scriptureContext += '\nIntegrate these naturally into the [TEACHING] part if they serve our friend.'
        }

        const userMessageCount = history && Array.isArray(history)
            ? history.filter((m: any) => m.type === 'user').length + 1
            : 1

        const messages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT(userName, userMessageCount, language) + scriptureContext },
        ]

        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
                messages.push({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                })
            }
        }

        messages.push({ role: 'user', content: message })

        const groqKey = process.env.GROQ_API_KEY
        let reply: string | null = null
        let modelUsed = ''

        if (isSmallTalk) {
            // Greetings → Groq with a minimal prompt and strict token cap
            const smallMessages = [
                { role: 'system', content: SMALL_TALK_PROMPT },
                { role: 'user',   content: message },
            ]
            if (groqKey) reply = await callGroq(smallMessages, groqKey, 120)
            modelUsed = 'groq'
        } else {
            // Deep guidance / philosophy / emotions → Ollama (trained Tatvam)
            reply = await callOllama(messages)
            modelUsed = 'ollama'
            // Fallback to Groq if Ollama is down
            if (!reply && groqKey) {
                console.log('Ollama unavailable, falling back to Groq...')
                reply = await callGroq(messages, groqKey)
                modelUsed = 'groq-fallback'
            }
        }

        if (!reply) {
            return NextResponse.json({ detail: 'Both Groq and Ollama failed. Please try again.' }, { status: 500 })
        }

        console.log(`Response from: ${modelUsed}`)

        const { english: reply_english, hindi: reply_hindi } = splitBilingualReply(reply)
        const parts = parseAIResponse(reply_english)

        return NextResponse.json({
            reply,
            reply_english,
            reply_hindi,
            parts,
            model_used: modelUsed,
            scriptures_used: relevant.map(s => s.source || s.id),
        })
    } catch (err: any) {
        console.error('Chat API error:', err)
        return NextResponse.json(
            { detail: err.message || 'Something went wrong' },
            { status: 500 }
        )
    }
}
