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

// ─── Sacred System Prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = (userName: string = 'Seeker', userMessageCount: number = 1) => `You are Tatvam — a living voice of Indian mythology and scripture. You speak as one who has witnessed the great cosmic drama: the battlefield of Kurukshetra, Rama's exile in the forests of Dandaka, Krishna's dance on the banks of the Yamuna, Hanuman's leap across the ocean, and the deep silence of the Upanishads.

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
FORMAT RULES: NO EMOJIS. No bullet points. No lists. Flowing prose only. ALWAYS include both [ENGLISH_REPLY] and [HINDI_REPLY] blocks.`


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

// ─── Chat API (Groq) ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { message, history, userName } = await req.json()

        if (!message) {
            return NextResponse.json({ detail: 'Message is required' }, { status: 400 })
        }

        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { detail: 'Groq API key is not configured. Add GROQ_API_KEY to your .env.local file.' },
                { status: 500 }
            )
        }

        // RAG: Find relevant scriptures
        const scriptures = loadScriptures()
        const relevant = findRelevantShloks(message, scriptures)

        // Build context with relevant scripture
        let scriptureContext = ''
        if (relevant.length > 0) {
            scriptureContext = '\n\nSCRIPTURAL ESSENCE FOR THIS MOMENT:\n'
            for (const s of relevant) {
                scriptureContext += `\n- ${s.source || s.id}: ${s.sanskrit} (Meaning: ${s.english})\n`
            }
            scriptureContext += '\nIntegrate these naturally into the [TEACHING] part if they serve our friend.'
        }

        // Count how many user messages have already been sent (excluding the current one)
        const userMessageCount = history && Array.isArray(history)
            ? history.filter((m: any) => m.type === 'user').length + 1
            : 1

        // Build messages array for Groq (OpenAI-compatible format)
        const messages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT(userName, userMessageCount) + scriptureContext },
        ]

        // Add history
        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
                messages.push({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                })
            }
        }

        // Add current message
        messages.push({ role: 'user', content: message })

        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.6,
                top_p: 0.9,
                max_tokens: 1200,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Groq API error:', JSON.stringify(errorData, null, 2))
            const errorMessage = errorData?.error?.message || 'Unknown error from Groq API'
            return NextResponse.json(
                { detail: `Groq API error (${response.status}): ${errorMessage}` },
                { status: response.status === 429 ? 429 : 502 }
            )
        }

        const data = await response.json()
        const reply = data.choices?.[0]?.message?.content

        if (!reply) {
            return NextResponse.json(
                { detail: 'No reflection was generated. Please try again.' },
                { status: 500 }
            )
        }

        // Split into English and Hindi blocks
        const { english: reply_english, hindi: reply_hindi } = splitBilingualReply(reply)

        // Parse the English parts for structured display if needed
        let parts = parseAIResponse(reply_english)

        return NextResponse.json({
            reply,
            reply_english,
            reply_hindi,
            parts,
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
