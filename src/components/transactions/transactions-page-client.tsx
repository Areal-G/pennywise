"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DownloadIcon, PlusIcon } from "lucide-react"

import type { FullTransaction } from "@/data/seed"
import { useFinanceStore } from "@/lib/finance-store"
import { convertFromUsd } from "@/lib/currency"
import { toast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { TransactionSummary } from "@/components/transactions/transaction-summary"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { TransactionTable } from "@/components/transactions/transaction-table"
import { TransactionActions } from "@/components/transactions/transaction-actions"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"

const PAGE_SIZE = 25

const csvCell = (v: string | number) => {
  if (typeof v === "number") return v.toFixed(2)
  // Quote text; neutralise spreadsheet formula injection in user-entered fields
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v
  return `"${safe.replace(/"/g, '""')}"`
}

export function TransactionsPageClient() {
  const { transactions, currency } = useFinanceStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FullTransaction | null>(null)

  // ?q= (from the command menu) seeds the search; ?new=1 opens the add dialog
  const q = searchParams.get("q")
  const wantsNew = searchParams.get("new") === "1"
  const [lastQ, setLastQ] = useState<string | null>(null)
  if (q !== lastQ) {
    setLastQ(q)
    if (q !== null) setSearch(q)
  }
  const [lastWantsNew, setLastWantsNew] = useState(false)
  if (wantsNew !== lastWantsNew) {
    setLastWantsNew(wantsNew)
    if (wantsNew) {
      setEditing(null)
      setDialogOpen(true)
    }
  }
  // Drop ?new=1 from the URL so a refresh doesn't reopen the dialog
  useEffect(() => {
    if (wantsNew) router.replace("/transactions")
  }, [wantsNew, router])

  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category))
    return Array.from(cats).sort()
  }, [transactions])

  const filteredData = useMemo(() => {
    let data: FullTransaction[] = transactions

    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          t.transactionId.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }
    if (categoryFilter !== "all") data = data.filter((t) => t.category === categoryFilter)
    if (statusFilter !== "all") data = data.filter((t) => t.status === statusFilter)
    if (typeFilter !== "all") data = data.filter((t) => t.type === typeFilter)
    return data
  }, [transactions, search, categoryFilter, statusFilter, typeFilter])

  // Back to the first page whenever the filters change
  const filterKey = `${search}|${categoryFilter}|${statusFilter}|${typeFilter}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    setVisible(PAGE_SIZE)
  }

  const hasFilters =
    search !== "" || categoryFilter !== "all" || statusFilter !== "all" || typeFilter !== "all"

  function clearFilters() {
    setSearch("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setTypeFilter("all")
  }

  function downloadCsv(rows: FullTransaction[], filename: string) {
    const header = ["Date", "Merchant", "Category", "Type", "Status", `Amount (${currency})`, "Transaction ID", "Notes"]
    const lines = rows.map((t) =>
      [
        t.date,
        t.merchant,
        t.category,
        t.type,
        t.status,
        Math.round(convertFromUsd(t.amount, currency) * 100) / 100,
        t.transactionId,
        t.notes ?? "",
      ]
        .map(csvCell)
        .join(",")
    )
    const csv = [header.map(csvCell).join(","), ...lines].join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast("CSV exported", {
      description: `${rows.length} transaction${rows.length === 1 ? "" : "s"} saved to ${filename}`,
      variant: "success",
    })
  }

  function openEditor(tx: FullTransaction | null) {
    setEditing(tx)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <TransactionSummary transactions={filteredData} />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <TransactionFilters
            search={search}
            setSearch={setSearch}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            categories={categories}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={filteredData.length === 0}
            onClick={() => downloadCsv(filteredData, "pennywise-transactions.csv")}
          >
            <DownloadIcon className="size-3.5" />
            Export CSV
            {hasFilters && (
              <span className="tabular-nums text-muted-foreground">({filteredData.length})</span>
            )}
          </Button>
          <Button onClick={() => openEditor(null)}>
            <PlusIcon className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      <TransactionTable
        transactions={filteredData.slice(0, visible)}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
        onEdit={openEditor}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        onAdd={() => openEditor(null)}
      />

      {filteredData.length > visible && (
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">
            Showing {visible} of {filteredData.length}
          </span>
          <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Show more
          </Button>
        </div>
      )}

      <TransactionActions
        selectedCount={selectedIds.size}
        onExport={() =>
          downloadCsv(
            transactions.filter((t) => selectedIds.has(t.id)),
            "pennywise-selected-transactions.csv"
          )
        }
        onClear={() => setSelectedIds(new Set())}
      />

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
        categories={categories}
      />
    </div>
  )
}
