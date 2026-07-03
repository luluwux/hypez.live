import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'

export async function GET() {
    try {
        const response = await fetch(`${API_URL}/categories`, {
            next: { revalidate: 300 }, // 5-minute ISR cache
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch categories' }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
            },
        })
    } catch {
        return NextResponse.json({ error: 'Categories unavailable' }, { status: 503 })
    }
}
