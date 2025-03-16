"use client"

import * as React from "react"
import { CheckCircleIcon, InfoIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

type Toast = { id: number; title: string; description?: string; variant: "success" | "info" }

// Tiny module-level store so any component can call toast() without a provider
let toasts: Toast[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(title: string, opts: { description?: string; variant?: Toast["variant"] } = {}) {
  const id = Date.now() + Math.random()
  toasts = [...toasts, { id, title, description: opts.description, variant: opts.variant ?? "success" }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 3500)
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const noToasts: Toast[] = []

export function Toaster() {
  const items = React.useSyncExternalStore(subscribe, () => toasts, () => noToasts)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg"
          >
            {t.variant === "success" ? (
              <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            ) : (
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
