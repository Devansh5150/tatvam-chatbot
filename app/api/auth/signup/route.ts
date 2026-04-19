import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient, supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { detail: 'Email and password are required' },
                { status: 400 }
            )
        }

        const supabase = await createServerSideClient()

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) {
            return NextResponse.json(
                { detail: authError.message },
                { status: 400 }
            )
        }

        if (!authData.user) {
            return NextResponse.json(
                { detail: 'Registration failed' },
                { status: 400 }
            )
        }

        // 2. Create profile entry using Admin client (to bypass potential RLS check during creation)
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: authData.user.id,
            email: authData.user.email,
            name: name || 'Seeker',
        })

        if (profileError) {
            console.error('Profile creation error:', profileError)
            // We don't fail the whole request because the auth user was still created
        }

        return NextResponse.json({
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: name || 'Seeker'
            }
        })
    } catch (err) {
        console.error('Signup error:', err)
        return NextResponse.json(
            { detail: err instanceof Error ? err.message : 'Something went wrong' },
            { status: 500 }
        )
    }
}

