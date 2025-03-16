"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CardData } from "@/data/seed"
import { Money } from "@/components/money"

interface CardControlsProps {
  card: CardData
  frozen: boolean
  onToggleFreeze: () => void
  dailyLimit: number
  onDailyLimitChange: (val: number) => void
}


export function CardControls({
  card,
  frozen,
  onToggleFreeze,
  dailyLimit,
  onDailyLimitChange,
}: CardControlsProps) {
  const spendPercent =
    card.monthlyLimit > 0
      ? Math.round((card.monthlySpend / card.monthlyLimit) * 100)
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Freeze Toggle ── */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Freeze card</p>
            <p
              className={cn(
                "text-xs",
                frozen ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {frozen ? "Frozen: new payments are blocked" : "Active"}
            </p>
          </div>
          <Switch
            aria-label="Freeze card"
            checked={frozen}
            onCheckedChange={(checked) => {
              if (checked !== frozen) onToggleFreeze()
            }}
          />
        </div>

        {/* ── Daily Limit ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Daily Limit</p>
            <span className="text-sm font-medium tabular-nums">
              <Money value={dailyLimit} decimals={0} />
            </span>
          </div>
          <Slider
            value={[dailyLimit]}
            min={0}
            max={10000}
            step={100}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value
              onDailyLimitChange(v)
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span><Money value={0} decimals={0} /></span>
            <span><Money value={10000} decimals={0} /></span>
          </div>
        </div>

        {/* ── Monthly Usage ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Monthly Usage</p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {spendPercent}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                spendPercent >= 90
                  ? "bg-destructive"
                  : spendPercent >= 70
                    ? "bg-amber-500"
                    : "bg-primary",
              )}
              style={{ width: `${Math.min(spendPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span><Money value={card.monthlySpend} decimals={0} /></span>
            <span><Money value={card.monthlyLimit} decimals={0} /></span>
          </div>
        </div>

        {/* ── Card Info ── */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Card Info</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={card.type === "virtual" ? "secondary" : "outline"}>
              {card.type}
            </Badge>
            <Badge variant="outline" className="uppercase">
              {card.network}
            </Badge>
            <span className="text-xs text-muted-foreground tabular-nums">
              **** {card.last4}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
