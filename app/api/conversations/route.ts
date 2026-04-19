import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json({ detail: 'Authentication required' }, { status: 401 })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ detail: 'Invalid session' }, { status: 401 })
        }

        // Fetch conversations using Admin Client to bypass RLS (filtered by user.id)
        const { data: conversations, error: convError } = await supabaseAdmin
            .from('conversations')
            .select(`
                id,
                title,
                created_at,
                messages (
                    id,
                    role,
                    content,
                    created_at,
                    metadata
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (convError) {
            throw convError
        }

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

    if (markers.length === 0) return [{ type: 'chat', content: reply.trim() }]

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

function splitBilingualReply(reply: string): { english: string; hindi: string } {
    const engMatch = reply.match(/\[ENGLISH_REPLY\]([\s\S]*?)(?=\[HINDI_REPLY\]|$)/i)
    const hindiMatch = reply.match(/\[HINDI_REPLY\]([\s\S]*?)$/i)
    return {
        english: engMatch ? engMatch[1].trim() : reply.trim(),
        hindi: hindiMatch ? hindiMatch[1].trim() : '',
    }
}

        // Format to match frontend structure
        const formatted = conversations.map(c => {
            const allMessages: any[] = [];
            
            c.messages.sort((a: any, b: any) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ).forEach((m: any) => {
                if (m.role === 'user') {
                    allMessages.push({
                        id: m.id,
                        type: 'user',
                        content: m.content,
                        timestamp: new Date(m.created_at),
                        metadata: m.metadata
                    })
                } else {
                    const { english: reply_english } = splitBilingualReply(m.content)
                    const parts = parseAIResponse(reply_english)
                    parts.forEach((p, i) => {
                        let msgType = 'chat'
                        if (p.type === 'scripture') msgType = 'shlok'
                        else if (p.type === 'teaching') msgType = 'meaning'
                        else if (p.type === 'guidance') msgType = 'reflection'
                        
                        allMessages.push({
                            id: m.id + '-' + i,
                            type: msgType,
                            content: p.content,
                            source: p.source,
                            timestamp: new Date(m.created_at),
                            metadata: m.metadata
                        })
                    })
                }
            })

            return {
                id: c.id,
                title: c.title,
                updatedAt: new Date(c.created_at).getTime(),
                messages: allMessages
            }
        })

        return NextResponse.json(formatted)
    } catch (err) {
        console.error('Conversations fetch error:', err)
        return NextResponse.json({ detail: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { title } = await req.json()
        const authHeader = req.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json({ detail: 'Authentication required' }, { status: 401 })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ detail: 'Invalid session' }, { status: 401 })
        }

        const { data: conv, error: convError } = await supabaseAdmin
            .from('conversations')
            .insert({
                user_id: user.id,
                title: title || 'New Reflection'
            })
            .select()
            .single()

        if (convError) throw convError

        return NextResponse.json(conv)
    } catch (err) {
        console.error('Conversation creation error:', err)
        return NextResponse.json({ detail: err.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id: conversationId } = await req.json()
        const authHeader = req.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token || !conversationId) {
            return NextResponse.json({ detail: 'Authentication and ID required' }, { status: 401 })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ detail: 'Invalid session' }, { status: 401 })
        }

        // Delete associated messages first (Manual Cascade)
        console.log(`[Delete] Attempting to delete messages for conversation: ${conversationId}`)
        const { error: msgDelError } = await supabaseAdmin
            .from('messages')
            .delete()
            .eq('conversation_id', conversationId)

        if (msgDelError) {
            console.error(`[Delete] Error deleting messages for conversation ${conversationId}:`, msgDelError)
            // We continue anyway to attempt conversation deletion, as messages might already be empty
        }

        // Delete conversation
        console.log(`[Delete] Attempting to delete conversation: ${conversationId} for user: ${user.id}`)
        const { error: delError, count } = await supabaseAdmin
            .from('conversations')
            .delete({ count: 'exact' })
            .eq('id', conversationId)
            .eq('user_id', user.id) // Ensure security

        if (delError) {
            console.error(`[Delete] Error deleting conversation ${conversationId}:`, delError)
            throw delError
        }

        if (count === 0) {
            console.warn(`[Delete] No conversation found with ID ${conversationId} for user ${user.id}`)
            return NextResponse.json({ success: false, detail: 'Reflection not found or already released.' })
        }

        console.log(`[Delete] Successfully deleted conversation: ${conversationId}`)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Conversation delete error:', err)
        return NextResponse.json({ detail: err.message }, { status: 500 })
    }
}
