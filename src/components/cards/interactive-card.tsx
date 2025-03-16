"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import type { CardData } from "@/data/seed"
import { useProfile } from "@/lib/profile"
import { CARD_THEMES } from "@/lib/card-themes"
import { PaymentCard } from "@/components/cards/card-art"

interface InteractiveCardProps {
  card: CardData
  frozen: boolean
}

export function InteractiveCard({
  card,
  frozen,
}: InteractiveCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [cvvRevealed, setCvvRevealed] = useState(false)
  const holder = useProfile().name.toUpperCase()

  return (
    <div
      className="aspect-[1.586/1] w-full cursor-pointer sm:max-w-[420px]"
      role="button"
      tabIndex={0}
      aria-label={flipped ? "Show card front" : "Show card back and CVV"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setFlipped((f) => !f)
        }
      }}
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* ── Front Face ── */}
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
          <PaymentCard card={card} holder={holder} frozen={frozen} className="h-full shadow-xl shadow-black/20" />
        </div>

        {/* ── Back Face ── */}
        <div
          className={cn("absolute inset-0 flex flex-col overflow-hidden rounded-2xl text-white shadow-xl shadow-black/20 ring-1 ring-inset ring-white/15", CARD_THEMES[card.theme].className)}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Magnetic stripe */}
          <div className="mt-6 h-10 w-full bg-black/80" />

          <div className="flex flex-1 flex-col justify-between p-5 pt-4">
            {/* Signature + CVV area */}
            <div className="flex items-center gap-3">
              <div className="h-8 flex-1 rounded bg-white/25" />
              <div
                className="flex h-8 w-14 items-center justify-center rounded bg-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setCvvRevealed((r) => !r)
                }}
              >
                <AnimatePresence mode="wait">
                  {cvvRevealed ? (
                    <motion.span
                      key="cvv"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="font-mono text-sm font-bold text-zinc-900 tabular-nums"
                    >
                      {card.cvv}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="hidden"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="font-mono text-sm text-zinc-500"
                    >
                      ***
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <p className="text-xs text-white/70">
              Tap CVV box to reveal. Click card to flip back.
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  )
}
