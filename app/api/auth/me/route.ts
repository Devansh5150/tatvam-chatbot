import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, findUserById, toSafeUser } from '@/lib/auth'

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

        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json(
                { detail: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        const user = findUserById(payload.sub)
        if (!user) {
            return NextResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(toSafeUser(user))
    } catch (err: any) {
        return NextResponse.json(
            { detail: err.message || 'Something went wrong' },
            { status: 500 }
        )
    }
}
