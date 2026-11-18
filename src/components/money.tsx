"use client"

import * as React from "react"
import { animate, useReducedMotion } from "motion/react"
import { useMoney } from "@/lib/finance-store"
import type { MoneyOptions } from "@/lib/currency"

type MoneyProps = MoneyOptions & {
  /** Amount in USD; converted to the visitor's display currency */
  value: number
  /** Count up from zero when first shown (skipped for reduced motion) */
  animated?: boolean
  className?: string
}

/** A formatted amount in the chosen display currency */
export function Money({ value, animated = false, className, ...opts }: MoneyProps) {
  const { format } = useMoney()
  const reduceMotion = useReducedMotion()
  // Counting value while the intro animation runs; null once it has finished
  const [counting, setCounting] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!animated || reduceMotion) return
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setCounting,
      onComplete: () => setCounting(null),
    })
    return () => {
      controls.stop()
      setCounting(null)
    }
    // Only count up once, on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <span className={className}>{format(counting ?? value, opts)}</span>
}

/** Recharts animation props that honour prefers-reduced-motion */
export function useChartAnimation() {
  const reduceMotion = useReducedMotion()
  return { isAnimationActive: !reduceMotion, animationDuration: 900 } as const
}
