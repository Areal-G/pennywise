"use client"

import * as React from "react"
import { cardsData, type CardData } from "@/data/seed"
import type { CardTheme } from "@/lib/card-themes"

// Payment cards shared by the dashboard card stack and the Cards page.
// Kept in memory like the rest of the demo data, so a refresh restores the seed
// cards.

const seedCards = (): CardData[] => structuredClone(cardsData)

let cards: CardData[] = seedCards()
const serverCards = cards
const listeners = new Set<() => void>()

function commit(next: CardData[]) {
  cards = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCards() {
  return React.useSyncExternalStore(subscribe, () => cards, () => serverCards)
}

const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("")

/** A new card with random demo details (call from an event handler) */
export function createCard({
  name,
  type,
  theme,
  monthlyLimit,
}: {
  name: string
  type: CardData["type"]
  theme: CardTheme
  monthlyLimit?: number
}): CardData {
  const last4 = digits(4)
  return {
    id: `card-${Date.now()}`,
    name,
    type,
    last4,
    cardNumber: `${digits(4)} ${digits(4)} ${digits(4)} ${last4}`,
    holder: "",
    expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}/${String(new Date().getFullYear() + 3).slice(-2)}`,
    cvv: digits(3),
    network: Math.random() > 0.5 ? "visa" : "mastercard",
    frozen: false,
    dailyLimit: type === "virtual" ? 1000 : 2500,
    monthlySpend: 0,
    monthlyLimit: monthlyLimit && monthlyLimit > 0 ? monthlyLimit : type === "virtual" ? 3000 : 8000,
    theme,
  }
}

export const cardsActions = {
  add(card: CardData) {
    commit([...cards, card])
  },
  update(id: string, patch: Partial<CardData>) {
    commit(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  },
  reset() {
    commit(seedCards())
  },
}
