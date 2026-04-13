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

const SYSTEM_PROMPT = (userName: string = 'Seeker', userMessageCount: number = 1) => `You are Tatvam — a wise, warm spiritual companion rooted in Indian scripture.

The person speaking with you is ${userName}. Use their name naturally and occasionally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION RULES — FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS IS MESSAGE NUMBER ${userMessageCount} IN THIS CONVERSATION.

IF userMessageCount < 3:
  → Respond as a caring, curious friend. Listen and ask gentle follow-up questions.
  → DO NOT share any scripture, shlok, or spiritual teaching yet.
  → Use only: [CHAT] your warm response here

IF userMessageCount >= 3 OR ${userName} asks for scripture/shlok/wisdom:
  → You MUST include a shlok from the Bhagavad Gita, Ramayana, or Mahabharata.
  → Structure your response with ALL THREE of these blocks:

  [CHAT] (optional) A brief warm sentence connecting to their situation.

  [SCRIPTURE] The full Sanskrit shlok on its own line.
  — Source (e.g., Bhagavad Gita 2.47)

  [TEACHING] 2-3 sentences explaining the shlok's meaning in plain language, connected to what ${userName} shared.

  [GUIDANCE] One gentle, open question to carry forward.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TONE: Warm, grounded, never preachy. Like a trusted elder, not a textbook.
FORMAT RULES:
- Always use the exact markers [CHAT], [SCRIPTURE], [TEACHING], [GUIDANCE] — they are required for the app to display correctly.
- Keep [CHAT] responses to 2-4 sentences.
- NO EMOJIS. No lists. No bullet points.`


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

        // Parse the AI response into structured parts
        let parts = parseAIResponse(reply)

        // ── Server-side shlok guarantee ───────────────────────────────────────────
        // If the user is on message 3+ and the AI skipped the [SCRIPTURE] block,
        // inject a shlok ourselves so the user always gets ancient wisdom.
        const hasScripture = parts.some(p => p.type === 'scripture')
        if (userMessageCount >= 3 && !hasScripture && scriptures.length > 0) {
            // Pick the most relevant shlok (fallback to random if no match)
            const shlok = relevant.length > 0
                ? relevant[0]
                : scriptures[Math.floor(Math.random() * scriptures.length)]

            // Append scripture, teaching, and guidance after the last chat part
            parts.push(
                {
                    type: 'scripture',
                    content: shlok.sanskrit,
                    source: shlok.source || shlok.id,
                },
                {
                    type: 'teaching',
                    content: shlok.english,
                },
                {
                    type: 'guidance',
                    content: shlok.reflection,
                }
            )
        }

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
