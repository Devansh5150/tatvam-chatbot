import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 1. Static Client (Legacy/Public)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Admin Client (Server-side Only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// 3. Browser Client for Client Components
export function createClientSideClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// 4. Server Client for API Routes & Server Components
export async function createServerSideClient() {
    const cookieStore = await cookies()

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // This can happen in server components, which is expected
                }
            },
        },
    })
}

export function validateSupabaseConfig() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment settings.')
    }
}
