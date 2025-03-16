"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import {
  ArrowUpIcon,
  PiggyBankIcon,
  RefreshCwIcon,
  RepeatIcon,
  SparklesIcon,
  SquareIcon,
  TargetIcon,
  TrendingUpIcon,
} from "lucide-react"

import { useDemoStore, useMoney } from "@/lib/demo-store"
import { buildFinanceFacts } from "@/lib/planning"
import { demoAnswer, SUGGESTED_PROMPTS } from "@/lib/assistant"
import { useProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LogoMark } from "@/components/brand/logo"
import { UserAvatar } from "@/components/user-avatar"

type ChatMessage = { id: string; role: "user" | "assistant"; content: string }

/** **bold** spans inside a line */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  )
}

/** Tiny renderer for the assistant's replies: paragraphs, "- " bullets and **bold** */
function Answer({ text }: { text: string }) {
  const blocks: React.ReactNode[] = []
  let bullets: string[] = []
  const flush = () => {
    if (!bullets.length) return
    blocks.push(
      <ul key={`ul${blocks.length}`} className="my-1.5 space-y-1 pl-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>
              <Inline text={b} />
            </span>
          </li>
        ))}
      </ul>
    )
    bullets = []
  }
  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*[-•*]\s+(.*)/)
    if (bullet) {
      bullets.push(bullet[1])
      continue
    }
    flush()
    if (line.trim()) {
      blocks.push(
        <p key={`p${blocks.length}`}>
          <Inline text={line.replace(/^#+\s*/, "")} />
        </p>
      )
    }
  }
  flush()
  return <div className="space-y-2">{blocks}</div>
}

const newMsgId = () => Math.random().toString(36).slice(2)

