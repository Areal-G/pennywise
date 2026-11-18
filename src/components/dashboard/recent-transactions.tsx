"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFinanceStore, useMoney } from "@/lib/finance-store"
import { MerchantLogo } from "@/components/merchant-logo"
import { EmptyState } from "@/components/empty-state"
import {
  MoreHorizontalIcon,
  ChevronRightIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const categoryColors: Record<string, string> = {
  Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  Technology: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Income: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Design: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  "AI Tools": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  Productivity: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
}

export function RecentTransactions() {
  const { transactions } = useFinanceStore()
  const { format } = useMoney()
  const recent = transactions.slice(0, 6)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">
          Recent Transactions
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          nativeButton={false}
          render={<Link href="/transactions" />}
        >
          See All
          <ChevronRightIcon className="size-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px] space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[1fr_140px_100px_120px_32px] gap-4 border-b pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Merchant</span>
              <span className="hidden sm:inline">Transaction ID</span>
              <span className="text-right">Amount</span>
              <span className="hidden md:inline">Date</span>
              <span />
            </div>

            {/* Rows */}
            {recent.length === 0 && (
              <EmptyState variant="transactions" className="py-8" description="Add a transaction to see it here." />
            )}
            {recent.map((tx) => (
              <div
                key={tx.id}
                className="group grid grid-cols-[1fr_140px_100px_120px_32px] items-center gap-4 rounded-lg py-2.5 transition-colors hover:bg-muted/50"
              >
                {/* Merchant */}
                <div className="flex items-center gap-3">
                  <MerchantLogo src={tx.logo} name={tx.merchant} size={36} className="object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{tx.merchant}</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-0.5 h-5 rounded-md px-1.5 text-[10px] font-medium",
                        categoryColors[tx.category]
                      )}
                    >
                      {tx.category}
                    </Badge>
                  </div>
                </div>

                {/* Transaction ID */}
                <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                  {tx.transactionId}
                </span>

                {/* Amount */}
                <span
                  className={cn(
                    "text-right text-sm font-semibold tabular-nums",
                    tx.amount > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  )}
                >
                  {format(tx.amount, { sign: tx.amount > 0 })}
                </span>

                {/* Date */}
                <span className="hidden text-xs text-muted-foreground md:inline">{tx.date}</span>

                {/* Actions */}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`View ${tx.merchant} in transactions`}
                  className="size-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
                  nativeButton={false}
                  render={<Link href={`/transactions?q=${encodeURIComponent(tx.merchant)}`} />}
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
