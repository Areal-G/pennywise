// Planning data and calculations: subscriptions, cash flow, goals, statement
// reconciliation and the facts the "Ask Pennywise" assistant answers from.
// Pure functions only (no React), so the API route can use them too.

import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  isAfter,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"

import {
  fullTransactions,
  logo,
  transactionHistory,
  type BudgetCategory,
  type FullTransaction,
  type SavingsGoal,
} from "@/data/seed"
import { formatDay, parseDay, seededRandom, shiftDay, today } from "@/lib/mock"

// ══════════════════════════════════════════════════════════════════════════════
// Subscriptions
// ══════════════════════════════════════════════════════════════════════════════

export type Subscription = {
  id: string
  name: string
  logo?: string
  category: string
  amount: number
  cycle: "monthly" | "yearly"
  /** A past charge date ("MMM dd, yyyy"); renewals repeat from here */
  anchor: string
  /** Price before the latest increase */
  previousAmount?: number
  /** Days since the service was last opened (from the connected account) */
  lastUsedDaysAgo: number
  cardLast4: string
}

/** Merchant's latest seeded charge date, so renewals line up with Transactions */
const chargeDate = (merchant: string, fallback: string) =>
  fullTransactions.find((t) => t.merchant === merchant)?.date ?? shiftDay(fallback)

export const subscriptions: Subscription[] = [
  { id: "s1", name: "Netflix", logo: logo("netflix.com"), category: "Entertainment", amount: 15.99, cycle: "monthly", anchor: chargeDate("Netflix", "Apr 02, 2026"), previousAmount: 13.99, lastUsedDaysAgo: 2, cardLast4: "4589" },
  { id: "s2", name: "Spotify", logo: logo("spotify.com"), category: "Entertainment", amount: 9.99, cycle: "monthly", anchor: chargeDate("Spotify", "Apr 10, 2026"), lastUsedDaysAgo: 0, cardLast4: "4589" },
  { id: "s3", name: "ChatGPT Plus", logo: logo("openai.com"), category: "AI Tools", amount: 20, cycle: "monthly", anchor: chargeDate("ChatGPT Plus", "Apr 06, 2026"), lastUsedDaysAgo: 1, cardLast4: "4589" },
  { id: "s4", name: "Adobe Creative Cloud", logo: logo("adobe.com"), category: "Design", amount: 54.99, cycle: "monthly", anchor: chargeDate("Adobe Creative Cloud", "Mar 29, 2026"), lastUsedDaysAgo: 47, cardLast4: "7321" },
  { id: "s5", name: "Figma Pro", logo: logo("figma.com"), category: "Design", amount: 15, cycle: "monthly", anchor: chargeDate("Figma Pro", "Apr 07, 2026"), previousAmount: 12, lastUsedDaysAgo: 0, cardLast4: "7321" },
  { id: "s6", name: "LinkedIn Premium", logo: logo("linkedin.com"), category: "Productivity", amount: 29.99, cycle: "monthly", anchor: chargeDate("LinkedIn Premium", "Mar 24, 2026"), lastUsedDaysAgo: 63, cardLast4: "9012" },
  { id: "s7", name: "Google Workspace", logo: logo("google.com"), category: "Productivity", amount: 12, cycle: "monthly", anchor: chargeDate("Google Workspace", "Apr 05, 2026"), lastUsedDaysAgo: 0, cardLast4: "4589" },
  { id: "s8", name: "Notion", logo: logo("notion.so"), category: "Productivity", amount: 10, cycle: "monthly", anchor: chargeDate("Notion", "Mar 26, 2026"), lastUsedDaysAgo: 3, cardLast4: "7321" },
  { id: "s9", name: "Slack", logo: logo("slack.com"), category: "Productivity", amount: 8.75, cycle: "monthly", anchor: chargeDate("Slack", "Mar 28, 2026"), lastUsedDaysAgo: 1, cardLast4: "4589" },
  { id: "s10", name: "Vercel Pro", logo: logo("vercel.com"), category: "Technology", amount: 20, cycle: "monthly", anchor: chargeDate("Vercel Pro", "Mar 25, 2026"), lastUsedDaysAgo: 5, cardLast4: "4589" },
  { id: "s11", name: "GitHub Pro", logo: logo("github.com"), category: "Technology", amount: 4, cycle: "monthly", anchor: chargeDate("GitHub Pro", "Mar 27, 2026"), lastUsedDaysAgo: 0, cardLast4: "4589" },
  { id: "s12", name: "Apple iCloud+", logo: logo("apple.com"), category: "Technology", amount: 2.99, cycle: "monthly", anchor: chargeDate("Apple iCloud+", "Mar 23, 2026"), lastUsedDaysAgo: 0, cardLast4: "4589" },
  { id: "s13", name: "Amazon Prime", logo: logo("amazon.com"), category: "Shopping", amount: 139, cycle: "yearly", anchor: shiftDay("Apr 29, 2025"), previousAmount: 119, lastUsedDaysAgo: 4, cardLast4: "4589" },
  { id: "s14", name: "Microsoft 365", logo: logo("microsoft.com"), category: "Productivity", amount: 99.99, cycle: "yearly", anchor: shiftDay("Jun 18, 2025"), lastUsedDaysAgo: 12, cardLast4: "9012" },
  { id: "s15", name: "Headspace", category: "Health & Fitness", amount: 69.99, cycle: "yearly", anchor: shiftDay("May 08, 2025"), lastUsedDaysAgo: 94, cardLast4: "9012" },
]

