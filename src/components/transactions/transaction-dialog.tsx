"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"

import type { FullTransaction } from "@/data/seed"
import { demoActions, newId, useMoney } from "@/lib/demo-store"
import { convertFromUsd, convertToUsd } from "@/lib/currency"
import { formatDay, isoDay, parseDay, today } from "@/lib/mock"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const TRANSACTION_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Shopping",
  "Transport",
  "Entertainment",
  "Bills & Utilities",
  "Health",
  "Travel",
  "Income",
  "Transfer",
  "Other",
]

type FormState = {
  merchant: string
  amount: string
  type: FullTransaction["type"]
  category: string
  status: FullTransaction["status"]
  date: string
  notes: string
}

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

/** Add a new transaction (transaction = null) or edit / delete an existing one */
export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  categories = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: FullTransaction | null
  categories?: string[]
}) {
  const { currency, symbol } = useMoney()
  const [form, setForm] = React.useState<FormState | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Reset the form each time the dialog opens
  const [lastOpen, setLastOpen] = React.useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setError(null)
      setForm(
        transaction
          ? {
              merchant: transaction.merchant,
              amount: Math.abs(convertFromUsd(transaction.amount, currency)).toFixed(2),
              type: transaction.type,
              category: transaction.category,
              status: transaction.status,
              date: isoDay(parseDay(transaction.date)),
              notes: transaction.notes ?? "",
            }
          : {
              merchant: "",
              amount: "",
              type: "expense",
              category: "Food & Dining",
              status: "completed",
              date: isoDay(today),
              notes: "",
            }
      )
    }
  }

  const allCategories = React.useMemo(
    () => Array.from(new Set([...TRANSACTION_CATEGORIES, ...categories])).sort(),
    [categories]
  )

  if (!form) return null
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    const amount = Number.parseFloat(form.amount)
    if (!form.merchant.trim()) return setError("Enter a merchant or payee.")
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than zero.")
    if (!form.date) return setError("Pick a date.")

    const usd = Math.round(convertToUsd(amount, currency) * 100) / 100
    const [y, m, d] = form.date.split("-").map(Number)
    const saved: FullTransaction = {
      ...(transaction ?? {
        id: newId("tx"),
        transactionId: `TXN-${Date.now().toString().slice(-8)}`,
        logo: "",
      }),
      merchant: form.merchant.trim(),
      amount: form.type === "income" ? usd : -usd,
      type: form.type,
      category: form.category,
      status: form.status,
      date: formatDay(new Date(y, m - 1, d)),
      notes: form.notes.trim() || undefined,
    }
    demoActions.saveTransaction(saved)
    toast(transaction ? "Transaction updated" : "Transaction added", {
      description: saved.merchant,
      variant: "success",
    })
    onOpenChange(false)
  }

  function handleDelete() {
    if (!transaction) return
    demoActions.deleteTransaction(transaction.id)
    toast("Transaction deleted", { description: transaction.merchant })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{transaction ? "Edit transaction" : "Add transaction"}</DialogTitle>
            <DialogDescription>
              Demo data is saved in this browser only. Amounts are in {currency}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center rounded-lg border border-border p-0.5" role="radiogroup" aria-label="Type">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={form.type === t}
                onClick={() => {
                  set("type", t)
                  if (t === "income" && form.category === "Food & Dining") set("category", "Income")
                }}
                className={
                  "flex-1 rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors " +
                  (form.type === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Merchant or payee" htmlFor="tx-merchant">
              <Input
                id="tx-merchant"
                value={form.merchant}
                onChange={(e) => set("merchant", e.target.value)}
                placeholder="e.g. Blue Bottle Coffee"
                autoFocus
              />
            </Field>
            <Field label={`Amount (${symbol})`} htmlFor="tx-amount">
              <Input
                id="tx-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => v && set("category", v)}>
                <SelectTrigger className="w-full" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                items={{ completed: "Completed", pending: "Pending", failed: "Failed" }}
                onValueChange={(v) => v && set("status", v as FullTransaction["status"])}
              >
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date" htmlFor="tx-date">
              <Input
                id="tx-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notes (optional)" htmlFor="tx-notes">
            <Textarea
              id="tx-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>

          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="sm:justify-between">
            {transaction ? (
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
              <Button type="submit">{transaction ? "Save changes" : "Add transaction"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
