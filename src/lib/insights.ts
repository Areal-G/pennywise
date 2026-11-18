import { subDays } from "date-fns"

import type { BudgetCategory, FullTransaction, SavingsGoal } from "@/data/seed"
import { parseDay, today } from "@/lib/mock"

export type InsightTone = "positive" | "negative" | "neutral"
export type Insight = {
  id: string
  tone: InsightTone
  title: string
  /** Sentence with {money:<usd>} placeholders, filled in by the UI in the display currency */
  parts: (string | { usd: number })[]
  href: string
}

const pct = (a: number, b: number) => Math.round(((a - b) / b) * 100)

/** Readable insights computed from the user's (editable) data */
export function computeInsights(
  transactions: FullTransaction[],
  budgets: BudgetCategory[],
  goals: SavingsGoal[]
): Insight[] {
  const end = today.getTime() + 86_400_000 // include today
  const start30 = subDays(today, 29).getTime()
  const start60 = subDays(today, 59).getTime()

  const current: FullTransaction[] = []
  const previous: FullTransaction[] = []
  for (const t of transactions) {
    if (t.status === "failed") continue
    const time = parseDay(t.date).getTime()
    if (Number.isNaN(time)) continue
    if (time >= start30 && time < end) current.push(t)
    else if (time >= start60 && time < start30) previous.push(t)
  }
  const isSpend = (t: FullTransaction) => t.type === "expense" && t.category !== "Transfer"

  const insights: Insight[] = []

  // 1. Biggest change in a spending category (last 30 days vs the 30 before)
  const byCat = (list: FullTransaction[]) => {
    const m = new Map<string, number>()
    for (const t of list) if (isSpend(t)) m.set(t.category, (m.get(t.category) ?? 0) + Math.abs(t.amount))
    return m
  }
  const cur = byCat(current)
  const prev = byCat(previous)
  let best: { cat: string; change: number; now: number } | null = null
  for (const [cat, now] of cur) {
    const before = prev.get(cat) ?? 0
    if (before < 50 || now < 50) continue // ignore tiny categories
    const change = pct(now, before)
    if (change !== 0 && (!best || Math.abs(change) > Math.abs(best.change))) best = { cat, change, now }
  }
  if (best) {
    const more = best.change > 0
    insights.push({
      id: "category-change",
      tone: more ? "negative" : "positive",
      title: `${best.cat} ${more ? "up" : "down"} ${Math.abs(best.change)}%`,
      parts: [
        `You spent ${Math.abs(best.change)}% ${more ? "more" : "less"} on ${best.cat.toLowerCase()} in the last 30 days (`,
        { usd: best.now },
        `) than in the 30 days before.`,
      ],
      href: `/transactions?q=${encodeURIComponent(best.cat)}`,
    })
  }

  // 2. Net cash flow
  const income = current.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const spent = current.filter(isSpend).reduce((s, t) => s + Math.abs(t.amount), 0)
  if (income > 0 || spent > 0) {
    const net = income - spent
    const rate = income > 0 ? Math.round((net / income) * 100) : 0
    insights.push(
      net >= 0
        ? {
            id: "cash-flow",
            tone: "positive",
            title: `Saved ${rate}% of income`,
            parts: ["You kept ", { usd: net }, " of the ", { usd: income }, " you earned in the last 30 days."],
            href: "/analytics",
          }
        : {
            id: "cash-flow",
            tone: "negative",
            title: "Spending ahead of income",
            parts: ["You spent ", { usd: -net }, " more than you earned in the last 30 days."],
            href: "/analytics",
          }
    )
  }

  // 3. Top merchant
  const merchants = new Map<string, { total: number; count: number }>()
  for (const t of current) {
    if (!isSpend(t)) continue
    const m = merchants.get(t.merchant) ?? { total: 0, count: 0 }
    m.total += Math.abs(t.amount)
    m.count += 1
    merchants.set(t.merchant, m)
  }
  const top = [...merchants.entries()].sort((a, b) => b[1].total - a[1].total)[0]
  if (top) {
    insights.push({
      id: "top-merchant",
      tone: "neutral",
      title: `Top merchant: ${top[0]}`,
      parts: [
        `${top[0]} took `,
        { usd: top[1].total },
        ` across ${top[1].count} payment${top[1].count === 1 ? "" : "s"} in the last 30 days.`,
      ],
      href: `/transactions?q=${encodeURIComponent(top[0])}`,
    })
  }

  // 4. Budgets
  const over = budgets.filter((b) => b.spent > b.budget)
  if (budgets.length > 0) {
    if (over.length > 0) {
      const worst = [...over].sort((a, b) => b.spent - b.budget - (a.spent - a.budget))[0]
      insights.push({
        id: "budgets",
        tone: "negative",
        title: `${over.length} budget${over.length === 1 ? "" : "s"} over limit`,
        parts: [`${worst.category} is `, { usd: worst.spent - worst.budget }, " over its monthly budget."],
        href: "/budgets",
      })
    } else {
      const left = budgets.reduce((s, b) => s + (b.budget - b.spent), 0)
      insights.push({
        id: "budgets",
        tone: "positive",
        title: "All budgets on track",
        parts: ["You have ", { usd: left }, " left across your budgets this month."],
        href: "/budgets",
      })
    }
  }

  // 5. Closest savings goal
  const open = goals
    .filter((g) => g.currentAmount < g.targetAmount && g.targetAmount > 0)
    .sort((a, b) => b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount)[0]
  if (open) {
    insights.push({
      id: "goal",
      tone: "neutral",
      title: `${open.name}: ${Math.round((open.currentAmount / open.targetAmount) * 100)}% there`,
      parts: [{ usd: open.targetAmount - open.currentAmount }, ` to go to reach your ${open.name.toLowerCase()} goal.`],
      href: "/budgets",
    })
  }

  return insights
}