/** Days without use before a subscription is flagged as unused */
export const UNUSED_AFTER_DAYS = 30

export const monthlyCost = (s: Subscription) => (s.cycle === "monthly" ? s.amount : s.amount / 12)
export const yearlyCost = (s: Subscription) => (s.cycle === "monthly" ? s.amount * 12 : s.amount)
export const isUnused = (s: Subscription) => s.lastUsedDaysAgo >= UNUSED_AFTER_DAYS
export const priceIncrease = (s: Subscription) =>
  s.previousAmount && s.previousAmount < s.amount ? s.amount - s.previousAmount : 0

/** Next renewal on or after today */
export function nextCharge(s: Subscription): Date {
  let d = parseDay(s.anchor)
  const step = s.cycle === "monthly" ? (x: Date) => addMonths(x, 1) : (x: Date) => addYears(x, 1)
  while (!isAfter(d, subDays(today, 1))) d = step(d)
  return d
}

export const daysUntil = (d: Date) => differenceInCalendarDays(d, today)

export function subscriptionSummary(list: Subscription[] = subscriptions) {
  const monthly = list.reduce((s, x) => s + monthlyCost(x), 0)
  const unused = list.filter(isUnused)
  const increased = list.filter((s) => priceIncrease(s) > 0)
  return {
    monthly,
    yearly: monthly * 12,
    count: list.length,
    unused,
    unusedYearly: unused.reduce((s, x) => s + yearlyCost(x), 0),
    increased,
    increaseYearly: increased.reduce((s, x) => s + priceIncrease(x) * (x.cycle === "monthly" ? 12 : 1), 0),
  }
}

export const upcomingRenewals = (days = 30, list: Subscription[] = subscriptions) =>
  list
    .map((s) => ({ sub: s, date: nextCharge(s) }))
    .filter((r) => daysUntil(r.date) <= days)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

// ══════════════════════════════════════════════════════════════════════════════
// Cash flow (last 12 complete months)
// ══════════════════════════════════════════════════════════════════════════════

export const INCOME_SOURCES = [
  { key: "clients", label: "Client work", color: "var(--chart-1)" },
  { key: "stripe", label: "Stripe payouts", color: "var(--chart-2)" },
  { key: "freelance", label: "Freelance projects", color: "var(--chart-3)" },
  { key: "dividends", label: "Dividends", color: "var(--chart-4)" },
] as const
export type IncomeSource = (typeof INCOME_SOURCES)[number]["key"]

export const EXPENSE_GROUPS = [
  "Housing",
  "Food & Dining",
  "Transport",
  "Shopping",
  "Subscriptions",
  "Travel",
  "Health & Fitness",
  "Other",
] as const
export type ExpenseGroup = (typeof EXPENSE_GROUPS)[number]

export type CashFlowMonth = {
  month: string // "Nov"
  label: string // "November 2026"
  income: Record<IncomeSource, number>
  expenses: Record<ExpenseGroup, number>
  totalIncome: number
  totalExpenses: number
  net: number
  savingsRate: number // 0-100
}

const r2 = (n: number) => Math.round(n)

