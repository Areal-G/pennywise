import Image from "next/image"

import { cn } from "@/lib/utils"

/** Merchant logo, or a lettered tile for transactions added without one */
export function MerchantLogo({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string
  name: string
  size?: number
  className?: string
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-lg object-cover", className)}
        style={{ width: size, height: size }}
        unoptimized
      />
    )
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary",
        className
      )}
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </span>
  )
}
