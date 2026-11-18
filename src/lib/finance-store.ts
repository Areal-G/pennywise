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
import { currencySymbol, formatMoney, isCurrency, type Currency, type MoneyOptions } from "@/lib/currency"
import { parseDay } from "@/lib/mock"

// Editable finance data, persisted in localStorage. The server (and the first
// client render) always use the seed data; the saved copy is swapped in after
// hydration via useSyncExternalStore, so there is never a hydration mismatch.

export type FinanceData = {
  transactions: FullTransaction[]
  budgets: BudgetCategory[]
  goals: SavingsGoal[]
}

type FinanceState = FinanceData & { currency: Currency }

const STORAGE_KEY = "pennywise-data-v1"

const seedData = (): FinanceData => ({
  transactions: structuredClone(transactionHistory),
  budgets: structuredClone(budgetCategories),
  goals: structuredClone(savingsGoals),
})

const defaultState: FinanceState = { ...seedData(), currency: "USD" }

let state: FinanceState = defaultState
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as Partial<FinanceState>
    state = {
      transactions: Array.isArray(saved.transactions) ? saved.transactions : defaultState.transactions,
      budgets: Array.isArray(saved.budgets) ? saved.budgets : defaultState.budgets,
      goals: Array.isArray(saved.goals) ? saved.goals : defaultState.goals,
      currency: isCurrency(saved.currency) ? saved.currency : "USD",
    }
  } catch {
    // Corrupt or blocked storage: fall back to the seed data
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable (private mode): keep working in memory
  }
}

function setState(update: (prev: FinanceState) => FinanceState) {
  state = update(state)
  persist()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  load()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => {
  load()
  return state
}
const getServerSnapshot = () => defaultState

export function useFinanceStore() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

const byDateDesc = (a: FullTransaction, b: FullTransaction) =>
  parseDay(b.date).getTime() - parseDay(a.date).getTime()

export const financeActions = {
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
}

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}`

/** Format USD amounts in the chosen display currency */
export function useMoney() {
  const { currency } = useFinanceStore()
  return React.useMemo(
    () => ({
      currency,
      symbol: currencySymbol(currency),
      format: (usd: number, opts?: MoneyOptions) => formatMoney(usd, currency, opts),
    }),
    [currency]
  )
}
