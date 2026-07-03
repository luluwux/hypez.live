"use client";

import { cn } from "@/lib/utils";

interface GradientTextProps {
    colors?: string[];
    animationSpeed?: number;
    showBorder?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function GradientText({
    colors = ["#38bdf8", "#818cf8", "#c084fc"],
    animationSpeed = 4,
    showBorder = false,
    className,
    children,
}: GradientTextProps) {
    const gradientColors = colors.join(", ");

    return (
        <>
            <style>{`
                @keyframes gradientShift {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>
            <span
                className={cn(
                    "font-bold bg-clip-text text-transparent",
                    showBorder && "drop-shadow-[0_0_6px_rgba(56,189,248,0.3)]",
                    className
                )}
                style={{
                    backgroundImage: `linear-gradient(to right, ${gradientColors})`,
                    backgroundSize: "200% auto",
                    animation: `gradientShift ${animationSpeed}s linear infinite`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
            >
                {children}
            </span>
        </>
    );
}
