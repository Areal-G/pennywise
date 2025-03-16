"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  LayoutDashboardIcon,
  WalletIcon,
  ArrowLeftRightIcon,
  CreditCardIcon,
  SendIcon,
  TrendingUpIcon,
  BitcoinIcon,
  ChartAreaIcon,
  TargetIcon,
  SettingsIcon,
  BellIcon,
  LogInIcon,
  UserPlusIcon,
  LifeBuoyIcon,
  SearchIcon,
  MoonIcon,
  SunIcon,
  MonitorIcon,
  ContrastIcon,
  PlusIcon,
  RotateCcwIcon,
  CoinsIcon,
  SparklesIcon,
  RepeatIcon,
  PiggyBankIcon,
  ArrowDownUpIcon,
  ListChecksIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { contacts } from "@/data/seed"
import { demoActions, useDemoStore, useMoney } from "@/lib/demo-store"
import { CURRENCIES, type Currency } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { MerchantLogo } from "@/components/merchant-logo"
import { ResetDemoDialog } from "@/components/reset-demo-dialog"

// Open state lives at module level so the header button can open the menu
let menuOpen = false
const menuListeners = new Set<() => void>()
function setMenuOpen(next: boolean | ((prev: boolean) => boolean)) {
  menuOpen = typeof next === "function" ? next(menuOpen) : next
  menuListeners.forEach((l) => l())
}
const subscribeMenu = (l: () => void) => {
  menuListeners.add(l)
  return () => menuListeners.delete(l)
}
const useMenuOpen = () => useSyncExternalStore(subscribeMenu, () => menuOpen, () => false)

const emptySubscribe = () => () => {}
const useIsMac = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true
  )

/** Header search button that opens the command menu */
export function CommandMenuButton() {
  const isMac = useIsMac()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setMenuOpen(true)}
      aria-label="Open command menu"
      className="h-8 gap-2 text-muted-foreground sm:w-48 sm:justify-start"
    >
      <SearchIcon className="size-3.5" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
        {isMac ? <span className="text-xs">⌘</span> : "Ctrl "}K
      </kbd>
    </Button>
  )
}

const pages = [
  { label: "Dashboard", icon: LayoutDashboardIcon, href: "/dashboard" },
  { label: "Accounts", icon: WalletIcon, href: "/accounts" },
  { label: "Transactions", icon: ArrowLeftRightIcon, href: "/transactions" },
  { label: "Transfers", icon: SendIcon, href: "/transfers" },
  { label: "Cards", icon: CreditCardIcon, href: "/cards" },
  { label: "Crypto", icon: BitcoinIcon, href: "/crypto" },
  { label: "Analytics", icon: ChartAreaIcon, href: "/analytics" },
  { label: "Investments", icon: TrendingUpIcon, href: "/investments" },
  { label: "Budgets", icon: TargetIcon, href: "/budgets" },
  { label: "Ask Pennywise", icon: SparklesIcon, href: "/assistant" },
  { label: "Subscriptions", icon: RepeatIcon, href: "/subscriptions" },
  { label: "Goals", icon: PiggyBankIcon, href: "/goals" },
  { label: "Cash Flow", icon: ArrowDownUpIcon, href: "/cash-flow" },
  { label: "Reconcile", icon: ListChecksIcon, href: "/reconcile" },
  { label: "Notifications", icon: BellIcon, href: "/notifications" },
  { label: "Settings", icon: SettingsIcon, href: "/settings" },
  { label: "Help & Support", icon: LifeBuoyIcon, href: "/support" },
  { label: "Sign In", icon: LogInIcon, href: "/sign-in" },
  { label: "Sign Up", icon: UserPlusIcon, href: "/sign-up" },
]

