import { NextRequest, NextResponse } from 'next/server'

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

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/auth/me?token=${token}`, {
            method: 'GET',
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { detail: data.detail || 'Invalid or expired token' },
                { status: response.status }
            )
        }

        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json(
            { detail: err.message || 'Something went wrong' },
            { status: 500 }
        )
    }
}
