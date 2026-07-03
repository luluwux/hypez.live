import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AppSidebar } from "@/components/admin/app-sidebar"
import { CommandMenu } from "@/components/admin/command-menu"
import { ThemeToggle } from "@/components/admin/theme-toggle"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface AdminLayoutProps {
    children: React.ReactNode
}
export default async function AdminLayout({ children }: AdminLayoutProps) {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset className="max-h-svh overflow-hidden flex flex-col">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border bg-background px-4 transition-[width] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto flex items-center gap-2 pr-1">
                        <CommandMenu />
                        <ThemeToggle />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