export function CommandPalette() {
  const open = useMenuOpen()
  const [query, setQuery] = useState("")
  const [resetOpen, setResetOpen] = useState(false)
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { transactions, currency } = useDemoStore()
  const { format } = useMoney()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setMenuOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const onOpenChange = useCallback((next: boolean) => {
    setMenuOpen(next)
    if (!next) setQuery("")
  }, [])

  const run = useCallback(
    (fn: () => void) => {
      onOpenChange(false)
      fn()
    },
    [onOpenChange]
  )

  // Most recent matches across every saved transaction
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return transactions.slice(0, 5)
    return transactions
      .filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.transactionId.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [query, transactions])

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Command menu"
        description="Search transactions, jump to a page, or change the theme"
      >
        <Command>
          <CommandInput
            placeholder="Search transactions, pages, actions…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results for “{query}”.</CommandEmpty>

            <CommandGroup heading={query ? "Transactions" : "Recent transactions"}>
              {matches.map((tx) => (
                <CommandItem
                  key={tx.id}
                  value={`tx ${tx.merchant} ${tx.category} ${tx.transactionId} ${tx.id}`}
                  className="[&>svg:last-child]:hidden"
                  onSelect={() =>
                    run(() => router.push(`/transactions?q=${encodeURIComponent(tx.merchant)}`))
                  }
                >
                  <MerchantLogo src={tx.logo} name={tx.merchant} size={20} className="rounded-md text-[9px]" />
                  <span className="truncate">{tx.merchant}</span>
                  <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                    {tx.date}
                  </span>
                  <span
                    className={
                      "ml-auto text-xs tabular-nums " +
                      (tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")
                    }
                  >
                    {format(tx.amount, { sign: tx.amount > 0 })}
                  </span>
                </CommandItem>
              ))}
              {query.trim() && (
                <CommandItem
                  value="search-all-transactions"
                  forceMount
                  onSelect={() =>
                    run(() => router.push(`/transactions?q=${encodeURIComponent(query.trim())}`))
                  }
                >
                  <SearchIcon />
                  Search all transactions for “{query.trim()}”
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Actions">
              <CommandItem value="add new transaction" onSelect={() => run(() => router.push("/transactions?new=1"))}>
                <PlusIcon />
                Add transaction
              </CommandItem>
              <CommandItem
                value="toggle theme dark light mode"
                onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
              >
                <ContrastIcon />
                Toggle theme
                <CommandShortcut>{resolvedTheme === "dark" ? "Dark" : "Light"}</CommandShortcut>
              </CommandItem>
              {(Object.keys(CURRENCIES) as Currency[])
                .filter((c) => c !== currency)
                .map((c) => (
                  <CommandItem
                    key={c}
                    value={`currency show amounts in ${c} ${CURRENCIES[c].label}`}
                    onSelect={() => run(() => demoActions.setCurrency(c))}
                  >
                    <CoinsIcon />
                    Show amounts in {c}
                  </CommandItem>
                ))}
              <CommandItem value="reset demo data" onSelect={() => run(() => setResetOpen(true))}>
                <RotateCcwIcon />
                Reset demo data
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Pages">
              {pages.map((page) => (
                <CommandItem
                  key={page.href}
                  value={`go to page ${page.label}`}
                  onSelect={() => run(() => router.push(page.href))}
                >
                  <page.icon />
                  {page.label}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Quick transfer">
              {contacts.slice(0, 4).map((c) => (
                <CommandItem
                  key={c.id}
                  value={`send money to ${c.name}`}
                  onSelect={() => run(() => router.push("/transfers"))}
                >
                  <SendIcon />
                  Send to {c.name}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Theme">
              <CommandItem value="light mode theme" onSelect={() => run(() => setTheme("light"))}>
                <SunIcon />
                Light mode
              </CommandItem>
              <CommandItem value="dark mode theme" onSelect={() => run(() => setTheme("dark"))}>
                <MoonIcon />
                Dark mode
              </CommandItem>
              <CommandItem value="system theme" onSelect={() => run(() => setTheme("system"))}>
                <MonitorIcon />
                System theme
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  )
}
