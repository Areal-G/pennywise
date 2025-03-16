import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type StatTile = {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: LucideIcon
  /** Tailwind text + background classes for the icon chip */
  tone?: "primary" | "positive" | "negative" | "warning" | "muted"
}

const toneClass: Record<NonNullable<StatTile["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  negative: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  muted: "bg-muted text-muted-foreground",
}

/** Row of summary numbers at the top of a planning page */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="flex items-start gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-4">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", toneClass[t.tone ?? "primary"])}>
            <t.icon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{t.label}</p>
            <p className="text-base font-semibold tracking-tight tabular-nums sm:text-lg">{t.value}</p>
            {t.hint && <p className="truncate text-[11px] text-muted-foreground">{t.hint}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
