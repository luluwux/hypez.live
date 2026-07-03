import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

async function getCryptoKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('salty-salt'), // In prod, salt should be random/managed, but for simple shared secret generic salt is ok-ish or just use raw key if 32 bytes
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );
}

// Simple direct key import if secret is 32 chars specific
async function getImportedKey(secret: string): Promise<CryptoKey> {
    // Pad or truncate to 32 bytes
    const encoder = new TextEncoder();
    const rawKey = encoder.encode(secret.padEnd(32, '0').slice(0, 32));
    return crypto.subtle.importKey(
        'raw',
        rawKey,
        'AES-GCM',
        false,
        ['decrypt']
    );
}

async function decryptToken(token: string, secret: string): Promise<string | null> {
    try {
        // Expected format: iv_hex:ciphertext_hex
        const [ivHex, cipherHex] = token.split(':');
        if (!ivHex || !cipherHex) return null;

        const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

        const key = await getCryptoKey(secret);

        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error('Decryption failed:', e);
        return null;
    }
}

// Generate random noise paths
function generateNoise(count: number, width: number, height: number, type: 'line' | 'dot') {
    return Array.from({ length: count }).map((_, i) => {
        if (type === 'line') {
            const x1 = Math.random() * width;
            const y1 = Math.random() * height;
            const x2 = Math.random() * width;
            const y2 = Math.random() * height;
            return (
                <line
                    key={`line-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(6, 182, 212, 0.4)"
                    strokeWidth={1 + Math.random() * 2}
                />
            );
        } else {
            const cx = Math.random() * width;
            const cy = Math.random() * height;
            const r = 1 + Math.random() * 3;
            return (
                <circle
                    key={`dot-${i}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="rgba(59, 130, 246, 0.4)"
                />
            );
        }
    });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token'); // Encrypted token
        // Fallback for dev/testing if no token provided, or use a "preview" code if specified
        const devCode = searchParams.get('dev_code');

        const secret = process.env.CAPTCHA_SECRET;
        if (!secret) {
            return new Response('CAPTCHA_SECRET environment variable is not configured', { status: 500 });
        }

        let code = '????';

        if (token) {
            const decrypted = await decryptToken(token, secret);
            if (decrypted) {
                code = decrypted;
            } else {
                console.error('Failed to decrypt token');
            }
        } else if (devCode && process.env.NODE_ENV !== 'production') {
            code = devCode;
        }
        // No token in production → render placeholder only; never expose a live code

        // Split code for individual rotation
        const characters = code.split('').map((char, i) => {
            const rotation = -15 + Math.random() * 30; // -15 to 15 degrees
            return { char, rotation };
        });

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f0f1e',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Base Noise Layer (SVG) */}
                    <svg
                        width="400"
                        height="200"
                        viewBox="0 0 400 200"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                    >
                        {generateNoise(15, 400, 200, 'line')}
                        {generateNoise(30, 400, 200, 'dot')}
                    </svg>

                    {/* Captcha Text Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 15,
                            zIndex: 10,
                            filter: 'blur(0.5px)', // Slight blur for difficulty
                        }}
                    >
                        {characters.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    fontSize: 80,
                                    fontWeight: 900,
                                    color: '#ffffff',
                                    transform: `rotate(${item.rotation}deg)`,
                                    textShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
                                    display: 'flex',
                                }}
                            >
                                {item.char}
                            </div>
                        ))}
                    </div>

                    {/* Overlay Noise (Foreground) */}
                    <svg
                        width="400"
                        height="200"
                        viewBox="0 0 400 200"
                        style={{ position: 'absolute', top: 0, left: 0, zIndex: 20, opacity: 0.6 }}
                    >
                        {generateNoise(10, 400, 200, 'line')}
                    </svg>

                    {/* Branding (Subtle) */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 10,
                            right: 15,
                            fontSize: 14,
                            color: '#475569',
                            fontWeight: 'bold',
                            opacity: 0.5,
                        }}
                    >
                        HYPEZ SHIELD
                    </div>
                </div>
            ),
            {
                width: 400,
                height: 200,
            }
        );
    } catch (error) {
        console.error('Captcha generation error:', error);
        return new ImageResponse(
            (
                <div style={{ backgroundColor: '#000', color: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Error
                </div>
            ),
            { width: 400, height: 200 }
        );
    }
}
