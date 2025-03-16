import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 lg:flex-row lg:gap-6" aria-busy="true" aria-label="Loading settings">
      <div className="flex gap-1 lg:w-52 lg:flex-col">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md lg:w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-4 rounded-xl p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>
      </div>
    </div>
  )
}
