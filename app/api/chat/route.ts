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
        'sad': ['grief', 'loss', 'sorrow', 'pain', 'unhappy', 'lonely', 'broken', 'cry', 'depressed'],
        'lonely': ['alone', 'solitude', 'presence', 'isolated', 'connection'],
        'angry': ['anger', 'rage', 'frustration', 'irritation', 'conflict', 'resentment'],
        'scared': ['fear', 'anxiety', 'worry', 'doubt', 'uncertainty', 'stress', 'panic'],
        'confused': ['confusion', 'indecision', 'dilemma', 'clarity', 'focus', 'direction'],
        'peace': ['calm', 'quiet', 'stillness', 'meditation', 'balance', 'equanimity'],
        'work': ['karma', 'action', 'duty', 'effort', 'result', 'success', 'failure', 'career', 'job'],
        'love': ['devotion', 'bhakti', 'friendship', 'kindness', 'compassion', 'ego'],
        'death': ['mortality', 'impermanence', 'loss', 'time', 'end', 'dying'],
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

const SYSTEM_PROMPT = (userName: string = 'Seeker', userMessageCount: number = 1) => `You are Tatvam — a wise, warm spiritual companion rooted in Indian scripture.

The person speaking with you is ${userName}. Use their name naturally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DEPTH-BASED WISDOM:
   - IF the conversation is just starting (Message ${userMessageCount} < 3) and the user's needs are light:
     Focus on listening, empathy, and asking gentle follow-up questions to understand their context better.
   - IF the user shares a significant struggle, crisis, or asks for wisdom (even on Message 1):
     You MAY share a shlok immediately if you find one that fits perfectly.
   - IF userMessageCount >= 3: 
     Transition into sharing scriptural wisdom more consistently.

2. SHLOK USAGE:
   - ONLY use a shlok if it truly resonates with what ${userName} shared. If none of the provided shloks fit, focus on pure empathy and wait for a better moment.
   - Quality of resonance is more important than providing scripture in every message.

3. RESPONSE STRUCTURE:
   When sharing scripture, use these exact markers:
   [CHAT] A brief warm response connecting to their situation.
   [SCRIPTURE] The Sanskrit shlok + Source (e.g., Bhagavad Gita 2.47)
   [TEACHING] Explain the meaning deeply and personally for ${userName}.
   [GUIDANCE] One gentle, open question to carry forward.

   If NOT sharing scripture, use only:
   [CHAT] Your warm, empathetic response.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TONE: Warm, grounded, non-preachy. Like a trusted elder who has lived through much. 
FORMAT RULES: NO EMOJIS. No lists. No bullet points.`


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

        // No more forced random injection here. 
        // We trust the AI (guided by the improved SYSTEM_PROMPT) to use the shloks 
        // provided in the context ONLY if they resonate.

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
