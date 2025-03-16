import { Suspense } from "react"
import { AssistantChat } from "@/components/assistant/assistant-chat"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Suspense>
        <AssistantChat />
      </Suspense>
    </div>
  )
}
