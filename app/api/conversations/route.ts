import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

        // Fetch conversations
        const { data: conversations, error: convError } = await supabase
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
