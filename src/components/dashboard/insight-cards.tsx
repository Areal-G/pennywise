"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRightIcon, LightbulbIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { computeInsights, type InsightTone } from "@/lib/insights"
import { useFinanceStore } from "@/lib/finance-store"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Money } from "@/components/money"

const toneStyle: Record<InsightTone, { icon: typeof LightbulbIcon; className: string }> = {
  positive: {
    icon: TrendingUpIcon,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  negative: {
    icon: TrendingDownIcon,
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  neutral: {
    icon: LightbulbIcon,
    className: "bg-primary/10 text-primary",
  },
}

export function InsightCards() {
  const { transactions, budgets, goals } = useFinanceStore()
  const insights = useMemo(
    () => computeInsights(transactions, budgets, goals).slice(0, 4),
    [transactions, budgets, goals]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <LightbulbIcon className="size-4 text-primary" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Add a few transactions and insights about your spending will show up here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {insights.map((insight, i) => {
              const tone = toneStyle[insight.tone]
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <Link
                    href={insight.href}
                    className="group flex h-full flex-col gap-2 rounded-xl border p-3 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", tone.className)}>
                        <tone.icon className="size-3.5" />
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{insight.title}</p>
                      <ArrowUpRightIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {insight.parts.map((part, j) =>
                        typeof part === "string" ? (
                          <span key={j}>{part}</span>
                        ) : (
                          <Money key={j} value={part.usd} decimals={0} className="font-medium text-foreground tabular-nums" />
                        )
                      )}
                    </p>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
