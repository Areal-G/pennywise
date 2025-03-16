"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckIcon,
  MoonIcon,
  RepeatIcon,
  ScissorsIcon,
  TrendingUpIcon,
  Undo2Icon,
} from "lucide-react"

import {
  daysUntil,
  isUnused,
  monthlyCost,
  nextCharge,
  priceIncrease,
  subscriptions,
  subscriptionSummary,
  upcomingRenewals,
  yearlyCost,
  type Subscription,
} from "@/lib/planning"
import { useMoney } from "@/lib/demo-store"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MerchantLogo } from "@/components/merchant-logo"
import { StatTiles } from "@/components/planning/stat-tiles"

type Filter = "all" | "flagged" | "monthly" | "yearly"

const when = (days: number) => (days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`)

export function SubscriptionsPage() {
  const { format: money } = useMoney()
  const [filter, setFilter] = React.useState<Filter>("all")
  const [cancelling, setCancelling] = React.useState<Set<string>>(new Set())

  const summary = subscriptionSummary()
  const savings = subscriptions.filter((s) => cancelling.has(s.id)).reduce((a, s) => a + yearlyCost(s), 0)
  const renewals = upcomingRenewals(30)

  const rows = subscriptions
    .filter((s) =>
      filter === "flagged" ? isUnused(s) || priceIncrease(s) > 0 : filter === "all" ? true : s.cycle === filter
    )
    .sort((a, b) => nextCharge(a).getTime() - nextCharge(b).getTime())

  const byCategory = Object.entries(
    subscriptions.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + monthlyCost(s)
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  const toggle = (id: string) =>
    setCancelling((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <StatTiles
        tiles={[
          { label: "Monthly cost", value: money(summary.monthly), hint: `${summary.count} active subscriptions`, icon: RepeatIcon },
          { label: "Per year", value: money(summary.yearly, { decimals: 0 }), hint: "Yearly plans included", icon: CalendarClockIcon, tone: "muted" },
          {
            label: "Unused",
            value: `${summary.unused.length} plans`,
            hint: `${money(summary.unusedYearly, { decimals: 0 })}/yr you could save`,
            icon: MoonIcon,
            tone: "warning",
          },
          {
            label: "Price increases",
            value: `+${money(summary.increaseYearly, { decimals: 0 })}/yr`,
            hint: `${summary.increased.length} plans went up`,
            icon: TrendingUpIcon,
            tone: "negative",
          },
        ]}
      />

      {cancelling.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          <p>
            Cancelling {cancelling.size} {cancelling.size === 1 ? "plan" : "plans"} saves{" "}
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {money(savings, { decimals: 0 })} a year
            </span>
            . Remember to cancel with each provider.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setCancelling(new Set())}>
            <Undo2Icon className="size-3.5" />
            Clear
          </Button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Your subscriptions</CardTitle>
              <CardDescription>Recurring charges found in your transactions</CardDescription>
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="flagged">Flagged</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            <ul className="divide-y">
              {rows.map((s) => (
                <SubscriptionRow
                  key={s.id}
                  sub={s}
                  money={money}
                  cancelling={cancelling.has(s.id)}
                  onToggle={() => toggle(s.id)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming renewals</CardTitle>
              <CardDescription>
                Next 30 days ·{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {money(renewals.reduce((a, r) => a + r.sub.amount, 0))}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-5">
                {renewals.map(({ sub, date }) => {
                  const days = daysUntil(date)
                  return (
                    <li key={sub.id} className="relative">
                      <span
                        className={cn(
                          "absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-card",
                          days <= 3 ? "bg-amber-500" : "bg-primary"
                        )}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(date, "EEE, MMM d")} · {when(days)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{money(sub.amount)}</span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">By category</CardTitle>
              <CardDescription>Monthly equivalent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {byCategory.map(([cat, amount]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{cat}</span>
                    <span className="tabular-nums text-muted-foreground">{money(amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(amount / byCategory[0][1]) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SubscriptionRow({
  sub,
  money,
  cancelling,
  onToggle,
}: {
  sub: Subscription
  money: (usd: number, opts?: { decimals?: number }) => string
  cancelling: boolean
  onToggle: () => void
}) {
  const date = nextCharge(sub)
  const days = daysUntil(date)
  const increase = priceIncrease(sub)
  const unused = isUnused(sub)

  return (
    <li className={cn("flex flex-wrap items-center gap-3 px-2 py-3 sm:flex-nowrap", cancelling && "opacity-60")}>
      <MerchantLogo src={sub.logo} name={sub.name} size={36} />
      <div className="min-w-0 flex-1 basis-40">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={cn("truncate text-sm font-medium", cancelling && "line-through")}>{sub.name}</p>
          {unused && (
            <Badge variant="outline" className="gap-1 border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-400">
              <MoonIcon className="size-2.5" />
              Unused {sub.lastUsedDaysAgo}d
            </Badge>
          )}
          {increase > 0 && (
            <Badge variant="outline" className="gap-1 border-rose-500/40 text-[10px] text-rose-700 dark:text-rose-400">
              <AlertTriangleIcon className="size-2.5" />+{money(increase)}
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {sub.category} · •••• {sub.cardLast4} · {sub.cycle === "monthly" ? "Monthly" : "Yearly"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">
          {money(sub.amount)}
          <span className="text-xs font-normal text-muted-foreground">/{sub.cycle === "monthly" ? "mo" : "yr"}</span>
        </p>
        <p className={cn("text-xs tabular-nums", days <= 3 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
          {format(date, "MMM d")} · {when(days).toLowerCase()}
        </p>
      </div>
      <Button
        size="xs"
        variant={cancelling ? "secondary" : "ghost"}
        className="ml-auto sm:ml-0"
        aria-pressed={cancelling}
        aria-label={cancelling ? `Keep ${sub.name}` : `Plan to cancel ${sub.name}`}
        onClick={onToggle}
      >
        {cancelling ? <CheckIcon className="size-3" /> : <ScissorsIcon className="size-3" />}
        {cancelling ? "To cancel" : "Cancel"}
      </Button>
    </li>
  )
}
