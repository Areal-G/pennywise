// Card colour themes shared by the dashboard card stack and the Cards page.

export const CARD_THEMES = {
  aurora: { label: "Aurora", className: "bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600" },
  midnight: { label: "Midnight", className: "bg-linear-to-br from-zinc-700 via-zinc-900 to-black" },
  ocean: { label: "Ocean", className: "bg-linear-to-br from-sky-500 via-blue-600 to-indigo-700" },
  lagoon: { label: "Lagoon", className: "bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700" },
  sunset: { label: "Sunset", className: "bg-linear-to-br from-orange-400 via-rose-500 to-pink-600" },
  ember: { label: "Ember", className: "bg-linear-to-br from-amber-400 via-orange-500 to-red-600" },
} as const

export type CardTheme = keyof typeof CARD_THEMES

export const isCardTheme = (v: unknown): v is CardTheme => typeof v === "string" && v in CARD_THEMES
