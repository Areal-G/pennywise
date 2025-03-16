import { AppSidebar } from "@/components/app-sidebar"
import { CommandMenuButton, CommandPalette } from "@/components/command-palette"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { CurrencySwitcher } from "@/components/currency-switcher"
import { PageTransition } from "@/components/page-transition"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Mock data is dated relative to today, so render per request instead of
// prerendering at build time (a stale build date would not match the client).
export const dynamic = "force-dynamic"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <DynamicBreadcrumb />
          </div>
          <div className="ml-auto flex items-center gap-2 pr-4">
            <CommandMenuButton />
            <CurrencySwitcher />
            <ThemeToggle />
          </div>
        </header>
        <CommandPalette />
        <div className="flex flex-1 flex-col">
          <PageTransition>{children}</PageTransition>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
