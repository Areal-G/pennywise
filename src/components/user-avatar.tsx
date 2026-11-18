"use client"

import { cn } from "@/lib/utils"
import { AVATAR_COLORS, initials, useProfile, type AvatarColor } from "@/lib/profile"

/** The user's avatar: initials on a gradient (colour is picked in Settings → Profile) */
export function UserAvatar({
  className,
  name,
  color,
}: {
  className?: string
  /** Override the stored profile (e.g. to preview unsaved edits) */
  name?: string
  color?: AvatarColor
}) {
  const profile = useProfile()
  const shownName = name ?? profile.name
  const shownColor = color ?? profile.avatarColor
  return (
    <span
      role="img"
      aria-label={shownName}
      className={cn(
        "relative flex size-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-linear-to-br text-xs font-semibold text-white shadow-sm ring-2 ring-background",
        AVATAR_COLORS[shownColor],
        className
      )}
    >
      <span aria-hidden className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent" />
      <span className="relative">{initials(shownName)}</span>
    </span>
  )
}
