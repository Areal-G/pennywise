"use client"

import { LogoMark } from "@/components/brand/logo"
import * as React from "react"
import Link from "next/link"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  WalletIcon,
  ArrowLeftRightIcon,
  CreditCardIcon,
  ChartAreaIcon,
  TargetIcon,
  SettingsIcon,
  LifeBuoyIcon,
  SendIcon,
  TrendingUpIcon,
  BitcoinIcon,
  BellIcon,
  LogInIcon,
  UserPlusIcon,
  SparklesIcon,
  RepeatIcon,
  PiggyBankIcon,
  ArrowDownUpIcon,
  ListChecksIcon,
} from "lucide-react"

const data = {
  navDaily: [
    { title: "Overview", url: "/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Accounts", url: "/accounts", icon: <WalletIcon /> },
    { title: "Transactions", url: "/transactions", icon: <ArrowLeftRightIcon /> },
    { title: "Cards", url: "/cards", icon: <CreditCardIcon /> },
  ],
  navMoney: [
    { title: "Transfers", url: "/transfers", icon: <SendIcon /> },
    { title: "Investments", url: "/investments", icon: <TrendingUpIcon /> },
    { title: "Crypto", url: "/crypto", icon: <BitcoinIcon /> },
  ],
  navInsights: [
    { title: "Analytics", url: "/analytics", icon: <ChartAreaIcon /> },
    { title: "Budgets", url: "/budgets", icon: <TargetIcon /> },
  ],
  navPlanning: [
    { title: "Ask Pennywise", url: "/assistant", icon: <SparklesIcon /> },
    { title: "Subscriptions", url: "/subscriptions", icon: <RepeatIcon /> },
    { title: "Goals", url: "/goals", icon: <PiggyBankIcon /> },
    { title: "Cash Flow", url: "/cash-flow", icon: <ArrowDownUpIcon /> },
    { title: "Reconcile", url: "/reconcile", icon: <ListChecksIcon /> },
  ],
  navAuth: [
    { title: "Sign In", url: "/sign-in", icon: <LogInIcon /> },
    { title: "Sign Up", url: "/sign-up", icon: <UserPlusIcon /> },
  ],
  navSecondary: [
    { title: "Notifications", url: "/notifications", icon: <BellIcon /> },
    { title: "Settings", url: "/settings", icon: <SettingsIcon /> },
    { title: "Help & Support", url: "/support", icon: <LifeBuoyIcon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <LogoMark className="size-8! rounded-lg shadow-sm shadow-primary/30" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Pennywise</span>
                <span className="truncate text-xs text-muted-foreground">
                  Finance Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navDaily} label="Daily" />
        <NavMain items={data.navMoney} label="Money" />
        <NavMain items={data.navInsights} label="Insights" />
        <NavMain items={data.navPlanning} label="Planning" />
        <NavMain items={data.navAuth} label="Auth" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
