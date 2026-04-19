import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSideClient()

        // 1. Get user from session (automatically from cookies)
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { detail: 'Not authenticated' },
                { status: 401 }
            )
        }

        // 2. Fetch profile from DB
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('name, email')
            .eq('id', user.id)
            .single()

        if (profileError) {
            return NextResponse.json(
                {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: 'Seeker'
                    }
                }
            )
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: profile.email,
                name: profile.name
            }
        })
    } catch (err) {
        console.error('Me endpoint error:', err)
        return NextResponse.json(
            { detail: err instanceof Error ? err.message : 'Something went wrong' },
            { status: 500 }
        )
    }
}
