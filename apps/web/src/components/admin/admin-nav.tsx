import Link from "next/link"
import { LayoutDashboard, Server, Users, Activity, Tag, Award } from "lucide-react"

import { cn } from "@/lib/utils"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string
        title: string
        icon: React.ElementType
    }[]
}

export function AdminNav({ className, items, ...props }: SidebarNavProps) {
    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        "transition-colors"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                </Link>
            ))}
        </nav>
    )
}

export const adminNavItems = [
    {
        title: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Servers",
        href: "/admin/servers",
        icon: Server,
    },
    {
        title: "Users",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Tags",
        href: "/admin/tags",
        icon: Tag,
    },
    {
        title: "Badges",
        href: "/admin/badges",
        icon: Award,
    },
    {
        title: "System",
        href: "/admin/system",
        icon: Activity,
    },
]
