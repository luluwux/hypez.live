import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
if (!ADMIN_API_KEY) {
    throw new Error('ADMIN_API_KEY environment variable is not set');
}

// Only alphanumeric, hyphens, underscores, and forward slashes — no dots, no colons, no protocol
const SAFE_PATH_RE = /^[a-zA-Z0-9\-_/]+$/;

function buildAdminApiUrl(rawPath: string, extraParams: URLSearchParams): string | null {
    const path = rawPath.trim();
    if (!path || path.includes('..') || path.includes('//') || !SAFE_PATH_RE.test(path)) {
        return null;
    }
    const qs = extraParams.toString();
    return `${API_URL}/${path}${qs ? `?${qs}` : ''}`;
}

function buildAdminHeaders(): Record<string, string> {
    return {
        'x-admin-key': ADMIN_API_KEY as string,
        'Content-Type': 'application/json',
    };
}

async function requireAdmin(): Promise<NextResponse | null> {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
}

export async function GET(request: NextRequest) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const url = new URL(request.url);
        const rawPath = url.searchParams.get('path') || '';
        const forwardParams = new URLSearchParams(url.searchParams);
        forwardParams.delete('path');

        const apiUrl = buildAdminApiUrl(rawPath, forwardParams);
        if (!apiUrl) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        const response = await fetch(apiUrl, { method: 'GET', headers: buildAdminHeaders() });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch from API' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const url = new URL(request.url);
        const rawPath = url.searchParams.get('path') || '';
        const forwardParams = new URLSearchParams(url.searchParams);
        forwardParams.delete('path');

        const apiUrl = buildAdminApiUrl(rawPath, forwardParams);
        if (!apiUrl) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        const body = await request.json();
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: buildAdminHeaders(),
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to post to API' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const url = new URL(request.url);
        const rawPath = url.searchParams.get('path') || '';
        const forwardParams = new URLSearchParams(url.searchParams);
        forwardParams.delete('path');

        const apiUrl = buildAdminApiUrl(rawPath, forwardParams);
        if (!apiUrl) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        const body = await request.json();
        const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: buildAdminHeaders(),
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to patch API' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const url = new URL(request.url);
        const rawPath = url.searchParams.get('path') || '';
        const forwardParams = new URLSearchParams(url.searchParams);
        forwardParams.delete('path');

        const apiUrl = buildAdminApiUrl(rawPath, forwardParams);
        if (!apiUrl) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: buildAdminHeaders(),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to delete from API' }, { status: 500 });
    }
}
