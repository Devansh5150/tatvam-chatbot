import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 1. Refresh session
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Protect routes
    const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')
    const isPublicRoute = ['/', '/login', '/signup'].includes(request.nextUrl.pathname)
    const isProtectedRoute = 
        request.nextUrl.pathname.startsWith('/dashboard') || 
        request.nextUrl.pathname.startsWith('/portal') ||
        (request.nextUrl.pathname.startsWith('/api') && !isAuthRoute)

    // Redirect to login if accessing a protected route without a session
    if (isProtectedRoute && !user) {
        // For API routes, return a 401 instead of redirect
        if (request.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to dashboard if accessing login/signup with a session
    if (isPublicRoute && user && request.nextUrl.pathname !== '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
