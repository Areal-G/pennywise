"use client"

import { cn } from "@/lib/utils"
import type { CardData } from "@/data/seed"
import { Money } from "@/components/money"
import { PaymentCard } from "@/components/cards/card-art"

interface CardListProps {
  cards: CardData[]
  activeCardId: string
  onSelect: (id: string) => void
  holder: string
}

export function CardList({ cards, activeCardId, onSelect, holder }: CardListProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => {
        const isActive = card.id === activeCardId
        const pct = card.monthlyLimit > 0 ? Math.min(100, (card.monthlySpend / card.monthlyLimit) * 100) : 0
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            aria-pressed={isActive}
            aria-label={`${card.name} ending ${card.last4}${card.frozen ? ", frozen" : ""}`}
            className="group flex flex-col gap-2 rounded-2xl text-left outline-none"
          >
            <PaymentCard
              card={card}
              holder={holder}
              frozen={card.frozen}
              className={cn(
                "shadow-md transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            />
            <div className="space-y-1 px-0.5">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-medium">{card.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  <Money value={card.monthlySpend} decimals={0} />
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
