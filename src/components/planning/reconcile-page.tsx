"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import {
  AlertCircleIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  EyeOffIcon,
  FileTextIcon,
  LinkIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
} from "lucide-react"

import { financeActions, useFinanceStore, useMoney } from "@/lib/finance-store"
import { matchStatement, STATEMENT_CARD, STATEMENT_DAYS, statementLines, type Match } from "@/lib/planning"
import { today } from "@/lib/mock"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MerchantLogo } from "@/components/merchant-logo"
import { toast } from "@/components/ui/toaster"

type View = "review" | "done" | "all"

const titleCase = (s: string) =>
  s
    .replace(/\s\d{4,}$/, "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

export function ReconcilePage() {
  const { transactions } = useFinanceStore()
  const { format: money } = useMoney()
  const [view, setView] = React.useState<View>("review")
  const [confirmed, setConfirmed] = React.useState<Set<string>>(new Set())
  const [ignored, setIgnored] = React.useState<Set<string>>(new Set())

  const { matches, missing } = React.useMemo(() => matchStatement(statementLines, transactions), [transactions])
  const done = (m: Match) => confirmed.has(m.line.id) || ignored.has(m.line.id)
  const exactOpen = matches.filter((m) => m.kind === "exact" && !done(m))
  const reconciled = matches.filter(done).length
  const percent = Math.round((reconciled / matches.length) * 100)

  const statementTotal = statementLines.reduce((s, l) => s + l.amount, 0)
  const appTotal =
    matches.reduce((s, m) => s + (m.tx?.amount ?? 0), 0) + missing.reduce((s, t) => s + t.amount, 0)
  const difference = statementTotal - appTotal

  const rows = matches.filter((m) => (view === "review" ? !done(m) : view === "done" ? done(m) : true))

  const confirm = (...ids: string[]) =>
    setConfirmed((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })

  const acceptSuggested = (m: Match) => {
    if (!m.tx) return
    financeActions.saveTransaction({ ...m.tx, amount: m.line.amount, notes: m.tx.notes ?? "Amount corrected from bank statement" })
    confirm(m.line.id)
    toast("Match accepted", { description: `${m.tx.merchant} now shows the statement amount.` })
  }

  const addToApp = (m: Match) => {
    const income = m.line.amount > 0
    financeActions.saveTransaction({
      id: `rc_${m.line.id}`,
      merchant: titleCase(m.line.description),
      transactionId: `STM_${m.line.id.slice(-6).toUpperCase()}`,
      amount: m.line.amount,
      date: m.line.date,
      logo: "",
      category: income ? "Income" : "Fees",
      status: "completed",
      type: income ? "income" : "expense",
      notes: "Added from bank statement",
      cardLast4: STATEMENT_CARD,
    })
    confirm(m.line.id)
    toast("Added to transactions", { description: titleCase(m.line.description) })
  }

  const ignore = (id: string) => setIgnored((prev) => new Set(prev).add(id))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileTextIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">Main Debit •••• {STATEMENT_CARD} statement</p>
              <p className="text-sm text-muted-foreground">
                {format(subDays(today, STATEMENT_DAYS), "MMM d")} to {format(today, "MMM d, yyyy")} · {matches.length} lines
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">
                    {reconciled} of {matches.length} reconciled
                  </span>
                  <span className="tabular-nums text-muted-foreground">{percent}%</span>
                </div>
                <Progress value={percent} className="h-2" aria-label="Reconciliation progress" />
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-sm lg:w-[420px]">
            <div className="rounded-lg bg-muted/50 p-3">
              <dt className="text-xs text-muted-foreground">Statement</dt>
              <dd className="font-semibold tabular-nums">{money(statementTotal)}</dd>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <dt className="text-xs text-muted-foreground">Pennywise</dt>
              <dd className="font-semibold tabular-nums">{money(appTotal)}</dd>
            </div>
            <div className={cn("rounded-lg p-3", Math.abs(difference) < 0.005 ? "bg-emerald-500/10" : "bg-amber-500/10")}>
              <dt className="text-xs text-muted-foreground">Difference</dt>
              <dd
                className={cn(
                  "font-semibold tabular-nums",
                  Math.abs(difference) < 0.005 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                )}
              >
                {money(difference, { sign: true })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {percent === 100 && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          <CheckCircle2Icon className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          Every statement line is reconciled.
          {missing.length > 0 && ` ${missing.length} Pennywise ${missing.length === 1 ? "transaction is" : "transactions are"} still waiting to post.`}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Statement lines</CardTitle>
              <CardDescription>Each line is matched to a Pennywise transaction</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {exactOpen.length > 0 && (
                <Button size="sm" onClick={() => confirm(...exactOpen.map((m) => m.line.id))}>
                  <CheckCheckIcon className="size-3.5" />
                  Confirm {exactOpen.length} exact
                </Button>
              )}
              <Tabs value={view} onValueChange={(v) => setView(v as View)}>
                <TabsList>
                  <TabsTrigger value="review">To review</TabsTrigger>
                  <TabsTrigger value="done">Done</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {view === "review" ? "Nothing left to review." : "Nothing here yet."}
              </p>
            ) : (
              <ul className="divide-y">
                {rows.map((m) => (
                  <MatchRow
                    key={m.line.id}
                    m={m}
                    money={money}
                    state={confirmed.has(m.line.id) ? "confirmed" : ignored.has(m.line.id) ? "ignored" : "open"}
                    onConfirm={() => confirm(m.line.id)}
                    onAccept={() => acceptSuggested(m)}
                    onAdd={() => addToApp(m)}
                    onIgnore={() => ignore(m.line.id)}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Not on the statement</CardTitle>
              <CardDescription>In Pennywise but not posted by the bank yet</CardDescription>
            </CardHeader>
            <CardContent>
              {missing.length === 0 ? (
                <p className="text-sm text-muted-foreground">Everything in Pennywise appears on the statement.</p>
              ) : (
                <ul className="space-y-3">
                  {missing.map((t) => (
                    <li key={t.id} className="flex items-center gap-3">
                      <MerchantLogo src={t.logo} name={t.merchant} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.merchant}</p>
                        <p className="text-xs text-muted-foreground">{t.date} · likely still pending</p>
                      </div>
                      <span className="text-sm font-medium tabular-nums">{money(t.amount, { sign: true })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How matching works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-muted-foreground">
              <p className="flex gap-2">
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
                <span><span className="font-medium text-foreground">Exact</span>: same amount within 3 days of the purchase.</span>
              </p>
              <p className="flex gap-2">
                <SparklesIcon className="size-4 shrink-0 text-amber-500" />
                <span><span className="font-medium text-foreground">Suggested</span>: same merchant, amount a little different (tips, currency).</span>
              </p>
              <p className="flex gap-2">
                <AlertCircleIcon className="size-4 shrink-0 text-rose-500" />
                <span><span className="font-medium text-foreground">Unmatched</span>: fees or credits Pennywise never saw. Add them or ignore them.</span>
              </p>
              {(confirmed.size > 0 || ignored.size > 0) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => {
                    setConfirmed(new Set())
                    setIgnored(new Set())
                  }}
                >
                  <RotateCcwIcon className="size-3.5" />
                  Start over
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MatchRow({
  m,
  money,
  state,
  onConfirm,
  onAccept,
  onAdd,
  onIgnore,
}: {
  m: Match
  money: (usd: number, opts?: { sign?: boolean }) => string
  state: "open" | "confirmed" | "ignored"
  onConfirm: () => void
  onAccept: () => void
  onAdd: () => void
  onIgnore: () => void
}) {
  const badge =
    state === "confirmed"
      ? { label: "Reconciled", icon: CheckCircle2Icon, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" }
      : state === "ignored"
        ? { label: "Ignored", icon: EyeOffIcon, className: "bg-muted text-muted-foreground" }
        : m.kind === "exact"
          ? { label: "Exact match", icon: LinkIcon, className: "bg-primary/10 text-primary" }
          : m.kind === "suggested"
            ? { label: "Suggested", icon: SparklesIcon, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" }
            : { label: "Unmatched", icon: CircleDashedIcon, className: "bg-rose-500/10 text-rose-700 dark:text-rose-400" }

  return (
    <li className="flex flex-col gap-3 px-2 py-3 sm:flex-row sm:items-center">
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Bank · {m.line.date}</p>
          <p className="truncate font-mono text-xs">{m.line.description}</p>
          <p className="text-sm font-semibold tabular-nums">{money(m.line.amount, { sign: true })}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Pennywise</p>
          {m.tx ? (
            <div className="flex items-center gap-2">
              <MerchantLogo src={m.tx.logo} name={m.tx.merchant} size={24} />
              <div className="min-w-0">
                <p className="truncate text-sm">{m.tx.merchant}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {m.tx.date} · {money(m.tx.amount, { sign: true })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No matching transaction</p>
          )}
          {m.reason && state === "open" && <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">{m.reason}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:w-[190px] sm:flex-col sm:items-end">
        <Badge className={cn("gap-1 border-0 text-[10px]", badge.className)}>
          <badge.icon className="size-3" />
          {badge.label}
        </Badge>
        {state === "open" && (
          <div className="flex gap-1.5">
            {m.kind === "exact" && (
              <Button size="xs" variant="secondary" onClick={onConfirm}>
                Confirm
              </Button>
            )}
            {m.kind === "suggested" && (
              <Button size="xs" variant="secondary" onClick={onAccept}>
                Accept
              </Button>
            )}
            {m.kind === "none" && (
              <Button size="xs" variant="secondary" onClick={onAdd}>
                <PlusIcon className="size-3" />
                Add
              </Button>
            )}
            {m.kind !== "exact" && (
              <Button size="xs" variant="ghost" onClick={onIgnore}>
                Ignore
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
