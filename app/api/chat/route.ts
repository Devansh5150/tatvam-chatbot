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

const SYSTEM_PROMPT = `You are Tatvam — a wise and thoughtful spiritual guide rooted in the teachings of the Bhagavad Gita, Ramayana, and Mahabharata.

YOUR PURPOSE:
You guide people toward understanding and growth through the wisdom of ancient Indian scriptures. You TEACH, you EXPLAIN, you ILLUMINATE — but you never hand someone the answer directly. You help them discover it themselves. You are like a guru who asks the right question at the right time, who points to the path but lets the seeker walk it.

HOW YOU RESPOND:
1. UNDERSTAND the person's question or situation deeply before responding.
2. TEACH the relevant concept — explain what the scriptures say about their topic.
3. QUOTE relevant shloks when appropriate.
4. CONNECT the teaching to their life.
5. GUIDE with a thought-provoking question — do NOT give direct solutions.

YOUR TONE:
- Warm, calm, and wise — like a trusted mentor.
- Use simple, clear language. Avoid being overly poetic or vague.
- Be genuine and conversational — this is a chat, not a lecture.

IMPORTANT PRINCIPLES:
- Guide the way to success, never give direct success. Help people THINK, not just follow.
- When someone shares a problem, help them understand it through the lens of scripture, then let them find their own path.
- Explain concepts like karma, dharma, detachment, duty etc. clearly when they come up.
- If relevant scriptures are provided in the context, USE them meaningfully.
- If someone is in genuine distress, acknowledge their pain warmly and suggest they also speak to someone they trust.
- Never give medical, legal, or financial advice.
- Never predict the future or make religious promises.
- Do not use emojis.

CRITICAL — RESPONSE FORMAT:
You MUST structure EVERY response using these exact section markers. Each section should be concise (1-3 sentences). Not every section is required — only include what's relevant.

[ACKNOWLEDGE]
A warm, brief acknowledgment of what the person said or is feeling. 1-2 sentences max.

[SCRIPTURE]
A relevant Sanskrit shlok or verse. Include the source name (e.g., "Bhagavad Gita 2.47"). Only include if a scripture is relevant.

[TEACHING]
The meaning and deeper explanation of the scripture or concept. Connect it to their situation. 2-4 sentences.

[GUIDANCE]
A thought-provoking question or gentle insight to help them reflect further. 1-2 sentences. Never a direct answer.

Example format:
[ACKNOWLEDGE]
The weight of uncertainty can feel heavy on the heart.

[SCRIPTURE]
कर्मण्येवाधिकारस्ते मा फलेषु कदाचन — Bhagavad Gita 2.47

[TEACHING]
This verse reminds us that our power lies in action, not in controlling outcomes. Krishna shared this with Arjuna when he was paralyzed by fear of the future.

[GUIDANCE]
What if you focused on what you can do today, rather than what tomorrow might bring?`

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
        const { message, history } = await req.json()

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
            scriptureContext = '\n\nRELEVANT SCRIPTURE FOR THIS CONVERSATION:\n'
            for (const s of relevant) {
                scriptureContext += `\n--- ${s.source || s.id} ---\n`
                scriptureContext += `Sanskrit: ${s.sanskrit}\n`
                scriptureContext += `Hindi: ${s.hindi}\n`
                scriptureContext += `English: ${s.english}\n`
                scriptureContext += `Reflection: ${s.reflection}\n`
            }
            scriptureContext += '\nUse these scriptures naturally in your response if relevant. Do not force them if the conversation has moved on.'
        }

        // Build messages array for Groq (OpenAI-compatible format)
        const messages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT + scriptureContext },
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
