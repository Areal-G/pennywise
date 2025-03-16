"use client"

import { useState } from "react"
import { addMonths } from "date-fns"
import { PencilIcon, PlusIcon } from "lucide-react"

import type { SavingsGoal } from "@/data/seed"
import { useDemoStore, useMoney } from "@/lib/demo-store"
import { today } from "@/lib/mock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/empty-state"
import { BudgetIcon } from "@/components/budgets/budget-icons"
import { AddFundsDialog, GoalDialog } from "@/components/budgets/budget-dialogs"

function goalStatus(g: SavingsGoal) {
  if (g.currentAmount >= g.targetAmount) return { label: "Reached", variant: "default" as const }
  const deadline = new Date(`${g.deadline} 1`)
  if (g.monthlyContribution <= 0) {
    return { label: "No plan", variant: "outline" as const }
  }
  const monthsLeft = Math.ceil((g.targetAmount - g.currentAmount) / g.monthlyContribution)
  const onTrack = addMonths(today, monthsLeft) <= addMonths(deadline, 1)
  return onTrack
    ? { label: "On track", variant: "secondary" as const }
    : { label: "Behind", variant: "destructive" as const }
}

export function SavingsGoals() {
  const { goals } = useDemoStore()
  const { format } = useMoney()
  const [dialog, setDialog] = useState<"edit" | "funds" | null>(null)
  const [selected, setSelected] = useState<SavingsGoal | null>(null)
  const open = (kind: "edit" | "funds", g: SavingsGoal | null) => {
    setSelected(g)
    setDialog(kind)
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Savings Goals</CardTitle>
        <Button variant="outline" size="sm" onClick={() => open("edit", null)}>
          <PlusIcon className="size-3.5" />
          New goal
        </Button>
      </CardHeader>
      <CardContent>
        {goals.length === 0 && (
          <EmptyState
            variant="generic"
            title="No savings goals"
            description="Set a goal for a trip, a safety net or a big purchase and track your progress."
            actionLabel="Create a goal"
            onAction={() => open("edit", null)}
            className="py-8"
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
            const status = goalStatus(g)

            return (
              <div key={g.id} className="flex gap-4 rounded-xl border p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <BudgetIcon name={g.iconName} />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{g.name}</p>
                    <Badge variant={status.variant} className="text-[10px]">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span className="text-lg font-bold tabular-nums">
                      {format(g.currentAmount, { decimals: 0 })}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      / {format(g.targetAmount, { decimals: 0 })} · {percent}%
                    </span>
                  </div>
                  <Progress value={percent} className="h-2" aria-label={`${g.name} progress`} />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="tabular-nums">{format(g.monthlyContribution, { decimals: 0 })}/mo</span>
                    <span>Target: {g.deadline}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="xs" variant="secondary" onClick={() => open("funds", g)}>
                      <PlusIcon className="size-3" />
                      Add funds
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => open("edit", g)}
                      aria-label={`Edit ${g.name}`}
                    >
                      <PencilIcon className="size-3" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
      <GoalDialog open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} goal={selected} />
      <AddFundsDialog open={dialog === "funds"} onOpenChange={(o) => !o && setDialog(null)} goal={selected} />
    </Card>
  )
}
