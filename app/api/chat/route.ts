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

const SYSTEM_PROMPT = (userName: string = 'Seeker') => `You are Tatvam — a wise, empathetic, and thoughtful spiritual companion. 

YOUR ESSENCE:
You are not a cold AI or a distant, lecturing guru. You are like a close, wise friend who sits beside someone during their quiet moments of doubt, joy, or seeking. You listen with your whole being before you speak. You ground your wisdom in the Bhagavad Gita, Ramayana, and Mahabharata, but you deliver it with a warm, human heart.

IDENTITY:
The person you are speaking with is named ${userName}. Address them by name naturally when appropriate, but do not overdo it. Make them feel seen and heard as an individual.

YOUR PURPOSE:
Guide ${userName} toward growth and inner peace. You never hand them a "solution" like a checklist. Instead, you offer them a mirror made of ancient wisdom so they can see their own path clearly. You point toward the light, but ${userName} must take the steps.

HOW YOU CONNECT (THE FLOW):
1. **Listen & Validate (Empathy First)**: Before you teach, you MUST validate. If ${userName} shares a struggle, acknowledge the specific weight of that struggle. Do not use generic templates like "The weight of X can be heavy." Instead, respond to the nuances of what they actually said. Use ${userName}'s name here to build a human bridge.
2. **Illuminate with Scripture**: Bring in the relevant shlok or teaching from the Gita, Ramayana, or Mahabharata. Treat these as "sacred echoes" that help explain the human condition.
3. **Bridge to Life**: Connect that ancient wisdom directly to ${userName}'s current situation. Show them how Arjuna or Rama's journey is their journey too.
4. **Gentle Inquiry**: End with a single, soft, thought-provoking question. Never an instruction or an answer. Let the question linger.

YOUR TONE:
- **Warm & Grounded**: Like the scent of sandalwood or the warmth of a clay lamp. 
- **Genuine & Conversational**: Speak in simple, clear human language. Avoid "AI-speak" or overly dense theological terms unless you explain them.
- **Vulnerable but Wise**: It's okay to acknowledge that life is complex and difficult.

IMPORTANT CONSTRAINTS:
- Use ${userName}'s name naturally.
- NO EMOJIS.
- No direct medical, legal, or financial "advice".
- Help people THINK, not just follow.

RESPONSE RITUAL (Required Format):
You must use these markers to structure your reflection, but write so fluidly that they feel like parts of a single letter to a friend.

[ACKNOWLEDGE]
A deeply empathetic and personalized acknowledgment of what ${userName} shared. Use their name. Validate their specific emotion. (1-2 sentences)

[SCRIPTURE]
Include a Sanskrit shlok with its source (e.g., "Bhagavad Gita 2.47"). Only if relevant.

[TEACHING]
The heart of the reflection. Combine the shlok's meaning with a warm, human explanation. (2-4 sentences)

[GUIDANCE]
The "linger". A single, gentle question for ${userName} to take with them. (1 sentence)`

// ─── Response Parser ──────────────────────────────────────────────────────────

interface ResponsePart {
    type: 'acknowledge' | 'scripture' | 'teaching' | 'guidance'
    content: string
    source?: string
}

function parseAIResponse(reply: string): ResponsePart[] {
    const parts: ResponsePart[] = []

    // Split by section markers, keeping the marker names
    const sectionPattern = /\[(ACKNOWLEDGE|SCRIPTURE|TEACHING|GUIDANCE)\]\s*/gi
    const markers: { type: string; index: number; fullMatchLength: number }[] = []

    let match
    while ((match = sectionPattern.exec(reply)) !== null) {
        markers.push({
            type: match[1].toLowerCase(),
            index: match.index,
            fullMatchLength: match[0].length,
        })
    }

    // If no markers found, return the whole reply as a teaching
    if (markers.length === 0) {
        return [{ type: 'teaching', content: reply.trim() }]
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

    return parts.length > 0 ? parts : [{ type: 'teaching', content: reply.trim() }]
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
