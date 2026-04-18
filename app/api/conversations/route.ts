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

        // Format to match frontend structure
        const formatted = conversations.map(c => ({
            id: c.id,
            title: c.title,
            updatedAt: new Date(c.created_at).getTime(),
            messages: c.messages.sort((a: any, b: any) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ).map((m: any) => ({
                id: m.id,
                type: m.role === 'user' ? 'user' : 'chat',
                content: m.content,
                timestamp: new Date(m.created_at),
                metadata: m.metadata
            }))
        }))

        return NextResponse.json(formatted)
    } catch (err: any) {
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
    } catch (err: any) {
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

        // Delete conversation (Cascade will handle messages)
        const { error: delError } = await supabaseAdmin
            .from('conversations')
            .delete()
            .eq('id', conversationId)
            .eq('user_id', user.id) // Ensure security

        if (delError) throw delError

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Conversation delete error:', err)
        return NextResponse.json({ detail: err.message }, { status: 500 })
    }
}
