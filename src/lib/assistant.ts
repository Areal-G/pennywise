// Offline "Ask Pennywise" responder: rule-based answers computed from the same
// facts the Claude route receives, so the assistant works without an API key.

import type { FinanceFacts } from "@/lib/planning"

export type Fmt = (usd: number) => string

export const SUGGESTED_PROMPTS = [
  "Where did my money go this month?",
  "Which subscriptions should I cancel?",
  "Am I on track for my savings goals?",
  "Which budgets am I over?",
  "What's my savings rate?",
  "How can I save $300 a month?",
]

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w))
const pct = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : 0)
const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n")

function spending(f: FinanceFacts, fmt: Fmt, focus?: string) {
  const d = f.last30Days
  if (focus) {
    const cat = d.categories.find((c) => c.category.toLowerCase().includes(focus))
    const merchants = d.topMerchants.filter((m) => m.merchant.toLowerCase().includes(focus))
    if (cat) {
      const change = pct(cat.amount, cat.previous)
      return `You spent **${fmt(cat.amount)}** on ${cat.category} in the last 30 days${
        cat.previous ? `, ${change >= 0 ? "up" : "down"} **${Math.abs(change)}%** from ${fmt(cat.previous)} the 30 days before` : ""
      }.`
    }
    if (merchants.length) {
      return `In the last 30 days you spent ${merchants.map((m) => `**${fmt(m.amount)}** at ${m.merchant}`).join(" and ")}.`
    }
  }
  const change = pct(d.spending, d.previous30Spending)
  const top = d.categories.slice(0, 4).map((c) => {
    const share = Math.round((c.amount / d.spending) * 100)
    return `**${c.category}**: ${fmt(c.amount)} (${share}%)`
  })
  return `You spent **${fmt(d.spending)}** in the last 30 days, ${change >= 0 ? "up" : "down"} **${Math.abs(change)}%** on the 30 days before. Your biggest categories:\n${list(top)}\n\nTop merchant: **${d.topMerchants[0]?.merchant}** at ${fmt(d.topMerchants[0]?.amount ?? 0)}.`
}

function subscriptionsAnswer(f: FinanceFacts, fmt: Fmt) {
  const s = f.subscriptions
  const lines: string[] = []
  for (const u of s.unused) lines.push(`Cancel **${u.name}**: not opened in ${u.lastUsedDaysAgo} days, costs ${fmt(u.yearly)} a year`)
  for (const p of s.priceIncreases)
    lines.push(`**${p.name}** went up from ${fmt(p.from ?? 0)} to ${fmt(p.to)} a ${p.cycle === "monthly" ? "month" : "year"}. Worth a check`)
  const saving = s.unused.reduce((a, u) => a + u.yearly, 0)
  return `You have **${s.count} subscriptions** costing **${fmt(s.monthlyTotal)}/month** (${fmt(s.yearlyTotal)} a year).${
    lines.length ? `\n${list(lines)}` : ""
  }${saving ? `\n\nCancelling the unused ones would save about **${fmt(saving)} a year**.` : ""}${
    s.upcoming.length ? `\n\nRenewing in the next 2 weeks: ${s.upcoming.map((u) => `${u.name} (${u.date})`).join(", ")}.` : ""
  }`
}

function budgetsAnswer(f: FinanceFacts, fmt: Fmt) {
  const over = f.budgets.filter((b) => b.over).sort((a, b) => a.left - b.left)
  const close = f.budgets.filter((b) => !b.over && b.spent / b.budget >= 0.8)
  if (!f.budgets.length) return "You don't have any budgets yet. Create one on the **Budgets** page and I'll keep an eye on it."
  const lines = [
    ...over.map((b) => `**${b.category}**: ${fmt(b.spent)} of ${fmt(b.budget)}, **${fmt(-b.left)} over**`),
    ...close.map((b) => `${b.category}: ${fmt(b.left)} left of ${fmt(b.budget)} (nearly there)`),
  ]
  return over.length
    ? `You're over budget in **${over.length} of ${f.budgets.length}** categories this month:\n${list(lines)}`
    : `Nice: you're within every budget this month.${close.length ? `\n${list(lines)}` : ""}`
}

function goalsAnswer(f: FinanceFacts, fmt: Fmt, focus?: string) {
  const goals = focus ? f.goals.filter((g) => g.name.toLowerCase().includes(focus)) : f.goals
  if (!f.goals.length) return "You haven't set any savings goals yet. Add one on the **Goals** page."
  const pick = goals.length ? goals : f.goals
  const label: Record<string, string> = { "on-track": "on track", behind: "behind", reached: "reached", "no-plan": "no monthly plan" }
  const lines = pick.map((g) => {
    const extra =
      g.status === "behind"
        ? ` (needs **${fmt(g.neededPerMonth)}/mo**, you put in ${fmt(g.plannedPerMonth)})`
        : g.projectedFinish && g.status === "on-track"
          ? ` (done by ${g.projectedFinish})`
          : ""
    return `**${g.name}**: ${fmt(g.saved)} of ${fmt(g.target)} (${g.percent}%), ${label[g.status]}${extra}`
  })
  const behind = pick.filter((g) => g.status === "behind")
  const headline =
    pick.length === 1
      ? behind.length
        ? "Not quite: this goal needs more each month to hit its date."
        : "Yes, this goal is on track."
      : behind.length
        ? `**${behind.length} of ${pick.length}** goals need more each month to hit their date.`
        : "All of these goals are on track."
  return `${headline}\n${list(lines)}`
}