export const cashFlow: CashFlowMonth[] = (() => {
  const rand = seededRandom(9031)
  const between = (min: number, max: number) => min + rand() * (max - min)
  const subs = subscriptionSummary().monthly
  const out: CashFlowMonth[] = []
  for (let back = 12; back >= 1; back--) {
    const d = startOfMonth(subMonths(today, back))
    const m = d.getMonth()
    const income = {
      clients: r2(between(7000, 9600)),
      stripe: r2(between(3500, 4900)),
      freelance: rand() < 0.75 ? r2(between(1400, 3600)) : 0,
      dividends: m % 3 === 2 ? r2(between(130, 160)) : 0,
    }
    const holiday = m === 6 || m === 11 // July and December trips
    const expenses = {
      Housing: 2850,
      "Food & Dining": r2(between(680, 960)),
      Transport: r2(between(260, 430)),
      Shopping: r2(between(380, 720) + (m === 10 || m === 11 ? 450 : 0)),
      Subscriptions: r2(subs),
      Travel: holiday ? r2(between(1200, 1900)) : rand() < 0.4 ? r2(between(180, 650)) : 0,
      "Health & Fitness": r2(between(85, 170)),
      Other: r2(between(550, 1150)),
    }
    const totalIncome = Object.values(income).reduce((a, b) => a + b, 0)
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0)
    const net = totalIncome - totalExpenses
    out.push({
      month: format(d, "MMM"),
      label: format(d, "MMMM yyyy"),
      income,
      expenses,
      totalIncome,
      totalExpenses,
      net,
      savingsRate: Math.round((net / totalIncome) * 100),
    })
  }
  return out
})()

