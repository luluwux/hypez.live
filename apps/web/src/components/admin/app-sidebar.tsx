"use client"

import * as React from "react"
import {
    AudioWaveform,
    Command,
    GalleryVerticalEnd,
    LayoutDashboard,
    Server,
    Users,
    Activity,
    ShieldAlert,
    Settings,
    Tag,
    Shield,
    FileText,
    User,
    CreditCard
} from "lucide-react"

import { NavUser } from "@/components/admin/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/lib/i18n/hooks"

// Menu data generator function
const getNavData = (t: any) => ({
    teams: [
        {
            name: "Hypez Admin",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
    ],
    navMain: [
        {
            title: t('admin.overview') || "Overview",
            url: "/admin",
            icon: LayoutDashboard,
            isActive: true,
            items: [],
        },
        {
            title: t('admin.servers') || "Servers",
            url: "/admin/servers",
            icon: Server,
            items: [],
        },
        {
            title: "Applications",
            url: "/admin/applications",
            icon: FileText,
            items: [],
        },
        {
            title: t('admin.users') || "Users",
            url: "/admin/users",
            icon: Users,
            items: [
                { title: "All Users", url: "/admin/users" },
                { title: "Admins", url: "/admin/users?role=admin" },
            ],
        },
        {
            title: "System",
            url: "/admin/system",
            icon: Activity,
            items: [
                { title: "Health Status", url: "/admin/system" },
                { title: "Audit Logs", url: "/admin/logs" },
            ],
        },
        {
            title: "Tags",
            url: "/admin/tags",
            icon: Tag,
            items: [],
        },
        {
            title: "Badges",
            url: "/admin/badges",
            icon: Shield,
            items: [],
        },
        {
            title: t('admin.botSettings') || "Bot Settings",
            url: "/admin/bot-settings",
            icon: Settings,
            items: [],
        },
        {
            title: "Premium Codes",
            url: "/admin/premium-codes",
            icon: CreditCard,
            items: [],
        },
    ],
    navFooter: [
        {
            title: "Profile",
            url: "/admin/profile",
            icon: User,
        },
        {
            title: "Billing",
            url: "/admin/billing",
            icon: CreditCard,
        }
    ]
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { t } = useTranslation()
    const data = getNavData(t)

    return (
        <Sidebar collapsible="icon" variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <GalleryVerticalEnd className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Hypez</span>
                                    <span className="truncate text-xs">Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu>
                        {data.navMain.map((item) => {
                            const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                            const hasSubmenu = item.items.length > 0;

                            if (!hasSubmenu) {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            isActive={pathname === item.url}
                                        >
                                            <Link href={item.url}>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            }

                            return (
                                <Collapsible
                                    key={item.title}
                                    asChild
                                    defaultOpen={isActive}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title}>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items?.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                                            <Link href={subItem.url}>
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>

                <div className="my-1 h-px bg-border mx-4" />

                <SidebarGroup>
                    <SidebarGroupLabel>Hesap & Ödemeler</SidebarGroupLabel>
                    <SidebarMenu>
                        {data.navFooter.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                                    <Link href={item.url}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
