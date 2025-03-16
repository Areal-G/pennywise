"use client"

import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { CardData } from "@/data/seed"
import { cardsActions, useCards } from "@/lib/cards-store"
import { useProfile } from "@/lib/profile"
import { InteractiveCard } from "@/components/cards/interactive-card"
import { CardControls } from "@/components/cards/card-controls"
import { VirtualCardGenerator } from "@/components/cards/virtual-card-generator"
import { CardList } from "@/components/cards/card-list"

export function CardsPageClient() {
  const cards = useCards()
  const holder = useProfile().name.toUpperCase()
  const searchParams = useSearchParams()

  // ?card=<id> (from the dashboard card stack) picks the card to show
  const cardParam = searchParams.get("card")
  const [activeCardId, setActiveCardId] = useState<string>(cardParam ?? cards[0].id)
  const [lastCardParam, setLastCardParam] = useState(cardParam)
  if (cardParam !== lastCardParam) {
    setLastCardParam(cardParam)
    if (cardParam) setActiveCardId(cardParam)
  }

  const activeCard = cards.find((c) => c.id === activeCardId) ?? cards[0]

  const toggleFreeze = useCallback(() => {
    cardsActions.update(activeCard.id, { frozen: !activeCard.frozen })
  }, [activeCard.id, activeCard.frozen])

  const handleDailyLimitChange = useCallback(
    (val: number) => cardsActions.update(activeCard.id, { dailyLimit: val }),
    [activeCard.id]
  )

  const handleCardCreated = useCallback((card: CardData) => {
    cardsActions.add(card)
    setActiveCardId(card.id)
  }, [])

  return (
    <div className="space-y-6">
      {/* Row 1: Interactive card + controls */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex items-start justify-center lg:col-span-7">
          <InteractiveCard key={activeCard.id} card={activeCard} frozen={activeCard.frozen} />
        </div>
        <div className="lg:col-span-5">
          <CardControls
            card={activeCard}
            frozen={activeCard.frozen}
            onToggleFreeze={toggleFreeze}
            dailyLimit={activeCard.dailyLimit}
            onDailyLimitChange={handleDailyLimitChange}
          />
        </div>
      </div>

      {/* Row 2: Virtual card generator + card list */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <VirtualCardGenerator onCardCreated={handleCardCreated} />
        </div>
        <div className="lg:col-span-8">
          <CardList cards={cards} activeCardId={activeCard.id} onSelect={setActiveCardId} holder={holder} />
        </div>
      </div>
    </div>
  )
}
