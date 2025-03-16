"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { MotionConfig, motion } from "motion/react"

/**
 * Gentle fade/rise when moving between dashboard pages. MotionConfig makes every
 * motion animation inside honour the visitor's prefers-reduced-motion setting.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Skip the animation on the first load so server-rendered content shows at once
  const [firstPath] = React.useState(pathname)
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={pathname}
        initial={pathname === firstPath ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}
