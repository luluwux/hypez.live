'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CircleAlert, BrainCircuit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SessionData {
    id: string;
    mode: 'LOGIC' | 'VISUAL' | 'IDENTITY';
    status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
    expiresAt: string;
    challengeData?: {
        question?: string;
        options?: number[];
    };
}

export function VerificationClient({ session }: { session: SessionData }) {
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
        session.status === 'VERIFIED' ? 'success' : session.status === 'EXPIRED' ? 'error' : 'idle'
    );
    const [errorMessage, setErrorMessage] = useState(session.status === 'EXPIRED' ? 'Session Expired' : '');

    const handleAnswer = async (answer: any) => {
        setStatus('verifying');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${apiUrl}/verification/${session.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer })
            });

            if (res.ok) {
                setStatus('success');
                toast.success('Verification Complete!');
                // Optional: Redirect back to bot discussion or close window
            } else {
                setStatus('error');
                setErrorMessage('Incorrect Answer. Please try again.');
                toast.error('Verification Failed');
            }
        } catch (e) {
            setStatus('error');
            setErrorMessage('Network Error. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900/50 border border-green-500/30 p-8 rounded-2xl text-center backdrop-blur-md"
            >
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verified!</h2>
                <p className="text-zinc-400">You can now close this window and return to Discord.</p>
            </motion.div>
        );
    }

    if (status === 'error' && session.status === 'EXPIRED') {
        return (
            <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-2xl text-center backdrop-blur-md">
                <CircleAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Session Expired</h2>
                <p className="text-zinc-400">Please request a new verification link from the bot.</p>
            </div>
        );
    }

    // LOGIC / MATH Mode UI
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
            {/* Progress / Timer Bar (Visual Only for now) */}
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
                <div className="h-full bg-cyan-500 animate-[width_100%_linear_10s]" style={{ width: '100%' }} />
            </div>

            <div className="flex items-center gap-3 mb-6 mt-2">
                <BrainCircuit className="w-6 h-6 text-cyan-400" />
                <span className="text-zinc-300 font-medium">Solve the Challenge</span>
            </div>

            <div className="text-center mb-8 py-8 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <span className="text-4xl font-mono font-bold tracking-wider text-white">
                    {session.challengeData?.question || '???'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {session.challengeData?.options?.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={status === 'verifying'}
                        className="group relative px-6 py-4 bg-zinc-800/50 hover:bg-zinc-700/50 active:bg-cyan-500/20 border border-zinc-700 hover:border-cyan-500/50 rounded-xl transition-all duration-200"
                    >
                        <span className="text-xl font-bold text-zinc-300 group-hover:text-white transition-colors">
                            {opt}
                        </span>
                        {status === 'verifying' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-xl">
                                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {status === 'error' && errorMessage && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
                >
                    {errorMessage}
                </motion.div>
            )}

        </motion.div>
    );
}
