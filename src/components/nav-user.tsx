"use client"

import Link from "next/link"
import { UserAvatar } from "@/components/user-avatar"
import { useProfile } from "@/lib/profile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, SparklesIcon, BadgeCheckIcon, CreditCardIcon, LogOutIcon, UserRoundIcon } from "lucide-react"

export function NavUser() {
  const { isMobile } = useSidebar()
  const user = useProfile()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <UserAvatar />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <UserAvatar className="size-9" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="flex items-center gap-1 truncate font-medium">
                      {user.name}
                      <BadgeCheckIcon className="size-3.5 shrink-0 text-primary" aria-label="Verified" />
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.occupation} · {user.location}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/settings?tab=billing" />}>
                <SparklesIcon
                />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/settings?tab=profile" />}>
                <UserRoundIcon />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings?tab=billing" />}>
                <CreditCardIcon
                />
                Billing
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/sign-in" />}>
              <LogOutIcon
              />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
