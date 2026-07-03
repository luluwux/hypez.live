"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Server,
  Users,
  Activity,
  Settings,
  Search
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <div 
        className="relative w-full sm:w-64 cursor-pointer group" 
        onClick={() => setOpen(true)}
      >
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
          <Search className="h-4 w-4" />
        </div>
        <div
            className="flex items-center h-8 w-full rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-3 pl-9 text-sm transition-colors hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
            <span className="truncate">Search...</span>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <span className="text-[10px] bg-sidebar-accent border border-sidebar-border px-1.5 py-0.5 rounded text-sidebar-foreground/50 font-mono font-medium tracking-widest">⌘K</span>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/admin"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
              <CommandShortcut>d d</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/servers"))}>
              <Server className="mr-2 h-4 w-4" />
              <span>Servers</span>
              <CommandShortcut>s s</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/users"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Users</span>
              <CommandShortcut>u u</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/system"))}>
              <Activity className="mr-2 h-4 w-4" />
              <span>System Health</span>
              <CommandShortcut>h h</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/system"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
