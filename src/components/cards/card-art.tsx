import { useId } from "react"
import { SnowflakeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { CARD_THEMES } from "@/lib/card-themes"
import { LogoMark } from "@/components/brand/logo"
import type { CardData } from "@/data/seed"

export type CardNetwork = CardData["network"]

/** Gold EMV chip */
export function CardChip({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 40 30" aria-hidden className={cn("h-6 w-8 shrink-0 drop-shadow-sm", className)}>
      <defs>
        <linearGradient id={`chip-${id}`} x1="0" y1="0" x2="40" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#FCD34D" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="39" height="29" rx="5" fill={`url(#chip-${id})`} stroke="#B45309" strokeOpacity="0.45" />
      <g stroke="#92400E" strokeOpacity="0.45" strokeWidth="1" fill="none">
        <path d="M0.5 10.5h11M0.5 19.5h11M28.5 10.5h11M28.5 19.5h11" />
        <rect x="11.5" y="6.5" width="17" height="17" rx="3" />
        <path d="M20 0.5v6M20 23.5v6" />
      </g>
    </svg>
  )
}

/** Contactless (NFC) waves */
export function ContactlessIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M8.5 8.5a5 5 0 0 1 0 7" />
      <path d="M12 6a8.5 8.5 0 0 1 0 12" />
      <path d="M15.5 3.5a12 12 0 0 1 0 17" />
    </svg>
  )
}

/** Card network mark, drawn for a coloured card background */
export function NetworkMark({ network, className }: { network: CardNetwork; className?: string }) {
  if (network === "mastercard") {
    return (
      <svg viewBox="0 0 38 24" role="img" aria-label="Mastercard" className={cn("h-6 w-auto", className)}>
        <circle cx="13" cy="12" r="10" fill="#EB001B" />
        <circle cx="25" cy="12" r="10" fill="#F79E1B" />
        <path d="M19 4a10 10 0 0 1 0 16a10 10 0 0 1 0-16z" fill="#FF5F00" />
      </svg>
    )
  }
  return (
    <span role="img" aria-label="Visa" className={cn("font-black italic leading-none tracking-tight text-white", className)}>
      VISA
    </span>
  )
}

/** Fine wavy "guilloche" lines, like the security print on real cards */
function CardPattern() {
  const lines = Array.from({ length: 11 }, (_, i) => {
    const y = 30 + i * 18
    return `M-20 ${y} C 70 ${y - 46}, 150 ${y + 46}, 230 ${y} S 380 ${y - 40}, 430 ${y + 6}`
  })
  return (
    <svg
      viewBox="0 0 400 252"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full opacity-[0.13] mix-blend-overlay"
    >
      <g fill="none" stroke="#fff" strokeWidth="1.1">
        {lines.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}

/**
 * The front of a Pennywise payment card. One design for every card in the app
 * (dashboard stack, Cards page, card list); it scales with its width using
 * container queries, so small cards drop the details that would not fit.
 */
export function PaymentCard({
  card,
  holder,
  frozen = false,
  className,
}: {
  card: CardData
  holder: string
  frozen?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "@container relative isolate aspect-[1.586/1] w-full overflow-hidden rounded-2xl text-white shadow-lg ring-1 ring-inset ring-white/15 select-none",
        CARD_THEMES[card.theme].className,
        className
      )}
    >
      {/* Art */}
      <CardPattern />
      <span aria-hidden className="pointer-events-none absolute -top-1/2 -right-1/4 aspect-square w-3/4 rounded-full bg-white/15 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-1/2 -left-1/4 aspect-square w-2/3 rounded-full bg-black/15 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-[6.5%]">
        {/* Bank + card name */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <LogoMark className="size-5 rounded-md ring-1 ring-white/30 @[300px]:size-6" />
            <span className="hidden text-xs font-semibold tracking-tight @[220px]:inline @[300px]:text-sm">
              Pennywise
            </span>
          </div>
          <span className="min-w-0 truncate rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium tracking-wide backdrop-blur-sm @[300px]:text-[11px]">
            {card.name}
          </span>
        </div>

        {/* Chip + contactless */}
        <div className="hidden items-center gap-2 @[200px]:flex">
          <CardChip className="h-6 w-8 @[300px]:h-8 @[300px]:w-11" />
          <ContactlessIcon className="size-4 opacity-80 @[300px]:size-5" />
          {card.type === "virtual" && (
            <span className="ml-auto text-[9px] font-semibold tracking-[0.2em] uppercase opacity-80 @[300px]:text-[10px]">
              Virtual
            </span>
          )}
        </div>

        {/* Number + holder + network */}
        <div className="space-y-1.5 @[300px]:space-y-2.5">
          <p className="font-mono text-[11px] tracking-[0.16em] tabular-nums [text-shadow:0_1px_1px_rgb(0_0_0/0.35)] @[260px]:text-sm @[300px]:text-base @[300px]:tracking-[0.2em]">
            <span className="hidden @[260px]:inline">•••• •••• •••• </span>
            <span className="@[260px]:hidden">•••• </span>
            {card.last4}
          </p>
          <div className="flex items-end justify-between gap-2">
            <div className="hidden min-w-0 @[220px]:block">
              <p className="truncate text-[9px] font-medium tracking-wider uppercase opacity-90 @[300px]:text-xs">
                {holder}
              </p>
              <p className="text-[7px] tracking-wider uppercase opacity-70 @[300px]:text-[9px]">
                Valid thru <span className="font-mono text-[9px] tabular-nums opacity-100 @[300px]:text-[11px]">{card.expiry}</span>
              </p>
            </div>
            <NetworkMark
              network={card.network}
              className={cn(
                "ml-auto shrink-0",
                card.network === "visa" ? "text-sm @[300px]:text-2xl" : "h-5 @[300px]:h-8"
              )}
            />
          </div>
        </div>
      </div>

      {/* Frozen */}
      {frozen && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-slate-900/45 backdrop-blur-[2px]">
          <SnowflakeIcon className="size-5 @[300px]:size-7" />
          <span className="text-[10px] font-semibold tracking-wider uppercase @[300px]:text-xs">Frozen</span>
        </div>
      )}
    </div>
  )
}
