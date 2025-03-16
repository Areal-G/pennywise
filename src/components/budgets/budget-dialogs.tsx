"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"
import { addMonths, format } from "date-fns"

import type { BudgetCategory, SavingsGoal } from "@/data/seed"
import { demoActions, newId, useMoney } from "@/lib/demo-store"
import { convertFromUsd, convertToUsd } from "@/lib/currency"
import { today } from "@/lib/mock"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BUDGET_COLORS, BUDGET_ICONS } from "@/components/budgets/budget-icons"

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Icon">
      {Object.entries(BUDGET_ICONS).map(([key, { icon: Icon, label }]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={label}
          title={label}
          onClick={() => onChange(key)}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg border transition-colors",
            value === key
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}

/** Parse a money input typed in the display currency into USD (rounded to cents) */
function useMoneyInput() {
  const { currency, symbol } = useMoney()
  return {
    symbol,
    toInput: (usd: number) => String(Math.round(convertFromUsd(usd, currency) * 100) / 100),
    toUsd: (value: string) => {
      const n = Number.parseFloat(value)
      return Number.isFinite(n) ? Math.round(convertToUsd(n, currency) * 100) / 100 : NaN
    },
  }
}

// ── Budget ───────────────────────────────────────────────────────────────────

export function BudgetDialog({
  open,
  onOpenChange,
  budget,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget: BudgetCategory | null
}) {
  const money = useMoneyInput()
  const [form, setForm] = React.useState({ category: "", iconName: "utensils", budget: "", spent: "" })
  const [error, setError] = React.useState<string | null>(null)
  const [lastOpen, setLastOpen] = React.useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setError(null)
      setForm(
        budget
          ? {
              category: budget.category,
              iconName: budget.iconName,
              budget: money.toInput(budget.budget),
              spent: money.toInput(budget.spent),
            }
          : { category: "", iconName: "utensils", budget: "", spent: "0" }
      )
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const limit = money.toUsd(form.budget)
    const spent = money.toUsd(form.spent || "0")
    if (!form.category.trim()) return setError("Name the budget category.")
    if (!(limit > 0)) return setError("Set a monthly limit greater than zero.")
    if (!(spent >= 0)) return setError("Spent so far can't be negative.")
    const saved: BudgetCategory = {
      id: budget?.id ?? newId("b"),
      color: budget?.color ?? BUDGET_COLORS[Math.floor(Math.random() * BUDGET_COLORS.length)],
      category: form.category.trim(),
      iconName: form.iconName,
      budget: limit,
      spent,
    }
    demoActions.saveBudget(saved)
    toast(budget ? "Budget updated" : "Budget created", { description: saved.category, variant: "success" })
    onOpenChange(false)
  }

  function handleDelete() {
    if (!budget) return
    demoActions.deleteBudget(budget.id)
    toast("Budget deleted", { description: budget.category })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{budget ? "Edit budget" : "New budget"}</DialogTitle>
            <DialogDescription>Set a monthly spending limit for a category.</DialogDescription>
          </DialogHeader>
          <Field label="Category" htmlFor="budget-name">
            <Input
              id="budget-name"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Coffee"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Monthly limit (${money.symbol})`} htmlFor="budget-limit">
              <Input
                id="budget-limit"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </Field>
            <Field label={`Spent so far (${money.symbol})`} htmlFor="budget-spent">
              <Input
                id="budget-spent"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.spent}
                onChange={(e) => setForm({ ...form, spent: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Icon">
            <IconPicker value={form.iconName} onChange={(iconName) => setForm({ ...form, iconName })} />
          </Field>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter className="sm:justify-between">
            {budget ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2Icon className="size-3.5" />
                Delete
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{budget ? "Save changes" : "Create budget"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Savings goal ─────────────────────────────────────────────────────────────

export function GoalDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: SavingsGoal | null
}) {
  const money = useMoneyInput()
  const empty = {
    name: "",
    iconName: "piggy-bank",
    target: "",
    current: "0",
    monthly: "",
    deadline: format(addMonths(today, 12), "yyyy-MM"),
  }
  const [form, setForm] = React.useState(empty)
  const [error, setError] = React.useState<string | null>(null)
  const [lastOpen, setLastOpen] = React.useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setError(null)
      setForm(
        goal
          ? {
              name: goal.name,
              iconName: goal.iconName,
              target: money.toInput(goal.targetAmount),
              current: money.toInput(goal.currentAmount),
              monthly: money.toInput(goal.monthlyContribution),
              deadline: format(new Date(`${goal.deadline} 1`), "yyyy-MM"),
            }
          : empty
      )
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const target = money.toUsd(form.target)
    const current = money.toUsd(form.current || "0")
    const monthly = money.toUsd(form.monthly || "0")
    if (!form.name.trim()) return setError("Name your goal.")
    if (!(target > 0)) return setError("Set a target greater than zero.")
    if (!(current >= 0) || !(monthly >= 0)) return setError("Amounts can't be negative.")
    if (!/^\d{4}-\d{2}$/.test(form.deadline)) return setError("Pick a target month.")
    const [y, m] = form.deadline.split("-").map(Number)
    const saved: SavingsGoal = {
      id: goal?.id ?? newId("g"),
      name: form.name.trim(),
      iconName: form.iconName,
      targetAmount: target,
      currentAmount: current,
      monthlyContribution: monthly,
      deadline: format(new Date(y, m - 1, 1), "MMM yyyy"),
    }
    demoActions.saveGoal(saved)
    toast(goal ? "Goal updated" : "Goal created", { description: saved.name, variant: "success" })
    onOpenChange(false)
  }

  function handleDelete() {
    if (!goal) return
    demoActions.deleteGoal(goal.id)
    toast("Goal deleted", { description: goal.name })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{goal ? "Edit savings goal" : "New savings goal"}</DialogTitle>
            <DialogDescription>Track progress toward something you&apos;re saving for.</DialogDescription>
          </DialogHeader>
          <Field label="Goal name" htmlFor="goal-name">
            <Input
              id="goal-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. New laptop"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Target (${money.symbol})`} htmlFor="goal-target">
              <Input
                id="goal-target"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />
            </Field>
            <Field label={`Saved so far (${money.symbol})`} htmlFor="goal-current">
              <Input
                id="goal-current"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
              />
            </Field>
            <Field label={`Monthly (${money.symbol})`} htmlFor="goal-monthly">
              <Input
                id="goal-monthly"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.monthly}
                onChange={(e) => setForm({ ...form, monthly: e.target.value })}
              />
            </Field>
            <Field label="Target month" htmlFor="goal-deadline">
              <Input
                id="goal-deadline"
                type="month"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Icon">
            <IconPicker value={form.iconName} onChange={(iconName) => setForm({ ...form, iconName })} />
          </Field>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter className="sm:justify-between">
            {goal ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2Icon className="size-3.5" />
                Delete
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{goal ? "Save changes" : "Create goal"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Quick "add funds" to a goal */
export function AddFundsDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: SavingsGoal | null
}) {
  const money = useMoneyInput()
  const { format: fmt } = useMoney()
  const [amount, setAmount] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [lastOpen, setLastOpen] = React.useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setAmount("")
      setError(null)
    }
  }
  if (!goal) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal) return
    const usd = money.toUsd(amount)
    if (!(usd > 0)) return setError("Enter an amount greater than zero.")
    const currentAmount = Math.round((goal.currentAmount + usd) * 100) / 100
    demoActions.saveGoal({ ...goal, currentAmount })
    toast(currentAmount >= goal.targetAmount ? "Goal reached! 🎉" : "Funds added", {
      description: `${fmt(usd)} added to ${goal.name}`,
      variant: "success",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add funds</DialogTitle>
            <DialogDescription>
              {goal.name}: {fmt(goal.currentAmount)} of {fmt(goal.targetAmount)} saved.
            </DialogDescription>
          </DialogHeader>
          <Field label={`Amount (${money.symbol})`} htmlFor="funds-amount">
            <Input
              id="funds-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </Field>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add funds</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
