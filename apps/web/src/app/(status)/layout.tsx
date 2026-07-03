import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function StatusHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-5 sm:px-8 bg-[#0a0a0b]/80 backdrop-blur-md border-b border-white/5">
            <Link
                href="https://hypez.live"
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors duration-200"
            >
                <ArrowLeft size={14} strokeWidth={2} />
                <span>hypez.live</span>
            </Link>
        </header>
    )
}

export default function StatusLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen">
            <StatusHeader />
            {children}
        </div>
    )
}
