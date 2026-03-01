import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, verifyPassword, toSafeUser, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { detail: 'Email and password are required' },
                { status: 400 }
            )
        }

        const user = findUserByEmail(email)
        if (!user || !verifyPassword(password, user.hashedPassword)) {
            return NextResponse.json(
                { detail: 'Invalid email or password' },
                { status: 401 }
            )
        }

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
