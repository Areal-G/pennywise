"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, useReducedMotion } from "motion/react"
import { PencilIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { BudgetCategory } from "@/data/seed"
import { useFinanceStore, useMoney } from "@/lib/finance-store"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { BudgetIcon } from "@/components/budgets/budget-icons"
import { BudgetDialog } from "@/components/budgets/budget-dialogs"

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function BudgetRings() {
  const { budgets } = useFinanceStore()
  const { format } = useMoney()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetCategory | null>(null)
  const edit = (b: BudgetCategory | null) => {
    setEditing(b)
    setOpen(true)
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          Monthly Budgets
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => edit(null)}>
          <PlusIcon className="size-3.5" />
          New budget
        </Button>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 && (
          <EmptyState variant="budgets" className="py-8" actionLabel="Create a budget" onAction={() => edit(null)} />
        )}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {budgets.map((b, i) => {
            const percent = Math.min((b.spent / b.budget) * 100, 100)
            const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE
            const isOver = b.spent > b.budget

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => edit(b)}
                aria-label={`Edit ${b.category} budget`}
                className="group/budget relative flex flex-col items-center gap-2 rounded-xl p-2 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PencilIcon className="absolute top-2 right-2 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/budget:opacity-100 group-focus-visible/budget:opacity-100 pointer-coarse:hidden" />
                <div className="relative size-24">
                  <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                    {/* Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={RADIUS}
                      fill="none"
                      stroke="currentColor"
                      className="text-muted"
                      strokeWidth="8"
                    />
                    {/* Progress */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r={RADIUS}
                      fill="none"
                      stroke="currentColor"
                      className={isOver ? "text-destructive" : b.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      initial={{ strokeDashoffset: reduceMotion ? offset : CIRCUMFERENCE }}
                      animate={{
                        strokeDashoffset: offset,
                        ...(isOver && !reduceMotion
                          ? { scale: [1, 1.03, 1], opacity: [1, 0.8, 1] }
                          : {}),
                      }}
                      transition={{
                        strokeDashoffset: {
                          duration: 1,
                          delay: i * 0.1,
                          ease: "easeOut",
                        },
                        scale: isOver
                          ? { duration: 1.5, repeat: Infinity }
                          : undefined,
                        opacity: isOver
                          ? { duration: 1.5, repeat: Infinity }
                          : undefined,
                      }}
                    />
                  </svg>
                  {/* Center icon */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center",
                      isOver ? "text-destructive" : b.color
                    )}
                  >
                    <BudgetIcon name={b.iconName} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{b.category}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {format(b.spent, { decimals: 0 })}{" "}
                    <span className="text-muted-foreground/60">
                      / {format(b.budget, { decimals: 0 })}
                    </span>
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
      <BudgetDialog open={open} onOpenChange={setOpen} budget={editing} />
    </Card>
  )
}
