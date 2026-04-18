import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { detail: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        // 1. Create user using ADMIN API (Bypasses rate limits and email confirmation)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // AUTO-CONFIRM user instantly
            user_metadata: { name }
        })

        if (authError) {
            // If user already exists, try to return a graceful error
            if (authError.message.includes('already registered')) {
                return NextResponse.json({ detail: 'This email is already registered.' }, { status: 400 })
            }
            return NextResponse.json({ detail: authError.message }, { status: 400 })
        }

        if (!authData.user) {
            return NextResponse.json({ detail: 'Could not create user' }, { status: 500 })
        }

        // 2. Create entry in public.profiles table (Using Admin Client)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                name: name,
                email: email,
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
        }

        // 3. To provide a session (since admin.createUser doesn't return one), 
        // we sign them in normally now that the account is confirmed.
        const { data: sessionData } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        return NextResponse.json({
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: name
            },
            access_token: sessionData.session?.access_token,
            refresh_token: sessionData.session?.refresh_token
        })
    } catch (err: any) {
        console.error('Signup error:', err)
        return NextResponse.json(
            { detail: err.message || 'Something went wrong' },
            { status: 500 }
        )
    }
}



