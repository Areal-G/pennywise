"use client"

import * as React from "react"

// Demo profile for the signed-in user. Kept in memory like the rest of the demo
// data, so a refresh restores the defaults.

export const AVATAR_COLORS = {
  violet: "from-indigo-500 to-fuchsia-500",
  ocean: "from-sky-400 to-indigo-600",
  sunset: "from-amber-400 to-rose-500",
  forest: "from-emerald-400 to-teal-600",
  berry: "from-pink-500 to-violet-600",
  graphite: "from-zinc-500 to-zinc-800",
} as const

export type AvatarColor = keyof typeof AVATAR_COLORS

export type Profile = {
  name: string
  email: string
  phone: string
  location: string
  occupation: string
  avatarColor: AvatarColor
}

export const DEFAULT_PROFILE: Profile = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  phone: "+1 (555) 014-2290",
  location: "San Francisco, CA",
  occupation: "Product Designer",
  avatarColor: "violet",
}

/** Static demo facts shown on the profile */
export const PROFILE_FACTS = {
  memberSince: "March 2023",
  plan: "Free",
  customerId: "PW-204871",
}

let profile: Profile = DEFAULT_PROFILE
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => profile
const getServerSnapshot = () => DEFAULT_PROFILE

export function useProfile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export const profileActions = {
  update(patch: Partial<Profile>) {
    profile = { ...profile, ...patch }
    emit()
  },
  reset() {
    profile = DEFAULT_PROFILE
    emit()
  },
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0][0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : ""
  return (first + last).toUpperCase()
}
