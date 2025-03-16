"use client"

import * as React from "react"

// Demo profile for the signed-in user. Saved in localStorage like the rest of
// the demo data; the server and first client render use the defaults, so there
// is no hydration mismatch.

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

const STORAGE_KEY = "pennywise-profile-v1"

let profile: Profile = DEFAULT_PROFILE
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as Partial<Profile>
    const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v : fallback)
    profile = {
      name: str(saved.name, DEFAULT_PROFILE.name),
      email: str(saved.email, DEFAULT_PROFILE.email),
      phone: str(saved.phone, DEFAULT_PROFILE.phone),
      location: str(saved.location, DEFAULT_PROFILE.location),
      occupation: str(saved.occupation, DEFAULT_PROFILE.occupation),
      avatarColor:
        typeof saved.avatarColor === "string" && saved.avatarColor in AVATAR_COLORS
          ? (saved.avatarColor as AvatarColor)
          : DEFAULT_PROFILE.avatarColor,
    }
  } catch {
    // Blocked or corrupt storage: keep the defaults
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  load()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => {
  load()
  return profile
}
const getServerSnapshot = () => DEFAULT_PROFILE

export function useProfile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export const profileActions = {
  update(patch: Partial<Profile>) {
    load()
    profile = { ...profile, ...patch }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {
      // Storage full or blocked: the change still applies for this visit
    }
    emit()
  },
  reset() {
    profile = DEFAULT_PROFILE
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
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
