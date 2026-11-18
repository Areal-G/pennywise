"use client"

import * as React from "react"
import {
  budgetCategories,
  savingsGoals,
  transactionHistory,
  type BudgetCategory,
  type FullTransaction,
  type SavingsGoal,
} from "@/data/seed"
import { currencySymbol, formatMoney, type Currency, type MoneyOptions } from "@/lib/currency"
import { parseDay } from "@/lib/mock"

// Editable demo data, kept in memory only: every visitor starts from the seed
// data and a refresh resets it. The server and the first client render share
// the same seed state, so there is never a hydration mismatch.

export type DemoData = {
  transactions: FullTransaction[]
  budgets: BudgetCategory[]
  goals: SavingsGoal[]
}

type DemoState = DemoData & { currency: Currency }

const seedData = (): DemoData => ({
  transactions: structuredClone(transactionHistory),
  budgets: structuredClone(budgetCategories),
  goals: structuredClone(savingsGoals),
})

const defaultState: DemoState = { ...seedData(), currency: "USD" }

let state: DemoState = defaultState
const listeners = new Set<() => void>()

function setState(update: (prev: DemoState) => DemoState) {
  state = update(state)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => state
const getServerSnapshot = () => defaultState

export function useDemoStore() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

const byDateDesc = (a: FullTransaction, b: FullTransaction) =>
  parseDay(b.date).getTime() - parseDay(a.date).getTime()

export const demoActions = {
  saveTransaction(tx: FullTransaction) {
    setState((s) => {
      const exists = s.transactions.some((t) => t.id === tx.id)
      const transactions = exists
        ? s.transactions.map((t) => (t.id === tx.id ? tx : t))
        : [tx, ...s.transactions]
      return { ...s, transactions: transactions.sort(byDateDesc) }
    })
  },
  deleteTransaction(id: string) {
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }))
  },
  saveBudget(budget: BudgetCategory) {
    setState((s) => {
      const exists = s.budgets.some((b) => b.id === budget.id)
      return {
        ...s,
        budgets: exists ? s.budgets.map((b) => (b.id === budget.id ? budget : b)) : [...s.budgets, budget],
      }
    })
  },
  deleteBudget(id: string) {
    setState((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) }))
  },
  saveGoal(goal: SavingsGoal) {
    setState((s) => {
      const exists = s.goals.some((g) => g.id === goal.id)
      return { ...s, goals: exists ? s.goals.map((g) => (g.id === goal.id ? goal : g)) : [...s.goals, goal] }
    })
  },
  deleteGoal(id: string) {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }))
  },
  setCurrency(currency: Currency) {
    setState((s) => ({ ...s, currency }))
  },
  /** Restore the seed transactions, budgets and goals (keeps the currency preference) */
  reset() {
    setState((s) => ({ ...seedData(), currency: s.currency }))
  },
}

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}`

/** Format USD amounts in the visitor's chosen display currency */
export function useMoney() {
  const { currency } = useDemoStore()
  return React.useMemo(
    () => ({
      currency,
      symbol: currencySymbol(currency),
      format: (usd: number, opts?: MoneyOptions) => formatMoney(usd, currency, opts),
    }),
    [currency]
  )
}
