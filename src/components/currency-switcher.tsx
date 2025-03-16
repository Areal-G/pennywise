"use client"

import { demoActions, useDemoStore } from "@/lib/demo-store"
import { CURRENCIES, currencySymbol, isCurrency } from "@/lib/currency"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Display-currency picker (USD / EUR / GBP, fixed demo rates) */
export function CurrencySwitcher({ className, size = "sm" }: { className?: string; size?: "sm" | "default" }) {
  const { currency } = useDemoStore()
  return (
    <Select value={currency} onValueChange={(v) => isCurrency(v) && demoActions.setCurrency(v)}>
      <SelectTrigger size={size} aria-label="Display currency" className={cn("tabular-nums", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false} className="min-w-28">
        {(Object.keys(CURRENCIES) as (keyof typeof CURRENCIES)[]).map((c) => (
          <SelectItem key={c} value={c}>
            <span className="w-4 text-center text-muted-foreground">{currencySymbol(c)}</span>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
