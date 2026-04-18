import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json(
                { detail: 'Token required' },
                { status: 401 }
            )
        }

        // 1. Get user from Supabase using the token
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return NextResponse.json(
                { detail: 'Invalid or expired sacred token' },
                { status: 401 }
            )
        }

        // 2. Fetch profile details (to get the name)
        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: profile?.name || 'Seeker'
            }
        })
    } catch (err: any) {
        console.error('Me API error:', err)
        return NextResponse.json(
            { detail: err.message || 'Something went wrong' },
            { status: 500 }
        )
    }
}

