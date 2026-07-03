import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LanguageProvider } from "@/lib/i18n/context";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "next-themes";
import NextTopLoader from 'nextjs-toploader';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hypez.live'),
  title: {
    default: 'Hypez — Discord Server List',
    template: '%s | Hypez',
  },
  description: 'Discover the best Discord servers. Browse, vote, and find your next community on Hypez — the modern Discord server list.',
  keywords: ['discord server list', 'discord servers', 'discord community', 'find discord servers', 'discord bot'],
  authors: [{ name: 'Hypez' }],
  creator: 'Hypez',
  publisher: 'Hypez',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hypez.live',
    siteName: 'Hypez',
    title: 'Hypez — Discord Server List',
    description: 'Discover the best Discord servers. Browse, vote, and find your next community on Hypez.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hypez — Discord Server List',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hypez — Discord Server List',
    description: 'Discover the best Discord servers. Browse, vote, and find your next community on Hypez.',
    images: ['/og-image.png'],
    creator: '@hypezdotlive',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader
            color="#38bdf8"
            showSpinner={false}
            height={2}
            shadow="0 0 10px #38bdf8,0 0 5px #38bdf8"
          />
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
          <ToastProvider />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
