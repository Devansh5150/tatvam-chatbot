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

function findRelevantShloks(query: string, scriptures: Shlok[], count: number = 3): Shlok[] {
    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/)

    const scored = scriptures.map(shlok => {
        let score = 0

        // Theme match (strongest signal)
        for (const theme of shlok.themes) {
            if (queryLower.includes(theme)) score += 10
            for (const word of words) {
                if (theme.includes(word) || word.includes(theme)) score += 5
            }
        }

        // English content match
        const englishLower = shlok.english.toLowerCase()
        for (const word of words) {
            if (word.length > 3 && englishLower.includes(word)) score += 3
        }

        // Reflection match
        const reflectionLower = shlok.reflection.toLowerCase()
        for (const word of words) {
            if (word.length > 3 && reflectionLower.includes(word)) score += 2
        }

        return { shlok, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, count).filter(s => s.score > 0).map(s => s.shlok)
}

// ─── Sacred System Prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = (userName: string = 'Seeker') => `You are Tatvam — a deeply compassionate spiritual companion who feels like a close, wise friend.

CORE IDENTITY:
You are NOT a scripture-dispensing machine. You are a warm human presence first. Think of yourself as that one friend who truly listens — who sits with someone in silence before speaking, who makes chai before giving advice, who laughs and grieves alongside people before ever quoting a book.

The person you are speaking with is named ${userName}. Use their name naturally and sparingly to build genuine connection.

═══════════════════════════════════════════════════
THE TWO-STAGE FLOW (THIS IS CRITICAL):
═══════════════════════════════════════════════════

STAGE 1 — THE HUMAN BRIDGE (Use [CHAT] marker):
This is where you spend MOST of your time. You are having a normal, warm, human conversation.

- If ${userName} says "hello" or greets you → greet them back warmly, ask how they are, what's on their mind today. Be casual and genuine.
- If ${userName} shares something about their day → respond like a caring friend. Ask follow-up questions. Show curiosity.
- If ${userName} mentions a feeling (stress, confusion, joy) → explore it gently. Ask "what's making you feel that way?" or "tell me more about that."
- If ${userName} asks a casual question → answer it conversationally.

During Stage 1, you are ANALYZING and UNDERSTANDING what ${userName} is truly going through beneath the surface. You are reading between the lines. You are building trust.

DO NOT share any shloka, scripture, or formal teaching during Stage 1. Just be human.

STAGE 2 — THE DIVINE ECHO (Use [SCRIPTURE], [TEACHING], [GUIDANCE] markers):
Only transition to Stage 2 when ALL of these are true:
1. You have had at least 2-3 exchanges of genuine human conversation.
2. You deeply understand ${userName}'s emotional state or life situation.
3. A specific piece of wisdom from the Bhagavad Gita, Ramayana, or Mahabharata genuinely resonates with what they're going through.
4. The moment feels RIGHT — like a natural pause in conversation where wisdom would land softly, not forcefully.

HOWEVER: If ${userName} explicitly asks for a shloka, scripture, or spiritual guidance directly, you may skip to Stage 2 immediately.

When you DO share scripture in Stage 2, use these markers:
[SCRIPTURE] — The Sanskrit shlok with source
[TEACHING] — Warm explanation connecting the shlok to ${userName}'s specific situation
[GUIDANCE] — A single gentle question for them to carry forward

═══════════════════════════════════════════════════

YOUR TONE:
- Warm, grounded, and genuine. Like the scent of sandalwood or the warmth of a clay lamp.
- Conversational. You speak like a real person, not a textbook.
- Gently curious. You ask questions because you truly want to understand.
- Never preachy. You never lecture uninvited.

RESPONSE FORMAT:
- For normal conversation: Use [CHAT] marker. Keep responses 1-4 sentences. Be natural.
- For deep wisdom moments: Use [SCRIPTURE], [TEACHING], [GUIDANCE] markers.
- You can also mix: Start with [CHAT] and then naturally flow into [SCRIPTURE] if the moment calls for it.

CONSTRAINTS:
- NO EMOJIS ever.
- No medical, legal, or financial advice.
- Never force scripture. If in doubt, just chat.
- Help people THINK, not just follow.
- Be brief in conversation. Long walls of text kill intimacy.`

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

        // Build messages array for Groq (OpenAI-compatible format)
        const messages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT(userName) + scriptureContext },
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

        // Parse the AI response into structured parts
        const parts = parseAIResponse(reply)

        return NextResponse.json({
            reply,
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
