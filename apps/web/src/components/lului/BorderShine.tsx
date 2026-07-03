"use client"

import { cn } from "@/lib/utils"

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
    borderWidth?: number
    duration?: number
    shineColor?: string | string[]
}

export function ShineBorder({
    borderWidth = 1,
    duration = 14,
    shineColor = "#000000",
    className,
    style,
    children,
    ...props
}: ShineBorderProps) {
    const gradient = Array.isArray(shineColor) ? shineColor.join(", ") : shineColor

    return (
        <div
            style={
                {
                    "--border-width": `${borderWidth}px`,
                    "--duration": `${duration}s`,
                    mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                    WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    padding: "var(--border-width)",
                    ...style,
                } as React.CSSProperties
            }
            className={cn(
                "pointer-events-none absolute inset-0 size-full rounded-[inherit] overflow-hidden z-20",
                className
            )}
            {...props}
        >
            {/* GPU-composited shine: translates instead of animating background-position */}
            <div
                className="absolute inset-0 animate-shine will-change-transform"
                style={{
                    background: `linear-gradient(90deg, transparent, ${gradient}, transparent)`,
                }}
            />
            {children}
        </div>
    )
}
