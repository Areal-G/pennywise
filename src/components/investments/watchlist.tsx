"use client"

import { useState } from "react"
import Image from "next/image"
import { LineChart, Line } from "recharts"
import { X, Plus } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { watchlistItems, watchlistSuggestions, type WatchlistItem } from "@/data/seed"
import { Money, useChartAnimation } from "@/components/money"

export function Watchlist() {
  const chartAnimation = useChartAnimation()
  const [items, setItems] = useState<WatchlistItem[]>(watchlistItems)

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((w) => w.id !== id))
  }

  // Anything not already on the list (including removed items) can be added back
  const addable = [...watchlistItems, ...watchlistSuggestions].filter(
    (w) => !items.some((i) => i.id === w.id)
  )
  const addItem = (item: WatchlistItem) => {
    setItems((prev) => [...prev, item])
    toast(`${item.symbol} added to watchlist`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="divide-y">
          {items.map((w) => {
            const positive = w.dayChange >= 0
            return (
              <div
                key={w.id}
                className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
              >
                {/* Logo + Symbol */}
                <Image
                  src={w.logo}
                  alt={w.name}
                  width={28}
                  height={28}
                  className="size-7 shrink-0 rounded-full"
                />
                <Badge variant="secondary" className="w-14 justify-center font-mono text-[11px]">
                  {w.symbol}
                </Badge>

                {/* Name */}
                <span className="min-w-0 flex-1 truncate text-sm">
                  {w.name}
                </span>

                {/* Mini sparkline */}
                <div className="hidden sm:block w-[80px] h-[30px]">
                  <LineChart
                    width={80}
                    height={30}
                    data={w.sparklineData.map((v, i) => ({ i, v }))}
                  >
                    <Line
                      {...chartAnimation}
                      type="monotone"
                      dataKey="v"
                      stroke={positive ? "var(--color-emerald-500)" : "var(--color-rose-500)"}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </div>

                {/* Price */}
                <span className="w-20 text-right text-sm font-medium tabular-nums">
                  <Money value={w.currentPrice} />
                </span>

                {/* Day change badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    "w-16 justify-center tabular-nums text-[11px]",
                    positive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400"
                  )}
                >
                  {positive ? "+" : ""}
                  {w.dayChange.toFixed(2)}%
                </Badge>

                {/* Remove on hover */}
                <button
                  onClick={() => removeItem(w.id)}
                  className="ml-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${w.symbol}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )
          })}

          {items.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Your watchlist is empty.
            </p>
          )}
        </div>

        <div className="px-4 pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" className="w-full gap-1.5" disabled={addable.length === 0} />}
            >
              <Plus className="size-3.5" />
              Add to Watchlist
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" className="w-56">
              {addable.map((w) => (
                <DropdownMenuItem key={w.id} onClick={() => addItem(w)}>
                  <span className="w-12 font-semibold">{w.symbol}</span>
                  <span className="truncate text-muted-foreground">{w.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