function incomeAnswer(f: FinanceFacts, fmt: Fmt) {
  const c = f.cashFlow12Months
  const sources = [...c.incomeSources].sort((a, b) => b.total - a.total)
  return `Over the last 12 months you earned **${fmt(c.income)}** and spent **${fmt(c.expenses)}**, a savings rate of **${c.savingsRate}%**.\n${list([
    `Average month: ${fmt(c.avgMonthlyIncome)} in, ${fmt(c.avgMonthlyExpenses)} out`,
    `${c.lastMonth.label}: saved **${c.lastMonth.savingsRate}%** of income`,
    `Main income: ${sources
      .slice(0, 2)
      .map((s) => `${s.source} (${Math.round((s.total / c.income) * 100)}%)`)
      .join(", ")}`,
  ])}`
}

function savingTips(f: FinanceFacts, fmt: Fmt, target?: number) {
  const tips: { text: string; monthly: number }[] = []
  for (const u of f.subscriptions.unused) tips.push({ text: `Cancel ${u.name} (unused)`, monthly: u.yearly / 12 })
  const over = f.budgets.filter((b) => b.over)
  for (const b of over) tips.push({ text: `Bring ${b.category} back to its ${fmt(b.budget)} budget`, monthly: b.spent - b.budget })
  const dining = f.last30Days.categories.find((c) => c.category === "Food & Dining")
  if (dining) tips.push({ text: `Cook at home 2 more nights a week (Food & Dining is ${fmt(dining.amount)})`, monthly: dining.amount * 0.25 })
  const shopping = f.last30Days.categories.find((c) => c.category === "Shopping")
  if (shopping) tips.push({ text: `Pause non-essential shopping for a month`, monthly: shopping.amount * 0.3 })
  tips.sort((a, b) => b.monthly - a.monthly)
  const total = tips.reduce((s, t) => s + t.monthly, 0)
  const lines = tips.slice(0, 5).map((t) => `${t.text}: about **${fmt(t.monthly)}/mo**`)
  const goal = target ? ` Your target is ${fmt(target)}/month: ${total >= target ? "these get you there." : "these get you part of the way."}` : ""
  return `Here's where I'd look first, based on your last 30 days:\n${list(lines)}\n\nTogether that's roughly **${fmt(total)} a month**.${goal}`
}

/** Answer a question from the user's data (plain text with **bold** and "- " bullets) */
export function offlineAnswer(question: string, f: FinanceFacts, fmt: Fmt): string {
  const q = question.toLowerCase()
  const amount = Number(q.match(/\$?\s?(\d[\d,]*)/)?.[1]?.replace(/,/g, ""))

  if (has(q, "hello", "hi ", "hey", "what can you", "help")) {
    return `Hi! I'm Pennywise. I can see your transactions, budgets, subscriptions, goals and income. Try asking:\n${list([
      "Where did my money go this month?",
      "Which subscriptions should I cancel?",
      "Am I on track for my vacation fund?",
    ])}`
  }
  if (has(q, "save $", "save money", "cut", "reduce", "spend less", "tips", "save more", "how can i save"))
    return savingTips(f, fmt, Number.isFinite(amount) && amount > 0 ? amount : undefined)
  if (has(q, "subscription", "cancel", "recurring", "renew", "netflix", "spotify", "adobe", "linkedin"))
    return subscriptionsAnswer(f, fmt)
  if (has(q, "budget", "over", "limit")) return budgetsAnswer(f, fmt)
  for (const key of ["vacation", "emergency", "car", "home", "house"]) {
    if (q.includes(key)) return goalsAnswer(f, fmt, key === "house" ? "home" : key)
  }
  if (has(q, "goal", "on track", "saving for")) return goalsAnswer(f, fmt)
  if (has(q, "income", "earn", "savings rate", "cash flow", "cashflow", "salary", "paid")) return incomeAnswer(f, fmt)
  if (has(q, "coffee", "starbucks")) return spending(f, fmt, "starbucks")
  if (has(q, "food", "dining", "eat", "restaurant", "doordash")) return spending(f, fmt, "food")
  if (has(q, "uber", "transport", "gas")) return spending(f, fmt, "transport")
  if (has(q, "shopping", "amazon")) return spending(f, fmt, "shopping")
  if (has(q, "travel", "trip", "flight")) return spending(f, fmt, "travel")
  if (has(q, "afford")) {
    const c = f.cashFlow12Months
    const surplus = c.avgMonthlyIncome - c.avgMonthlyExpenses
    return `On average you have about **${fmt(surplus)} left each month** after spending.${
      Number.isFinite(amount) && amount > 0
        ? ` A ${fmt(amount)} purchase is ${amount <= surplus ? "within one month's surplus" : `about ${Math.ceil(amount / surplus)} months of surplus`}.`
        : ""
    } Keep your Emergency Fund on track before big purchases.`
  }
  if (has(q, "spend", "spent", "money go", "category", "categories", "biggest", "expense")) return spending(f, fmt)

  return `Here's a quick snapshot:\n${list([
    `Last 30 days: spent **${fmt(f.last30Days.spending)}**, earned ${fmt(f.last30Days.income)}`,
    `Subscriptions: ${fmt(f.subscriptions.monthlyTotal)}/month, ${f.subscriptions.unused.length} unused`,
    `Budgets over limit: ${f.budgets.filter((b) => b.over).length} of ${f.budgets.length}`,
    `12-month savings rate: **${f.cashFlow12Months.savingsRate}%**`,
  ])}\n\nAsk me about spending, subscriptions, budgets, goals or income for details.`
}
