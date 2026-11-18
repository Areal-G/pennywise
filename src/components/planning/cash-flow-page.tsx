"use client"

import * as React from "react"
import { Bar, CartesianGrid, ComposedChart, Line, Pie, PieChart, XAxis, YAxis, Cell } from "recharts"
import { ArrowDownLeftIcon, ArrowUpRightIcon, PercentIcon, PiggyBankIcon } from "lucide-react"

import { cashFlow, cashFlowSummary, INCOME_SOURCES } from "@/lib/planning"
import { useMoney } from "@/lib/finance-store"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChartAnimation } from "@/components/money"
import { StatTiles } from "@/components/planning/stat-tiles"

const flowConfig = {
  income: { label: "Income", color: "oklch(0.7 0.15 162)" },
  expenses: { label: "Expenses", color: "oklch(0.68 0.19 15)" },
  savingsRate: { label: "Savings rate", color: "var(--color-primary)" },
} satisfies ChartConfig

const sourceConfig = Object.fromEntries(INCOME_SOURCES.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig

type Range = "6" | "12"

export function CashFlowPage() {
  const { format: money } = useMoney()
  const anim = useChartAnimation()
  const [range, setRange] = React.useState<Range>("12")

  const months = cashFlow.slice(-Number(range))
  const s = cashFlowSummary(months)
  const data = months.map((m) => ({
    month: m.month,
    income: m.totalIncome,
    expenses: m.totalExpenses,
    savingsRate: m.savingsRate,
  }))
  const pie = s.bySource.filter((x) => x.total > 0).map((x) => ({ key: x.key, name: x.label, value: x.total, fill: x.color }))
  const lastChange = s.last.totalExpenses - s.prev.totalExpenses

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Income vs expenses</h2>
          <p className="text-xs text-muted-foreground">Complete months, all accounts</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="6">6 months</TabsTrigger>
            <TabsTrigger value="12">12 months</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <StatTiles
        tiles={[
          { label: "Income", value: money(s.income, { decimals: 0 }), hint: `${money(s.avgIncome, { decimals: 0 })} a month on average`, icon: ArrowDownLeftIcon, tone: "positive" },
          { label: "Expenses", value: money(s.expenses, { decimals: 0 }), hint: `${money(s.avgExpenses, { decimals: 0 })} a month on average`, icon: ArrowUpRightIcon, tone: "negative" },
          { label: "Saved", value: money(s.net, { decimals: 0 }), hint: `${money(s.net / months.length, { decimals: 0 })} a month`, icon: PiggyBankIcon },
          { label: "Savings rate", value: `${s.savingsRate}%`, hint: `Best: ${s.best.month} at ${s.best.savingsRate}%`, icon: PercentIcon, tone: s.savingsRate >= 20 ? "positive" : "warning" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly cash flow</CardTitle>
          <CardDescription>
            Bars show money in and out; the line is the share of income you kept. In {s.last.label} you spent{" "}
            <span className={cn("font-medium", lastChange > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
              {money(Math.abs(lastChange), { decimals: 0 })} {lastChange > 0 ? "more" : "less"}
            </span>{" "}
            than the month before.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={flowConfig} className="aspect-auto h-[300px] w-full">
            <ComposedChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis yAxisId="money" tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => money(v, { compact: true })} />
              <YAxis yAxisId="rate" orientation="right" tickLine={false} axisLine={false} width={36} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="size-2 rounded-[2px]" style={{ background: `var(--color-${name})` }} />
                          {flowConfig[name as keyof typeof flowConfig]?.label}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {name === "savingsRate" ? `${value}%` : money(Number(value), { decimals: 0 })}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar yAxisId="money" dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={22} {...anim} />
              <Bar yAxisId="money" dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} maxBarSize={22} {...anim} />
              <Line yAxisId="rate" dataKey="savingsRate" type="monotone" stroke="var(--color-savingsRate)" strokeWidth={2} dot={{ r: 3 }} {...anim} />
            </ComposedChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            {Object.entries(flowConfig).map(([key, c]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={cn("size-2.5", key === "savingsRate" ? "h-0.5 w-4" : "rounded-[3px]")} style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income sources</CardTitle>
            <CardDescription>Where your money came from</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
            <ChartContainer config={sourceConfig} className="aspect-square h-[180px] shrink-0">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v, n) => `${n}: ${money(Number(v), { decimals: 0 })}`} />} />
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2} strokeWidth={0} {...anim}>
                  {pie.map((p) => (
                    <Cell key={p.key} fill={p.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="w-full space-y-3">
              {s.bySource.map((src) => {
                const share = s.income ? (src.total / s.income) * 100 : 0
                return (
                  <li key={src.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-[3px]" style={{ background: src.color }} />
                        {src.label}
                      </span>
                      <span className="tabular-nums">
                        {money(src.total, { decimals: 0 })}
                        <span className="ml-1.5 text-xs text-muted-foreground">{Math.round(share)}%</span>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where it went</CardTitle>
            <CardDescription>Spending by group, {months.length} months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.byGroup.map((g) => {
              const share = s.expenses ? (g.total / s.expenses) * 100 : 0
              return (
                <div key={g.group} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{g.group}</span>
                    <span className="tabular-nums">
                      {money(g.total, { decimals: 0 })}
                      <span className="ml-1.5 text-xs text-muted-foreground">{Math.round(share)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-[oklch(0.68_0.19_15)]" style={{ width: `${(g.total / s.byGroup[0].total) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Month by month</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 sm:px-6">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium sm:px-2">Month</th>
                <th className="px-2 py-2 text-right font-medium">Income</th>
                <th className="px-2 py-2 text-right font-medium">Expenses</th>
                <th className="px-2 py-2 text-right font-medium">Saved</th>
                <th className="px-4 py-2 text-right font-medium sm:px-2">Rate</th>
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((m) => (
                <tr key={m.label} className="border-b last:border-0">
                  <td className="px-4 py-2.5 sm:px-2">{m.label}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{money(m.totalIncome, { decimals: 0 })}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{money(m.totalExpenses, { decimals: 0 })}</td>
                  <td className={cn("px-2 py-2.5 text-right font-medium tabular-nums", m.net < 0 && "text-rose-600 dark:text-rose-400")}>{money(m.net, { decimals: 0 })}</td>
                  <td className="px-4 py-2.5 text-right sm:px-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", m.savingsRate >= 30 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : m.savingsRate >= 15 ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                      {m.savingsRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
