"use client"

import * as React from "react"
import { differenceInCalendarMonths, format } from "date-fns"
import { motion, useReducedMotion } from "motion/react"
import { CalendarIcon, FlagIcon, PencilIcon, PiggyBankIcon, PlusIcon, TargetIcon, WalletIcon } from "lucide-react"

import type { SavingsGoal } from "@/data/seed"
import { useFinanceStore, useMoney } from "@/lib/finance-store"
import { goalPlan } from "@/lib/planning"
import { today } from "@/lib/mock"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { BudgetIcon } from "@/components/budgets/budget-icons"
import { AddFundsDialog, GoalDialog } from "@/components/budgets/budget-dialogs"
import { StatTiles } from "@/components/planning/stat-tiles"

const STATUS = {
  reached: { label: "Reached", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", ring: "stroke-emerald-500" },
  "on-track": { label: "On track", className: "bg-primary/10 text-primary", ring: "stroke-primary" },
  behind: { label: "Behind", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400", ring: "stroke-amber-500" },
  "no-plan": { label: "No plan", className: "bg-muted text-muted-foreground", ring: "stroke-muted-foreground" },
} as const

function ProgressRing({ percent, className }: { percent: number; className: string }) {
  const reduceMotion = useReducedMotion()
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 100 100" className="size-24 shrink-0 -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-muted" />
      <motion.circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        className={className}
        strokeDasharray={c}
        initial={reduceMotion ? false : { strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - percent / 100) }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

export function GoalsPage() {
  const { goals } = useFinanceStore()
  const { format: money } = useMoney()
  const [dialog, setDialog] = React.useState<"edit" | "funds" | null>(null)
  const [selected, setSelected] = React.useState<SavingsGoal | null>(null)
  const open = (kind: "edit" | "funds", g: SavingsGoal | null) => {
    setSelected(g)
    setDialog(kind)
  }

  const plans = goals.map((g) => ({ goal: g, plan: goalPlan(g) }))
  const saved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const target = goals.reduce((s, g) => s + g.targetAmount, 0)
  const planned = goals.reduce((s, g) => s + g.monthlyContribution, 0)
  const needed = plans.reduce((s, p) => s + (p.plan.status === "reached" ? 0 : p.plan.neededPerMonth), 0)
  const onTrack = plans.filter((p) => p.plan.status === "on-track" || p.plan.status === "reached").length

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <StatTiles
        tiles={[
          { label: "Saved so far", value: money(saved, { decimals: 0 }), hint: `of ${money(target, { decimals: 0 })} across ${goals.length} goals`, icon: PiggyBankIcon },
          { label: "Overall progress", value: `${target ? Math.round((saved / target) * 100) : 0}%`, hint: `${money(Math.max(0, target - saved), { decimals: 0 })} to go`, icon: TargetIcon, tone: "muted" },
          { label: "Planned each month", value: money(planned, { decimals: 0 }), hint: `${money(needed, { decimals: 0 })} needed to hit every date`, icon: WalletIcon, tone: planned >= needed ? "positive" : "warning" },
          { label: "On track", value: `${onTrack} of ${goals.length}`, hint: onTrack === goals.length ? "Every goal on schedule" : "Some goals need more", icon: FlagIcon, tone: onTrack === goals.length ? "positive" : "warning" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Savings goals</h2>
          <p className="text-xs text-muted-foreground">Each ring shows how much of the target you&apos;ve saved</p>
        </div>
        <Button size="sm" onClick={() => open("edit", null)}>
          <PlusIcon className="size-3.5" />
          New goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              variant="generic"
              title="No savings goals"
              description="Set a goal for a trip, a safety net or a big purchase and track your progress."
              actionLabel="Create a goal"
              onAction={() => open("edit", null)}
              className="py-10"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map(({ goal: g, plan: p }) => {
            const status = STATUS[p.status]
            const gap = p.neededPerMonth - g.monthlyContribution
            return (
              <Card key={g.id} className="gap-4">
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative mx-auto sm:mx-0">
                    <ProgressRing percent={p.percent} className={status.ring} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <BudgetIcon name={g.iconName} className="size-4 text-muted-foreground" />
                      <span className="text-sm font-bold tabular-nums">{Math.round(p.percent)}%</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{g.name}</p>
                      <Badge className={cn("border-0 text-[10px]", status.className)}>{status.label}</Badge>
                    </div>
                    <p className="text-sm">
                      <span className="text-lg font-bold tabular-nums">{money(g.currentAmount, { decimals: 0 })}</span>
                      <span className="text-muted-foreground tabular-nums"> of {money(g.targetAmount, { decimals: 0 })}</span>
                    </p>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <dt className="text-muted-foreground">Target date</dt>
                      <dd className="text-right font-medium">
                        {g.deadline} · {p.monthsLeft} mo
                      </dd>
                      <dt className="text-muted-foreground">Needed / month</dt>
                      <dd className="text-right font-medium tabular-nums">{money(p.neededPerMonth, { decimals: 0 })}</dd>
                      <dt className="text-muted-foreground">You put in</dt>
                      <dd className={cn("text-right font-medium tabular-nums", gap > 0.5 && p.status !== "reached" && "text-amber-600 dark:text-amber-400")}>
                        {money(g.monthlyContribution, { decimals: 0 })}
                      </dd>
                      <dt className="text-muted-foreground">Finish</dt>
                      <dd className="text-right font-medium">{p.projected ? format(p.projected, "MMM yyyy") : "Set a monthly amount"}</dd>
                    </dl>
                    {p.status === "behind" && (
                      <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-300">
                        Add {money(gap, { decimals: 0 })} more a month to reach it by {g.deadline}.
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button size="xs" variant="secondary" onClick={() => open("funds", g)} disabled={p.status === "reached"}>
                        <PlusIcon className="size-3" />
                        Add funds
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => open("edit", g)} aria-label={`Edit ${g.name}`}>
                        <PencilIcon className="size-3" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription>When each goal finishes at your current monthly amount, against its target date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plans.map(({ goal: g, plan: p }) => {
              const horizon = Math.max(...plans.map((x) => x.plan.monthsLeft), 12)
              const targetPct = (p.monthsLeft / horizon) * 100
              const finishMonths = p.projected
                ? Math.max(1, differenceInCalendarMonths(p.projected, today) + 1)
                : horizon
              const finishPct = Math.min(100, (finishMonths / horizon) * 100)
              return (
                <div key={g.id} className="grid gap-1.5 sm:grid-cols-[160px_1fr] sm:items-center">
                  <div className="flex items-center gap-2 text-sm">
                    <BudgetIcon name={g.iconName} className="size-4 text-muted-foreground" />
                    <span className="truncate">{g.name}</span>
                  </div>
                  <div className="relative h-6 rounded-md bg-muted/60">
                    <div
                      className={cn("absolute inset-y-1 left-1 rounded", p.status === "behind" ? "bg-amber-500/70" : "bg-primary/70")}
                      style={{ width: `calc(${finishPct}% - 0.5rem)` }}
                    />
                    <div className="absolute inset-y-0 w-0.5 bg-foreground/60" style={{ left: `${targetPct}%` }} title={`Target: ${g.deadline}`}>
                      <CalendarIcon className="absolute -top-1 left-1/2 size-3 -translate-x-1/2 -translate-y-full text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-primary/70" />Projected finish</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-foreground/60" />Target date</span>
            </div>
          </CardContent>
        </Card>
      )}

      <GoalDialog open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} goal={selected} />
      <AddFundsDialog open={dialog === "funds"} onOpenChange={(o) => !o && setDialog(null)} goal={selected} />
    </div>
  )
}
