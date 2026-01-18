import { NextResponse } from 'next/server'
import { supabase, validateSupabaseConfig } from '@/lib/supabase'
import { z } from 'zod'

const waitlistSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
})

export async function POST(req: Request) {
    // Validate that Supabase is configured
    try {
        validateSupabaseConfig()
    } catch (error: any) {
        console.error('Supabase configuration error:', error.message)
        return NextResponse.json(
            { error: 'Server configuration error. Please contact support.' },
            { status: 500 }
        )
    }

    try {
        const body = await req.json()

        // Validate request body
        const { name, email } = waitlistSchema.parse(body)

        // Insert into Supabase
        const { data, error } = await supabase
            .from('waitlist')
            .insert([{ name, email }])
            .select()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json(
                { error: `Supabase error: ${error.message}${error.hint ? ` (${error.hint})` : ''}` },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