export function cashFlowSummary(months: CashFlowMonth[] = cashFlow) {
  const income = months.reduce((s, m) => s + m.totalIncome, 0)
  const expenses = months.reduce((s, m) => s + m.totalExpenses, 0)
  const bySource = INCOME_SOURCES.map((src) => ({
    ...src,
    total: months.reduce((s, m) => s + m.income[src.key], 0),
  }))
  const byGroup = EXPENSE_GROUPS.map((g) => ({
    group: g,
    total: months.reduce((s, m) => s + m.expenses[g], 0),
  })).sort((a, b) => b.total - a.total)
  const last = months[months.length - 1]
  const prev = months[months.length - 2]
  const best = months.reduce((a, b) => (b.savingsRate > a.savingsRate ? b : a))
  return {
    income,
    expenses,
    net: income - expenses,
    savingsRate: Math.round(((income - expenses) / income) * 100),
    avgIncome: income / months.length,
    avgExpenses: expenses / months.length,
    bySource,
    byGroup,
    last,
    prev,
    best,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Savings goals
// ══════════════════════════════════════════════════════════════════════════════

/** "Aug 2026" deadline → last day of that month */
export const goalDeadline = (g: SavingsGoal) => {
  const d = new Date(`${g.deadline} 1`)
  return Number.isNaN(d.getTime()) ? addMonths(today, 12) : d
}

export function goalPlan(g: SavingsGoal) {
  const remaining = Math.max(0, g.targetAmount - g.currentAmount)
  const percent = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0
  const deadline = goalDeadline(g)
  const monthsLeft = Math.max(1, differenceInCalendarMonths(deadline, today) + 1)
  const neededPerMonth = remaining / monthsLeft
  const projected =
    remaining === 0
      ? today
      : g.monthlyContribution > 0
        ? addMonths(today, Math.ceil(remaining / g.monthlyContribution))
        : null
  const status: "reached" | "on-track" | "behind" | "no-plan" =
    remaining === 0
      ? "reached"
      : g.monthlyContribution <= 0
        ? "no-plan"
        : g.monthlyContribution + 0.5 >= neededPerMonth
          ? "on-track"
          : "behind"
  return { remaining, percent, deadline, monthsLeft, neededPerMonth, projected, status }
}

// ══════════════════════════════════════════════════════════════════════════════
// Statement reconciliation (Main Debit •••• 4589, last 30 days)
// ══════════════════════════════════════════════════════════════════════════════

export const STATEMENT_CARD = "4589"
export const STATEMENT_DAYS = 30

export type StatementLine = {
  id: string
  date: string // "MMM dd, yyyy" (posting date)
  description: string // bank-style text
  amount: number // negative = money out
}

const bankText = (merchant: string, n: number) =>
  `${merchant.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 18)} ${String(n).padStart(6, "0")}`

/**
 * The bank's statement, built once from the seed data the way a real one
 * differs from the app: posting dates a day later, a tip added after the
 * fact, a fee and a reward the app never saw, and the newest purchase not
 * posted yet.
 */
export const statementLines: StatementLine[] = (() => {
  const rand = seededRandom(4589)
  const start = subDays(today, STATEMENT_DAYS).getTime()
  const source = transactionHistory
    .filter((t) => t.cardLast4 === STATEMENT_CARD && t.status === "completed")
    .filter((t) => parseDay(t.date).getTime() >= start)
    .sort((a, b) => parseDay(a.date).getTime() - parseDay(b.date).getTime())
  const lines: StatementLine[] = []
  source.forEach((t, i) => {
    if (i === source.length - 1) return // newest purchase hasn't posted yet
    const posted = rand() < 0.45 ? formatDay(subDays(parseDay(t.date), -1)) : t.date
    let amount = t.amount
    // Two purchases settle for a different amount (tip / currency conversion)
    if (t.merchant === "DoorDash" && !lines.some((l) => l.description.startsWith("DOORDASH") && l.id.endsWith("x"))) {
      amount = Math.round((t.amount - 4) * 100) / 100
      lines.push({ id: `st-${t.id}-x`, date: posted, description: bankText(t.merchant, Math.floor(rand() * 999999)), amount })
      return
    }
    if (t.merchant === "Spotify") amount = Math.round((t.amount - 0.3) * 100) / 100
    lines.push({ id: `st-${t.id}`, date: posted, description: bankText(t.merchant, Math.floor(rand() * 999999)), amount })
  })
  lines.push({ id: "st-fee", date: formatDay(subDays(today, 9)), description: "FOREIGN TRANSACTION FEE", amount: -2.71 })
  lines.push({ id: "st-cashback", date: formatDay(subDays(today, 4)), description: "CASHBACK REWARD", amount: 12.4 })
  return lines.sort((a, b) => parseDay(b.date).getTime() - parseDay(a.date).getTime())
})()

export type MatchKind = "exact" | "suggested" | "none"
export type Match = {
  line: StatementLine
  kind: MatchKind
  tx?: FullTransaction
  reason?: string
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "")

/** Match each statement line to one app transaction (each transaction used once) */
export function matchStatement(lines: StatementLine[], transactions: FullTransaction[]) {
  const start = subDays(today, STATEMENT_DAYS + 3).getTime()
  const pool = transactions.filter(
    (t) => t.cardLast4 === STATEMENT_CARD && t.status !== "failed" && parseDay(t.date).getTime() >= start
  )
  const used = new Set<string>()
  const dayGap = (a: string, b: string) => Math.abs(differenceInCalendarDays(parseDay(a), parseDay(b)))
  const nameMatch = (line: StatementLine, t: FullTransaction) => {
    const key = norm(t.merchant).slice(0, 6)
    return key.length > 2 && norm(line.description).includes(key)
  }

  const matches: Match[] = lines.map((line) => ({ line, kind: "none" as MatchKind }))

  // Pass 1: same amount within 3 days
  for (const m of matches) {
    const tx = pool
      .filter((t) => !used.has(t.id) && Math.abs(t.amount - m.line.amount) < 0.005 && dayGap(t.date, m.line.date) <= 3)
      .sort((a, b) => Number(nameMatch(m.line, b)) - Number(nameMatch(m.line, a)) || dayGap(a.date, m.line.date) - dayGap(b.date, m.line.date))[0]
    if (tx) {
      used.add(tx.id)
      m.kind = "exact"
      m.tx = tx
    }
  }

  // Pass 2: same merchant, amount within 20%, within 5 days
  for (const m of matches) {
    if (m.kind !== "none") continue
    const tx = pool.find(
      (t) =>
        !used.has(t.id) &&
        nameMatch(m.line, t) &&
        Math.sign(t.amount) === Math.sign(m.line.amount) &&
        Math.abs(t.amount - m.line.amount) <= Math.abs(t.amount) * 0.2 &&
        dayGap(t.date, m.line.date) <= 5
    )
    if (tx) {
      used.add(tx.id)
      m.kind = "suggested"
      m.tx = tx
      const diff = m.line.amount - tx.amount
      m.reason = `Amount differs by ${Math.abs(diff).toFixed(2)} (${diff < 0 ? "charged more" : "charged less"} than recorded)`
    }
  }

  // App transactions in the statement window the bank hasn't shown
  const windowStart = subDays(today, STATEMENT_DAYS).getTime()
  const missing = pool.filter((t) => !used.has(t.id) && parseDay(t.date).getTime() >= windowStart)
  return { matches, missing }
}

// ══════════════════════════════════════════════════════════════════════════════
// Facts for "Ask Pennywise"
// ══════════════════════════════════════════════════════════════════════════════

export type FinanceFacts = ReturnType<typeof buildFinanceFacts>

/** A compact, grounded snapshot of the user's data */
export function buildFinanceFacts(
  transactions: FullTransaction[],
  budgets: BudgetCategory[],
  goals: SavingsGoal[]
) {
  const start30 = subDays(today, 29).getTime()
  const start60 = subDays(today, 59).getTime()
  const end = today.getTime() + 86_400_000
  const spendNow = new Map<string, number>()
  const spendPrev = new Map<string, number>()
  const merchants = new Map<string, number>()
  let income30 = 0
  for (const t of transactions) {
    if (t.status === "failed") continue
    const time = parseDay(t.date).getTime()
    if (Number.isNaN(time) || time >= end) continue
    if (t.type === "income") {
      if (time >= start30) income30 += t.amount
      continue
    }
    const amt = Math.abs(t.amount)
    if (time >= start30) {
      spendNow.set(t.category, (spendNow.get(t.category) ?? 0) + amt)
      merchants.set(t.merchant, (merchants.get(t.merchant) ?? 0) + amt)
    } else if (time >= start60) {
      spendPrev.set(t.category, (spendPrev.get(t.category) ?? 0) + amt)
    }
  }
  const round = (n: number) => Math.round(n * 100) / 100
  const categories = [...spendNow.entries()]
    .map(([category, amount]) => ({ category, amount: round(amount), previous: round(spendPrev.get(category) ?? 0) }))
    .sort((a, b) => b.amount - a.amount)
  const topMerchants = [...merchants.entries()]
    .map(([merchant, amount]) => ({ merchant, amount: round(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
  const subs = subscriptionSummary()
  const flow = cashFlowSummary()

  return {
    today: format(today, "MMMM d, yyyy"),
    last30Days: {
      spending: round(categories.reduce((s, c) => s + c.amount, 0)),
      previous30Spending: round([...spendPrev.values()].reduce((a, b) => a + b, 0)),
      income: round(income30),
      categories,
      topMerchants,
    },
    budgets: budgets.map((b) => ({
      category: b.category,
      budget: b.budget,
      spent: b.spent,
      left: round(b.budget - b.spent),
      over: b.spent > b.budget,
    })),
    goals: goals.map((g) => {
      const p = goalPlan(g)
      return {
        name: g.name,
        saved: g.currentAmount,
        target: g.targetAmount,
        percent: Math.round(p.percent),
        deadline: g.deadline,
        plannedPerMonth: g.monthlyContribution,
        neededPerMonth: round(p.neededPerMonth),
        status: p.status,
        projectedFinish: p.projected ? format(p.projected, "MMM yyyy") : null,
      }
    }),
    subscriptions: {
      monthlyTotal: round(subs.monthly),
      yearlyTotal: round(subs.yearly),
      count: subs.count,
      unused: subs.unused.map((s) => ({ name: s.name, yearly: round(yearlyCost(s)), lastUsedDaysAgo: s.lastUsedDaysAgo })),
      priceIncreases: subs.increased.map((s) => ({ name: s.name, from: s.previousAmount, to: s.amount, cycle: s.cycle })),
      upcoming: upcomingRenewals(14).map((r) => ({ name: r.sub.name, amount: r.sub.amount, date: format(r.date, "MMM d") })),
    },
    cashFlow12Months: {
      income: flow.income,
      expenses: flow.expenses,
      savingsRate: flow.savingsRate,
      avgMonthlyIncome: round(flow.avgIncome),
      avgMonthlyExpenses: round(flow.avgExpenses),
      lastMonth: { label: flow.last.label, income: flow.last.totalIncome, expenses: flow.last.totalExpenses, savingsRate: flow.last.savingsRate },
      incomeSources: flow.bySource.map((s) => ({ source: s.label, total: s.total })),
      biggestExpenseGroups: flow.byGroup.slice(0, 4),
    },
  }
}
