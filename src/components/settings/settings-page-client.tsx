"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { format, startOfMonth, subMonths } from "date-fns"
import { today } from "@/lib/mock"
import { CURRENCIES, currencySymbol, type Currency } from "@/lib/currency"
import { demoActions, useDemoStore, useMoney } from "@/lib/demo-store"
import { ResetDemoDialog } from "@/components/reset-demo-dialog"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserAvatar } from "@/components/user-avatar"
import {
  AVATAR_COLORS,
  PROFILE_FACTS,
  profileActions,
  useProfile,
  type AvatarColor,
  type Profile,
} from "@/lib/profile"
import {
  UserIcon,
  ShieldIcon,
  BellIcon,
  CreditCardIcon,
  PaletteIcon,
  MonitorIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  DownloadIcon,
  SmartphoneIcon,
  LaptopIcon,
  TabletIcon,
  SparklesIcon,
  RotateCcwIcon,
  DatabaseIcon,
  BadgeCheckIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
} from "lucide-react"

type TabId = "profile" | "security" | "notifications" | "billing" | "appearance" | "data"

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <UserIcon className="size-4" /> },
  { id: "security", label: "Security", icon: <ShieldIcon className="size-4" /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon className="size-4" /> },
  { id: "billing", label: "Billing", icon: <CreditCardIcon className="size-4" /> },
  { id: "appearance", label: "Appearance", icon: <PaletteIcon className="size-4" /> },
  { id: "data", label: "Demo data", icon: <DatabaseIcon className="size-4" /> },
]

// ── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const profile = useProfile()
  const { transactions, budgets, goals } = useDemoStore()

  const stats = [
    { label: "Transactions", value: transactions.length },
    { label: "Budgets", value: budgets.length },
    { label: "Savings goals", value: goals.length },
    { label: "Cards", value: 4 },
  ]

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="overflow-hidden pt-0">
        <div className="h-24 bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 sm:h-28" />
        <CardContent className="-mt-10 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <UserAvatar className="size-20 text-2xl ring-4 ring-card" />
              <div className="min-w-0 pb-1">
                <h2 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
                  <span className="truncate">{profile.name}</span>
                  <BadgeCheckIcon className="size-5 shrink-0 text-primary" aria-label="Verified" />
                </h2>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BriefcaseIcon className="size-3.5" />
                    {profile.occupation}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="size-3.5" />
                    {profile.location}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              <Badge variant="secondary">{PROFILE_FACTS.plan} plan</Badge>
              <Badge variant="outline" className="gap-1">
                <CalendarIcon className="size-3" />
                Since {PROFILE_FACTS.memberSince}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <MailIcon className="size-4 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <PhoneIcon className="size-4 shrink-0" />
              <span className="tabular-nums">{profile.phone}</span>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="size-4 shrink-0" />
              Customer ID <span className="font-mono text-foreground">{PROFILE_FACTS.customerId}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/60 px-3 py-2.5">
                <p className="text-lg font-semibold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form remounts when the saved profile changes (after load, save or reset) */}
      <ProfileForm key={JSON.stringify(profile)} profile={profile} />
    </div>
  )
}

const PROFILE_FIELDS: { key: Exclude<keyof Profile, "avatarColor">; label: string; type?: string }[] = [
  { key: "name", label: "Full name" },
  { key: "email", label: "Email address", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "location", label: "Location" },
  { key: "occupation", label: "Occupation" },
]

