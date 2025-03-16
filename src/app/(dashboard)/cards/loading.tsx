import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0" aria-busy="true" aria-label="Loading cards">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Card list */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        {/* Card preview + controls */}
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="aspect-[1.586] w-full max-w-sm rounded-2xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
