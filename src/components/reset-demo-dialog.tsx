"use client"

import { RotateCcwIcon } from "lucide-react"

import { demoActions } from "@/lib/demo-store"
import { profileActions } from "@/lib/profile"
import { cardsActions } from "@/lib/cards-store"
import { toast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function resetDemoData() {
  demoActions.reset()
  profileActions.reset()
  cardsActions.reset()
  toast("Demo data reset", {
    description: "Transactions, budgets, savings goals, cards and the profile are back to the sample data.",
    variant: "success",
  })
}

/** Confirm before wiping the visitor's edits */
export function ResetDemoDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset demo data?</DialogTitle>
          <DialogDescription>
            This removes the transactions, budgets, savings goals, cards and profile details you
            added or changed in this browser and restores the sample data. Your currency choice is kept.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetDemoData()
              onOpenChange(false)
            }}
          >
            <RotateCcwIcon className="size-3.5" />
            Reset demo data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