function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = React.useState<Profile>(profile)
  const [error, setError] = React.useState<string | null>(null)
  const dirty = JSON.stringify(form) !== JSON.stringify(profile)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError("Enter a name.")
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError("Enter a valid email address.")
    setError(null)
    profileActions.update({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      occupation: form.occupation.trim(),
    })
    toast("Profile saved", { description: "Saved in this browser for the demo.", variant: "success" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        <CardDescription>Changes are saved in this browser only.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UserAvatar className="size-14 text-lg" name={form.name || "?"} color={form.avatarColor} />
            <div className="space-y-2">
              <p className="text-sm font-medium">Avatar colour</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar colour">
                {(Object.keys(AVATAR_COLORS) as AvatarColor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={form.avatarColor === c}
                    aria-label={c}
                    onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                    className={cn(
                      "size-7 rounded-full bg-linear-to-br ring-offset-2 ring-offset-card transition-shadow",
                      AVATAR_COLORS[c],
                      form.avatarColor === c ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-border"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {PROFILE_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`profile-${f.key}`}>
                  {f.label}
                </label>
                <Input
                  id={`profile-${f.key}`}
                  type={f.type ?? "text"}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                profileActions.reset()
                toast("Profile reset", { description: "Back to the Alex Morgan demo profile." })
              }}
            >
              <RotateCcwIcon className="size-4" />
              Reset to demo profile
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" disabled={!dirty} onClick={() => setForm(profile)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Security Tab ─────────────────────────────────────────────────────────────

const mockSessions = [
  { device: "MacBook Pro", icon: <LaptopIcon className="size-4" />, location: "San Francisco, CA", lastActive: "Active now" },
  { device: "iPhone 15", icon: <SmartphoneIcon className="size-4" />, location: "San Francisco, CA", lastActive: "2 hours ago" },
  { device: "iPad Air", icon: <TabletIcon className="size-4" />, location: "New York, NY", lastActive: "3 days ago" },
]

function SecurityTab() {
  const [twoFA, setTwoFA] = React.useState(true)
  const [sessions, setSessions] = React.useState(mockSessions)

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="current-pw">
              Current Password
            </label>
            <Input id="current-pw" type="password" placeholder="Enter current password" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="new-pw">
                New Password
              </label>
              <Input id="new-pw" type="password" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirm-pw">
                Confirm Password
              </label>
              <Input id="confirm-pw" type="password" placeholder="Confirm new password" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() =>
                toast("Password updated", { description: "Use your new password next time you sign in." })
              }
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {twoFA ? "Enabled" : "Disabled"}
              </p>
              <p className="text-sm text-muted-foreground">
                {twoFA
                  ? "Your account is protected with 2FA"
                  : "Enable 2FA for enhanced security"}
              </p>
            </div>
            <Switch checked={twoFA} onCheckedChange={setTwoFA} />
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices logged into your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.device}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                  {s.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{s.device}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.location} &middot; {s.lastActive}
                  </p>
                </div>
              </div>
              {s.lastActive !== "Active now" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSessions((prev) => prev.filter((x) => x.device !== s.device))
                    toast("Session revoked", { description: `${s.device} has been signed out.` })
                  }}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Notifications Tab ────────────────────────────────────────────────────────

const notifToggles = [
  { id: "email", label: "Email Notifications", description: "Receive notifications via email", default: true },
  { id: "push", label: "Push Notifications", description: "Receive push notifications on your devices", default: true },
  { id: "transaction", label: "Transaction Alerts", description: "Get notified for every transaction", default: true },
  { id: "security", label: "Security Alerts", description: "Alerts for suspicious activity and logins", default: true },
  { id: "marketing", label: "Marketing Emails", description: "Receive product updates and offers", default: false },
  { id: "digest", label: "Weekly Digest", description: "A weekly summary of your account activity", default: true },
]

function NotificationsTab() {
  const [settings, setSettings] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(notifToggles.map((t) => [t.id, t.default]))
  )

  function toggle(id: string) {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose what notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {notifToggles.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg px-1 py-3"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </div>
            <Switch
              checked={settings[t.id]}
              onCheckedChange={() => toggle(t.id)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Billing Tab ──────────────────────────────────────────────────────────────

// Invoices are issued on the 1st of each of the last few months
const invoiceDate = (monthsAgo: number) =>
  format(startOfMonth(subMonths(today, monthsAgo)), "MMM dd, yyyy")

// Saves a plain-text copy of the invoice (there is no PDF backend in the demo)
function downloadInvoice(inv: { id: string; date: string; amount: string; status: string }) {
  const text = `Invoice ${inv.id}
Date: ${inv.date}
Plan: ${inv.status}
Amount: ${inv.amount}
`
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
  const a = Object.assign(document.createElement("a"), { href: url, download: `${inv.id}.txt` })
  a.click()
  URL.revokeObjectURL(url)
}

const invoices = [
  { date: invoiceDate(1), amount: 0, status: "Free Plan", id: "INV-001" },
  { date: invoiceDate(2), amount: 0, status: "Free Plan", id: "INV-002" },
  { date: invoiceDate(3), amount: 0, status: "Free Plan", id: "INV-003" },
]

const freeFeatures = [
  "1 bank account connection",
  "Basic transaction tracking",
  "Monthly budget tracking",
  "Standard support",
]

const proFeatures = [
  "Unlimited bank connections",
  "Advanced analytics & insights",
  "Unlimited virtual cards",
  "Priority support",
  "Custom budget categories",
  "Export to CSV & PDF",
]

function BillingTab() {
  const { format: fmt } = useMoney()
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the free plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Pennywise Free</h3>
                <Badge variant="secondary">Current</Badge>
              </div>
              <ul className="mt-3 space-y-1.5">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckIcon className="size-3.5 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">{fmt(0, { decimals: 0 })}</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-primary" />
                  <h4 className="font-semibold">Pennywise Pro</h4>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckIcon className="size-3.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">{fmt(12, { decimals: 0 })}</p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() =>
                  toast("Pro trial started", {
                    description: "Enjoy 14 days of Pro features. This demo doesn't charge your card.",
                  })
                }
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <CreditCardIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Visa ending in 4589</p>
                <p className="text-xs text-muted-foreground">Expires 09/28</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast("Payment method updates are disabled", {
                  description: "This is a demo account, so no card details are stored.",
                  variant: "info",
                })
              }
            >
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Download past invoices and receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell className="tabular-nums">{fmt(inv.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-xs" onClick={() => downloadInvoice({ ...inv, amount: fmt(inv.amount) })}>
                      <DownloadIcon className="size-3.5" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Appearance Tab ───────────────────────────────────────────────────────────

const emptySubscribe = () => () => {}

function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const { currency } = useDemoStore()
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false)

  const themes: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light", icon: <SunIcon className="size-5" /> },
    { id: "dark", label: "Dark", icon: <MoonIcon className="size-5" /> },
    { id: "system", label: "System", icon: <MonitorIcon className="size-5" /> },
  ]

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how Pennywise looks on your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 p-6 transition-all hover:bg-muted/50",
                theme === t.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              )}
            >
              {t.icon}
              <span className="text-sm font-medium">{t.label}</span>
              {mounted && theme === t.id && (
                <CheckIcon className="size-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Currency</CardTitle>
        <CardDescription>
          Show every amount in your preferred currency. Demo values are converted at fixed rates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Display currency">
          {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={currency === c}
              onClick={() => demoActions.setCurrency(c)}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all hover:bg-muted/50",
                currency === c ? "border-primary ring-2 ring-primary/20" : "border-border"
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-base font-semibold">
                {currencySymbol(c)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{c}</span>
                <span className="block text-xs text-muted-foreground">
                  {CURRENCIES[c].label}
                  {c !== "USD" && ` · $1 = ${currencySymbol(c)}${CURRENCIES[c].rate.toFixed(2)}`}
                </span>
              </span>
              {currency === c && <CheckIcon className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

// ── Demo data Tab ────────────────────────────────────────────────────────────

function DemoDataTab() {
  const { transactions, budgets, goals } = useDemoStore()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const stats = [
    { label: "Transactions", value: transactions.length },
    { label: "Budgets", value: budgets.length },
    { label: "Savings goals", value: goals.length },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo data</CardTitle>
        <CardDescription>
          Everything you add, edit or delete in Pennywise is saved in this browser only, so you can
          explore freely. Reset to start again with the sample data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <RotateCcwIcon className="size-3.5" />
            Reset demo data
          </Button>
        </div>
      </CardContent>
      <ResetDemoDialog open={confirmOpen} onOpenChange={setConfirmOpen} />
    </Card>
  )
}

// ── Main Settings Page ───────────────────────────────────────────────────────

export function SettingsPageClient() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const paramTab = tabs.some((t) => t.id === tabParam) ? (tabParam as TabId) : null
  const [activeTab, setActiveTab] = React.useState<TabId>(paramTab ?? "profile")
  // Follow ?tab= links (e.g. the user menu) while already on this page
  const [lastParamTab, setLastParamTab] = React.useState(paramTab)
  if (paramTab !== lastParamTab) {
    setLastParamTab(paramTab)
    if (paramTab) setActiveTab(paramTab)
  }

  const tabContent: Record<TabId, React.ReactNode> = {
    profile: <ProfileTab />,
    security: <SecurityTab />,
    notifications: <NotificationsTab />,
    billing: <BillingTab />,
    appearance: <AppearanceTab />,
    data: <DemoDataTab />,
  }

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Left nav (desktop) */}
      <nav className="hidden w-52 shrink-0 flex-col gap-1 lg:flex">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "justify-start gap-2",
              activeTab === tab.id && "font-semibold"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </nav>

      {/* Mobile tab bar */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:hidden">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            size="sm"
            className="shrink-0 gap-1.5 text-xs"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content — full width */}
      <div className="min-w-0 flex-1">{tabContent[activeTab]}</div>
    </div>
  )
}
