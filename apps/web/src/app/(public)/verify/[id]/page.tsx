import { notFound } from "next/navigation";
import { VerificationClient } from "./client-page";
import type { Metadata } from 'next';

// Define the shape of the API response
interface SessionData {
    id: string;
    mode: 'LOGIC' | 'VISUAL' | 'IDENTITY';
    status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
    expiresAt: string;
    challengeData?: {
        question?: string;
        options?: number[];
        answer?: number;
    };
}

// Fetch session data from API
async function getSession(id: string): Promise<SessionData | null> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    try {
        const res = await fetch(`${apiUrl}/verification/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data;
    } catch (e) {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    return {
        title: 'Verify Vote - Hypez Shield',
        description: 'Complete the security challenge to verify your vote.',
        robots: 'noindex, nofollow' // Security page, do not index
    };
}

export default async function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession(id);

    if (!session) return notFound();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15)_0%,_transparent_60%)] opacity-40 animate-pulse" />
            </div>

            <div className="z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-2">
                        Hypez Shield
                    </h1>
                    <p className="text-zinc-500 text-sm">One-Time Verification Challenge</p>
                </div>

                <VerificationClient session={session} />
            </div>
        </div>
    );
}
