"use client"

import { useState, useSyncExternalStore } from "react"
import {
  DndContext,
  pointerWithin,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { GripVerticalIcon, LayoutGridIcon, LockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FinancialOverview } from "@/components/dashboard/financial-overview"
import { AccountCards } from "@/components/dashboard/account-cards"
import { QuickTransfer } from "@/components/dashboard/quick-transfer"
import { SpendingLimit } from "@/components/dashboard/spending-limit"
import { MoneyMovement } from "@/components/dashboard/money-movement"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { HealthScore } from "@/components/dashboard/health-score"
import { InsightCards } from "@/components/dashboard/insight-cards"
import { AskPennywiseWidget, UpcomingRenewalsWidget } from "@/components/dashboard/planning-widgets"

type WidgetSize = "sm" | "lg" | "full"

type Block = {
  id: string
  label: string
  size: WidgetSize
  component: React.ReactNode
}

const defaultBlocks: Block[] = [
  { id: "insights", label: "Insights", size: "full", component: <InsightCards /> },
  { id: "financial-overview", label: "Financial Overview", size: "lg", component: <FinancialOverview /> },
  { id: "account-cards", label: "My Cards", size: "sm", component: <AccountCards /> },
  { id: "transfer-spending", label: "Transfer & Spending", size: "sm", component: <div className="flex flex-col gap-4 [&>*]:flex-1"><QuickTransfer /><SpendingLimit /></div> },
  { id: "money-movement", label: "Money Movement", size: "sm", component: <MoneyMovement /> },
  { id: "health-score", label: "Financial Health", size: "sm", component: <HealthScore /> },
  { id: "ask-pennywise", label: "Ask Pennywise", size: "lg", component: <AskPennywiseWidget /> },
  { id: "upcoming-bills", label: "Upcoming Bills", size: "sm", component: <UpcomingRenewalsWidget /> },
  { id: "recent-transactions", label: "Recent Transactions", size: "full", component: <RecentTransactions /> },
]

const sizeClass: Record<WidgetSize, string> = {
  sm: "col-span-12 lg:col-span-4",
  lg: "col-span-12 lg:col-span-8",
  full: "col-span-12",
}

const STORAGE_KEY = "pennywise-dashboard-order"

// ── Null strategy: let CSS Grid handle layout, not dnd-kit transforms ──
const nullStrategy = () => null

function SortableWidget({
  block,
  editing,
}: {
  block: Block
  editing: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: block.id,
    disabled: !editing,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        sizeClass[block.size],
        "relative transition-opacity duration-200",
        isDragging && "opacity-30",
        editing && !isDragging && "rounded-xl ring-2 ring-dashed ring-primary/20",
      )}
    >
      {editing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 cursor-grab items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground shadow-md active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-3" />
          {block.label}
        </div>
      )}
      <div className={cn("h-full [&>*]:h-full", editing && "pointer-events-none select-none")}>
        {block.component}
      </div>
    </div>
  )
}

function orderBlocks(saved: string | null): Block[] {
  if (!saved) return defaultBlocks
  try {
    const order: unknown = JSON.parse(saved)
    if (!Array.isArray(order)) return defaultBlocks
    const reordered = order
      .map((id) => defaultBlocks.find((b) => b.id === id))
      .filter(Boolean) as Block[]
    // Blocks added since the order was saved go back to their default position
    const result = [...reordered]
    defaultBlocks.forEach((b, i) => {
      if (!result.includes(b)) result.splice(Math.min(i, result.length), 0, b)
    })
    return result
  } catch {
    return defaultBlocks
  }
}

function readSavedOrder() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeSavedOrder(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage unavailable: the layout still works for this visit
  }
}

const noopSubscribe = () => () => {}

export function DashboardCustomizer() {
  const [editing, setEditing] = useState(false)
  // Saved order is read after hydration (server and first client render use the default)
  const savedOrder = useSyncExternalStore(noopSubscribe, readSavedOrder, () => null)
  const [localBlocks, setLocalBlocks] = useState<Block[] | null>(null)
  const blocks = localBlocks ?? orderBlocks(savedOrder)
  const setBlocks = (update: (prev: Block[]) => Block[]) => setLocalBlocks(update(blocks))
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id)
      const newIndex = prev.findIndex((b) => b.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      const next = arrayMove(prev, oldIndex, newIndex)
      writeSavedOrder(JSON.stringify(next.map((b) => b.id)))
      return next
    })
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const handleReset = () => {
    setLocalBlocks(defaultBlocks)
    writeSavedOrder(null)
  }

  const activeBlock = blocks.find((b) => b.id === activeId)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Edit toggle */}
      <div className="flex items-center justify-end gap-2">
        {editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={handleReset}
          >
            Reset layout
          </Button>
        )}
        <Button
          variant={editing ? "default" : "outline"}
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setEditing(!editing)}
        >
          {editing ? (
            <>
              <LockIcon className="size-3" />
              Lock
            </>
          ) : (
            <>
              <LayoutGridIcon className="size-3" />
              Customize
            </>
          )}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={nullStrategy}
        >
          <div className="grid grid-cols-12 gap-4">
            {blocks.map((block) => (
              <SortableWidget
                key={block.id}
                block={block}
                editing={editing}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay — renders outside the grid, no distortion */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeBlock ? (
            <div className="rounded-xl bg-card p-4 shadow-2xl ring-2 ring-primary/30 rotate-[1deg] scale-[1.02]">
              <p className="text-sm font-medium text-muted-foreground">
                {activeBlock.label}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
