import Link from "next/link"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-4 text-center">
      <LogoMark className="size-16 shadow-xl shadow-primary/25" title="Pennywise" />
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tabular-nums">404</h1>
        <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
      </div>
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Back to Dashboard
      </Button>
    </div>
  )
}
