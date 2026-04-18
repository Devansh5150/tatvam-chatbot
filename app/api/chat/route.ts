import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

4. MULTILINGUAL GRACE:
   - If ${userName} speaks in Hindi or Sanskrit, reciprocate with the same warmth and depth in that language. You are fluent and grounded in both.

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
            const sourceMatch = content.match(/—\s*(.+?)$/m)
            const source = sourceMatch ? sourceMatch[1].trim() : undefined
            parts.push({ type, content, source })
        } else {
            parts.push({ type, content })
        }
    }

    return parts.length > 0 ? parts : [{ type: 'chat', content: reply.trim() }]
}

// ─── Chat API (Groq + Supabase RAG + Persistence) ──────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { message, history, userName, conversationId } = await req.json()

        if (!message) {
            return NextResponse.json({ detail: 'Message is required' }, { status: 400 })
        }

        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { detail: 'Groq API key is not configured.' },
                { status: 500 }
            )
        }

        // 🆔 Identity: Verify Token if provided
        const authHeader = req.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')
        let userId: string | null = null
        
        if (token) {
            const { data: { user } } = await supabase.auth.getUser(token)
            userId = user?.id || null
        }

        // 🔎 RAG: Find relevant scriptures
        const keywords = message.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
        const { data: scriptures } = await supabase.from('scriptures').select('*').limit(50)

        const relevant = (scriptures || []).map(s => {
            let score = 0
            const text = `${s.english} ${s.hindi} ${s.source} ${(s.themes || []).join(' ')}`.toLowerCase()
            keywords.forEach((word: string) => { if (text.includes(word)) score += 1 })
            return { ...s, score }
        })
        .filter(s => s.score > 0 || (scriptures && scriptures.length < 5))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

        let scriptureContext = ''
        if (relevant.length > 0) {
            scriptureContext = '\n\nSCRIPTURAL ESSENCE:\n'
            for (const s of relevant) {
                scriptureContext += `- ${s.source} ${s.chapter ? s.chapter + '.' + s.verse : ''}: ${s.sanskrit} (Meaning: ${s.english})\n`
            }
        }

        const userMessageCount = history && Array.isArray(history) ? history.length + 1 : 1
        const messages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT(userName, userMessageCount) + scriptureContext },
        ]

        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
                messages.push({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content })
            }
        }
        messages.push({ role: 'user', content: message })

        // 🤖 Call AI
        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.6 }),
        })

        const data = await aiResponse.json()
        const reply = data.choices?.[0]?.message?.content

        if (!reply) return NextResponse.json({ detail: 'No reflection generated.' }, { status: 500 })

        // 💾 Persistence: Save to Supabase if user is logged in
        let currentConvId = conversationId
        let persistenceError = null

        if (userId) {
            console.log('User identified for persistence:', userId)
            // Find or create conversation
            if (!currentConvId) {
                const { data: conv, error: convErr } = await supabaseAdmin.from('conversations').insert({
                    user_id: userId,
                    title: message.slice(0, 40) + (message.length > 40 ? '...' : '')
                }).select().single()
                
                if (convErr) {
                    console.error('Failed to create conversation:', convErr)
                    persistenceError = { step: 'create_conv', ...convErr }
                } else {
                    currentConvId = conv?.id
                    console.log('Created new conversation:', currentConvId)
                }
            }

            if (currentConvId) {
                // Save messages
                const { error: msgErr } = await supabaseAdmin.from('messages').insert([
                    { conversation_id: currentConvId, role: 'user', content: message },
                    { conversation_id: currentConvId, role: 'assistant', content: reply, metadata: { scriptures: relevant.map(s => s.source) } }
                ])
                if (msgErr) {
                    console.error('Failed to save messages:', msgErr)
                    persistenceError = { step: 'save_msg', ...msgErr }
                } else {
                    console.log('Messages persisted successfully')
                }
            }
        }

        return NextResponse.json({
            reply,
            parts: parseAIResponse(reply),
            scriptures_used: relevant.map(s => s.source),
            conversationId: currentConvId,
            debug: {
                userId,
                persistenceError
            }
        })
    } catch (err: any) {
        console.error('Chat API error:', err)
        return NextResponse.json({ 
            detail: err.message || 'Something went wrong',
            stack: err.stack 
        }, { status: 500 })
    }
}