export function AssistantChat() {
  const { transactions, budgets, goals } = useDemoStore()
  const { format } = useMoney()
  const profile = useProfile()
  const reduceMotion = useReducedMotion()
  const searchParams = useSearchParams()

  const facts = React.useMemo(() => buildFinanceFacts(transactions, budgets, goals), [transactions, budgets, goals])
  const fmt = React.useCallback((usd: number) => format(usd, { decimals: Math.abs(usd) >= 100 ? 0 : 2 }), [format])

  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [live, setLive] = React.useState<boolean | null>(null)
  const stopRef = React.useRef<() => void>(() => {})
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d: { live?: boolean }) => !cancelled && setLive(Boolean(d.live)))
      .catch(() => !cancelled && setLive(false))
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" })
  }, [messages, reduceMotion])

  const append = (id: string, text: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: m.content + text } : m)))

  /** Reveal a scripted answer a few words at a time, like a streamed reply */
  const typeOut = (id: string, text: string) =>
    new Promise<void>((resolve) => {
      if (reduceMotion) {
        append(id, text)
        resolve()
        return
      }
      const tokens = text.match(/\S+\s*|\s+/g) ?? [text]
      let i = 0
      const timer = setInterval(() => {
        const chunk = tokens.slice(i, i + 3).join("")
        i += 3
        append(id, chunk)
        if (i >= tokens.length) {
          clearInterval(timer)
          resolve()
        }
      }, 28)
      stopRef.current = () => {
        clearInterval(timer)
        resolve()
      }
    })

  const send = async (question: string) => {
    const q = question.trim()
    if (!q || busy) return
    const user: ChatMessage = { id: newMsgId(), role: "user", content: q }
    const reply: ChatMessage = { id: newMsgId(), role: "assistant", content: "" }
    const history = [...messages, user]
    setMessages([...history, reply])
    setInput("")
    setBusy(true)
    try {
      if (live) {
        const controller = new AbortController()
        stopRef.current = () => controller.abort()
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), facts }),
          signal: controller.signal,
        })
        if (!res.ok || !res.body) throw new Error(String(res.status))
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          append(reply.id, decoder.decode(value, { stream: true }))
        }
      } else {
        // Short pause so it feels like a reply, then type it out
        await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 450))
        await typeOut(reply.id, demoAnswer(q, facts, fmt))
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        await typeOut(reply.id, demoAnswer(q, facts, fmt))
      }
    } finally {
      stopRef.current = () => {}
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  // ?q= from the dashboard widget: ask it once on arrival
  const asked = React.useRef(false)
  const initial = searchParams.get("q")
  React.useEffect(() => {
    if (!initial || asked.current || live === null) return
    asked.current = true
    void send(initial)
    // send is recreated each render; only react to the first status answer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, live])

  const over = facts.budgets.filter((b) => b.over).length
  const behind = facts.goals.filter((g) => g.status === "behind").length
  const glance = [
    { icon: TrendingUpIcon, label: "Spent, last 30 days", value: fmt(facts.last30Days.spending), href: "/transactions" },
    { icon: RepeatIcon, label: "Subscriptions / month", value: fmt(facts.subscriptions.monthlyTotal), href: "/subscriptions" },
    { icon: TargetIcon, label: "Budgets over limit", value: `${over} of ${facts.budgets.length}`, href: "/budgets" },
    { icon: PiggyBankIcon, label: "Goals behind schedule", value: `${behind} of ${facts.goals.length}`, href: "/goals" },
  ]

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="flex min-h-[560px] flex-col gap-0 overflow-hidden py-0 lg:h-[calc(100svh-9rem)]">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark className="size-9 shrink-0 rounded-xl shadow-sm shadow-primary/30" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Ask Pennywise</p>
              <p className="truncate text-xs text-muted-foreground">Answers from your accounts, budgets and goals</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {live !== null && (
              <Badge variant={live ? "default" : "secondary"} className="gap-1 text-[10px]">
                <SparklesIcon className="size-3" />
                {live ? "Claude Sonnet 5.5" : "Demo mode"}
              </Badge>
            )}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Start a new chat"
                disabled={busy}
                onClick={() => setMessages([])}
              >
                <RefreshCwIcon className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5" aria-live="polite">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SparklesIcon className="size-7" />
              </div>
              <h2 className="text-lg font-semibold">Hi {profile.name.split(" ")[0]}, what would you like to know?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask about your spending, subscriptions, budgets, goals or income.
              </p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-xl border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
                >
                  {m.role === "user" ? (
                    <UserAvatar className="size-8 shrink-0" name={profile.name} color={profile.avatarColor} />
                  ) : (
                    <LogoMark className="size-8 shrink-0 rounded-lg" />
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted/60 text-foreground/90"
                    )}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : m.content ? (
                      <Answer text={m.content} />
                    ) : (
                      <span className="flex gap-1 py-1.5" aria-label="Pennywise is thinking">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                            style={{ animationDelay: `${i * 120}ms` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <form
          className="border-t p-3"
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
        >
          <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring/40">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              rows={1}
              placeholder="Ask about your money…"
              aria-label="Ask Pennywise a question"
              className="max-h-32 min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            {busy ? (
              <Button type="button" size="icon" variant="secondary" className="size-9 shrink-0 rounded-xl" aria-label="Stop answer" onClick={() => stopRef.current()}>
                <SquareIcon className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="size-9 shrink-0 rounded-xl" aria-label="Send question" disabled={!input.trim()}>
                <ArrowUpIcon className="size-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {live === false ? "Demo answers computed from your sample data. " : ""}General guidance, not financial advice.
          </p>
        </form>
      </Card>

      <div className="hidden flex-col gap-4 lg:flex">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">What I can see</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {glance.map((g) => (
              <Link
                key={g.label}
                href={g.href}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <g.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-muted-foreground">{g.label}</span>
                  <span className="block text-sm font-semibold tabular-nums">{g.value}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-primary/10 via-card to-card">
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p className="text-sm font-semibold text-foreground">Try asking</p>
            {["How much did I spend on coffee?", "Can I afford a $1,200 laptop?", "Am I on track for my emergency fund?"].map((p) => (
              <button
                key={p}
                type="button"
                disabled={busy}
                onClick={() => send(p)}
                className="block w-full rounded-md text-left text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                “{p}”
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
