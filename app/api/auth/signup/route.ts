import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { detail: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { detail: data.detail || 'Something went wrong' },
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
