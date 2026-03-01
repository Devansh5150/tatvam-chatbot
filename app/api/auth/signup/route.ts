import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail, toSafeUser, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { detail: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { detail: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        const existing = findUserByEmail(email)
        if (existing) {
            return NextResponse.json(
                { detail: 'This email is already part of the circle' },
                { status: 400 }
            )
        }

        const user = createUser(name, email, password)
        const token = createToken(user.id, user.email)

        return NextResponse.json({
            access_token: token,
            token_type: 'bearer',
            user: toSafeUser(user),
        })
    } catch (err: any) {
        return NextResponse.json(
            { detail: err.message || 'Something went wrong' },
            { status: 500 }
        )
    }
}
