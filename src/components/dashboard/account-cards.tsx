"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { walletBalance } from "@/data/seed"
import { ArrowUpRightIcon, CheckCircle2Icon, CreditCardIcon, LoaderCircleIcon, PlusIcon, TrendingUpIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Money } from "@/components/money"
import { PaymentCard } from "@/components/cards/card-art"
import { cardsActions, createCard, useCards } from "@/lib/cards-store"
import { CARD_THEMES, type CardTheme } from "@/lib/card-themes"
import { useProfile } from "@/lib/profile"

type AddState = "idle" | "form" | "adding" | "success"
type NewCardType = "physical" | "virtual"

const CARD_TYPES: Record<NewCardType, string> = { physical: "Physical card", virtual: "Virtual card" }

/**
 * Stack order (last id = front card). Starts with the first card on top, keeps
 * the user's rotation, puts newly added cards on top and drops removed ones.
 */
function arrange(order: string[], ids: string[]) {
  if (order.length === 0) return [...ids].reverse()
  return [...order.filter((id) => ids.includes(id)), ...ids.filter((id) => !order.includes(id))]
}

/** Front card goes to the back */
const rotate = (ordered: string[]) =>
  ordered.length < 2 ? ordered : [ordered[ordered.length - 1], ...ordered.slice(0, -1)]

/** Dashboard "My cards": the same cards as the Cards page, stacked */
export function AccountCards() {
  const cards = useCards()
  const holder = useProfile().name.toUpperCase()
  const ids = cards.map((c) => c.id)

  // Stack order as card ids; the last id is the front card
  const [order, setOrder] = useState<string[]>(() => [...ids].reverse())
  const [addState, setAddState] = useState<AddState>("idle")
  const [newType, setNewType] = useState<NewCardType>("physical")
  const [newName, setNewName] = useState("")
  const [newTheme, setNewTheme] = useState<CardTheme>("ocean")

  // Cards added or removed (here, on the Cards page, or by a reset): update the stack
  const idsKey = ids.join("|")
  const [lastIdsKey, setLastIdsKey] = useState(idsKey)
  if (idsKey !== lastIdsKey) {
    setLastIdsKey(idsKey)
    setOrder((prev) => arrange(prev, ids))
  }

  const stack = order
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
  const front = stack[stack.length - 1]

  // Same as the original: every 2 seconds the front card moves to the back
  const cycle = useCallback(() => {
    setOrder((prev) => rotate(prev))
  }, [])

  useEffect(() => {
    if (addState !== "idle") return
    const id = setInterval(cycle, 2000)
    return () => clearInterval(id)
  }, [cycle, addState])

  const handleAdd = () => {
    setAddState("adding")
    setTimeout(() => {
      cardsActions.add(
        createCard({
          name: newName.trim() || (newType === "virtual" ? "Virtual Card" : "New Debit"),
          type: newType,
          theme: newTheme,
        })
      )
      setAddState("success")
      setTimeout(() => {
        setAddState("idle")
        setNewName("")
      }, 1500)
    }, 900)
  }

  const spentPct = front && front.monthlyLimit > 0 ? Math.min(100, (front.monthlySpend / front.monthlyLimit) * 100) : 0
  // Same stacking as the original animation: 48px spread, back cards up to 12% smaller
  const step = Math.min(48 / Math.max(stack.length - 1, 1), 16)

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <AnimatePresence mode="wait">
          {addState === "idle" ? (
            <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Stacked cards */}
              <div
                className="relative mx-auto w-full max-w-[360px]"
                style={{ paddingBottom: step * (stack.length - 1) }}
              >
                <div aria-hidden className="aspect-[1.586/1]" />
                {stack.map((c, stackPos) => {
                  const depth = stack.length - 1 - stackPos
                  const isFront = depth === 0
                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      onClick={cycle}
                      aria-label={`${c.name} card ending ${c.last4}. Show next card`}
                      layout
                      animate={{
                        y: stackPos * step,
                        scale: 1 - depth * (0.12 / Math.max(stack.length - 1, 1)),
                        zIndex: stackPos,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="absolute inset-x-0 top-0 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <PaymentCard
                        card={c}
                        holder={holder}
                        frozen={c.frozen}
                        className={cn(isFront ? "shadow-xl shadow-black/25" : "shadow-md")}
                      />
                    </motion.button>
                  )
                })}
              </div>

              {/* Front card details */}
              {front && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{front.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {front.frozen ? "Frozen" : CARD_TYPES[front.type]} · {CARD_THEMES[front.theme].label}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 gap-1 px-2 text-xs"
                      nativeButton={false}
                      render={<Link href={`/cards?card=${front.id}`} />}
                    >
                      Manage
                      <ArrowUpRightIcon className="size-3.5" />
                    </Button>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={false}
                      animate={{ width: `${spentPct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="flex justify-between text-xs tabular-nums text-muted-foreground">
                    <span>
                      <Money value={front.monthlySpend} decimals={0} /> spent
                    </span>
                    <span>
                      of <Money value={front.monthlyLimit} decimals={0} />
                    </span>
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="add-flow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex min-h-[260px] flex-col"
            >
              {addState === "success" ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <CheckCircle2Icon className="size-10 text-emerald-500" />
                  </motion.div>
                  <p className="text-sm font-semibold">Card added</p>
                  <p className="text-xs text-muted-foreground">It&apos;s on your Cards page too.</p>
                </div>
              ) : addState === "adding" ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                  <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Creating card…</p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Add a card</p>
                    <Button variant="ghost" size="icon" className="size-7" aria-label="Cancel adding card" onClick={() => setAddState("idle")}>
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                  <Select value={newType} items={CARD_TYPES} onValueChange={(v) => v && setNewType(v as NewCardType)}>
                    <SelectTrigger className="h-9 w-full text-xs" aria-label="Card type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical card</SelectItem>
                      <SelectItem value="virtual">Virtual card</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Card name (optional)"
                    aria-label="Card name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Card colour">
                    {(Object.keys(CARD_THEMES) as CardTheme[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={newTheme === t}
                        aria-label={CARD_THEMES[t].label}
                        title={CARD_THEMES[t].label}
                        onClick={() => setNewTheme(t)}
                        className={cn(
                          "h-6 w-9 rounded-md ring-offset-2 ring-offset-card transition-shadow",
                          CARD_THEMES[t].className,
                          newTheme === t ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-border"
                        )}
                      />
                    ))}
                  </div>
                  <Button className="mt-auto h-9 gap-2 text-xs" onClick={handleAdd}>
                    <PlusIcon className="size-3.5" />
                    Create card
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card count + add */}
        <div className="flex items-center justify-between">
          <Link href="/cards" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <CreditCardIcon className="size-3.5" />
            <span>{cards.length} cards</span>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="size-7 rounded-full"
            aria-label="Add card"
            onClick={() => addState === "idle" && setAddState("form")}
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </div>

        {/* Wallet balance */}
        <div className="space-y-1.5 border-t pt-5">
          <p className="text-xs font-medium text-muted-foreground">Wallet Balance</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            <Money value={walletBalance.amount} />
          </p>
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUpIcon className="size-4" />
            <span>+{walletBalance.changePercent}% this month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
