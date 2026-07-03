import withBundleAnalyzer from '@next/bundle-analyzer';// 'unsafe-inline' in script-src is required for Next.js 15 RSC flight-data
// inline scripts and client-side hydration. Without it the page renders but
// never becomes interactive. The remaining directives still block:
//   • arbitrary external script loads (XSS via <script src="...">)
//   • clickjacking (frame-ancestors 'none')
//   • protocol-downgrade and mixed-content (https: only in connect-src)
const isDev = process.env.NODE_ENV === 'development';

const connectSrcParts = [
    "'self'",
    // Dev: Next.js HMR WebSocket + local API
    ...(isDev ? ['http://localhost:3001', 'ws://localhost:3001', 'ws://localhost:3000'] : []),
    'https://api.hypez.live',
    'wss://api.hypez.live',
    'https://vitals.vercel-insights.com', // Vercel Analytics beacon
];

const scriptSrcParts = [
    "'self'",
    "'unsafe-inline'", // Required: Next.js RSC inline hydration scripts
    ...(isDev ? ["'unsafe-eval'"] : []), // Only in dev for HMR/fast-refresh
    'https://va.vercel-scripts.com', // Vercel Analytics loader script
];

const cspValue = [
    "default-src 'self'",
    `script-src ${scriptSrcParts.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    // cdn.discord.com is also used by remotePatterns — keep in sync
    "img-src 'self' data: https://cdn.discordapp.com https://cdn.discord.com https://media.discordapp.net",
    `connect-src ${connectSrcParts.join(' ')}`,
    "font-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn.discord.com',
            },
            {
                protocol: 'https',
                hostname: 'media.discordapp.net',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 3600,
        qualities: [65, 75, 85, 95, 100],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },
    async redirects() {
        return [
            {
                source: '/discover',
                destination: '/servers',
                permanent: true,
            },
            {
                source: '/server/:id',
                destination: '/servers/:id',
                permanent: true,
            }
        ];
    },
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: '/((?!_next/|api/).*)',
                    destination: '/status',
                    has: [{ type: 'host', value: 'status.hypez.live' }],
                },
            ],
        };
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: cspValue,
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'Cross-Origin-Resource-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                ],
            },
        ];
    },
};

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzer(nextConfig);
