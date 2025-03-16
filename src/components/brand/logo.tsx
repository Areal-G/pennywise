import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * Pennywise mark: a wise owl whose eyes are two pennies, on an
 * indigo → violet tile. Same artwork as src/app/icon.svg (the favicon).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const id = useId()
  const gradient = `pw-gradient-${id}`
  const shine = `pw-shine-${id}`
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("size-8 shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id={shine} x1="16" y1="0" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradient})`} />
      <rect width="32" height="18" rx="8" fill={`url(#${shine})`} />
      {/* Ear tufts */}
      <path d="M7 9.5 10.5 12M25 9.5 21.5 12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      {/* Coin eyes */}
      <circle cx="11.5" cy="16" r="5" fill="#fff" />
      <circle cx="20.5" cy="16" r="5" fill="#fff" />
      <circle cx="12.2" cy="16.4" r="2.1" fill="#312E81" />
      <circle cx="19.8" cy="16.4" r="2.1" fill="#312E81" />
      {/* Beak */}
      <path d="M14.4 21.6 16 24.4l1.6-2.8z" fill="#FCD34D" />
    </svg>
  )
}

/** Mark + wordmark */
export function Logo({
  className,
  markClassName,
  subtitle,
}: {
  className?: string
  markClassName?: string
  subtitle?: string
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="grid text-left leading-tight">
        <span className="truncate text-sm font-semibold tracking-tight">Pennywise</span>
        {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  )
}
