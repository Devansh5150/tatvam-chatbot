import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient, supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { detail: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Use the Server Client to handle cookies automatically
        const supabase = await createServerSideClient()

        // 1. Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            return NextResponse.json(
                { detail: authError.message },
                { status: 401 }
            )
        }

        if (!authData.user) {
            return NextResponse.json(
                { detail: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // 2. Fetch profile details
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('name')
            .eq('id', authData.user.id)
            .single()

        return NextResponse.json({
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: profile?.name || 'Seeker'
            }
        })
    } catch (err) {
        console.error('Login error:', err)
        return NextResponse.json(
            { detail: err instanceof Error ? err.message : 'Something went wrong' },
            { status: 500 }
        )
    }
}

