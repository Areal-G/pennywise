"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowRightIcon, ArrowUpIcon, MoonIcon, SparklesIcon } from "lucide-react"

import { daysUntil, isUnused, subscriptionSummary, upcomingRenewals } from "@/lib/planning"
import { useMoney } from "@/lib/finance-store"
import { SUGGESTED_PROMPTS } from "@/lib/assistant"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogoMark } from "@/components/brand/logo"
import { MerchantLogo } from "@/components/merchant-logo"

/** Dashboard entry point to the assistant: type or pick a question */
export function AskPennywiseWidget() {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const ask = (question: string) => {
    if (question.trim()) router.push(`/assistant?q=${encodeURIComponent(question.trim())}`)
  }
  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/15 blur-3xl" />
      <CardHeader className="relative flex flex-row items-center gap-3">
        <LogoMark className="size-10 shrink-0 rounded-xl shadow-sm shadow-primary/30" />
        <div>
          <CardTitle className="flex items-center gap-1.5">
            Ask Pennywise <SparklesIcon className="size-4 text-primary" />
          </CardTitle>
          <CardDescription>Your money assistant knows your spending, budgets and goals</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(q)
          }}
          className="flex gap-2"
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Where did my money go this month?"
            aria-label="Ask Pennywise a question"
            className="h-10"
          />
          <Button type="submit" size="icon" className="size-10 shrink-0" aria-label="Ask" disabled={!q.trim()}>
            <ArrowUpIcon className="size-4" />
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => ask(p)}
              className="rounded-full border bg-background/60 px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {p}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** Next renewals plus the subscription total */
export function UpcomingRenewalsWidget() {
  const { format: money } = useMoney()
  const renewals = upcomingRenewals(30).slice(0, 4)
  const summary = subscriptionSummary()
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Upcoming bills</CardTitle>
          <CardDescription>
            Subscriptions: <span className="font-medium tabular-nums text-foreground">{money(summary.monthly)}</span>/mo
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" nativeButton={false} render={<Link href="/subscriptions" />}>
          All
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {renewals.map(({ sub, date }) => {
          const days = daysUntil(date)
          return (
            <div key={sub.id} className="flex items-center gap-3">
              <MerchantLogo src={sub.logo} name={sub.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {sub.name}
                  {isUnused(sub) && <MoonIcon className="size-3 text-amber-500" aria-label="Unused" />}
                </p>
                <p className={cn("text-xs", days <= 3 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                  {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${format(date, "MMM d")} · in ${days} days`}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{money(sub.amount)}</span>
            </div>
          )
        })}
        {summary.unused.length > 0 && (
          <Link
            href="/subscriptions"
            className="block rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 transition-colors hover:bg-amber-500/15 dark:text-amber-300"
          >
            {summary.unused.length} unused plans cost {money(summary.unusedYearly, { decimals: 0 })} a year. Review them →
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
