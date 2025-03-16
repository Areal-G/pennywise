import {
  CarIcon,
  Gamepad2Icon,
  GiftIcon,
  GraduationCapIcon,
  HeartPulseIcon,
  HomeIcon,
  LaptopIcon,
  PalmtreeIcon,
  PiggyBankIcon,
  PlaneIcon,
  RepeatIcon,
  ShieldIcon,
  ShoppingBagIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react"

export const BUDGET_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  utensils: { icon: UtensilsIcon, label: "Food" },
  car: { icon: CarIcon, label: "Car" },
  "gamepad-2": { icon: Gamepad2Icon, label: "Games" },
  "shopping-bag": { icon: ShoppingBagIcon, label: "Shopping" },
  repeat: { icon: RepeatIcon, label: "Recurring" },
  "heart-pulse": { icon: HeartPulseIcon, label: "Health" },
  "graduation-cap": { icon: GraduationCapIcon, label: "Education" },
  plane: { icon: PlaneIcon, label: "Travel" },
  "palm-tree": { icon: PalmtreeIcon, label: "Holiday" },
  shield: { icon: ShieldIcon, label: "Safety net" },
  home: { icon: HomeIcon, label: "Home" },
  gift: { icon: GiftIcon, label: "Gifts" },
  laptop: { icon: LaptopIcon, label: "Tech" },
  "piggy-bank": { icon: PiggyBankIcon, label: "Savings" },
}

export const BUDGET_COLORS = [
  "text-orange-500",
  "text-blue-500",
  "text-purple-500",
  "text-pink-500",
  "text-cyan-500",
  "text-emerald-500",
  "text-amber-500",
  "text-rose-500",
]

export function BudgetIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const Icon = BUDGET_ICONS[name]?.icon ?? PiggyBankIcon
  return <Icon className={className} />
}
