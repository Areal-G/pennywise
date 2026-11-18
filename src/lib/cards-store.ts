"use client"

import * as React from "react"
import { cardsData, type CardData } from "@/data/seed"
import { isCardTheme, type CardTheme } from "@/lib/card-themes"

// Payment cards shared by the dashboard card stack and the Cards page.
// Saved in localStorage like the rest of the app data; the server and first
// client render use the seed cards, so there is no hydration mismatch.

const STORAGE_KEY = "pennywise-cards-v1"

let cards: CardData[] = structuredClone(cardsData)
const serverCards = cards
let loaded = false
const listeners = new Set<() => void>()

function isCard(v: unknown): v is CardData {
  if (!v || typeof v !== "object") return false
  const c = v as Partial<CardData>
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.last4 === "string" &&
    (c.network === "visa" || c.network === "mastercard") &&
    (c.type === "physical" || c.type === "virtual") &&
    isCardTheme(c.theme)
  )
}

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved: unknown = JSON.parse(raw)
    if (Array.isArray(saved) && saved.length > 0 && saved.every(isCard)) cards = saved
  } catch {
    // Blocked or corrupt storage: keep the seed cards
  }
}

function commit(next: CardData[]) {
  cards = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  } catch {
    // Storage full or blocked: the change still applies for this visit
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  load()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCards() {
  return React.useSyncExternalStore(
    subscribe,
    () => {
      load()
      return cards
    },
    () => serverCards
  )
}

const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("")

/** A new card with random sample details (call from an event handler) */
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
    load()
    commit([...cards, card])
  },
  update(id: string, patch: Partial<CardData>) {
    load()
    commit(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  },
}
