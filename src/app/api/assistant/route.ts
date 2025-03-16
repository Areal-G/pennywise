import Anthropic from "@anthropic-ai/sdk"

// "Ask Pennywise": streams Claude's answer when ANTHROPIC_API_KEY is set.
// Without a key the client uses its offline demo responder instead
// (src/lib/assistant.ts), so the demo works with no setup.

export const dynamic = "force-dynamic"

const MODEL = "claude-sonnet-5-5"
const MAX_TURNS = 20
const MAX_CHARS = 4000

const SYSTEM = `You are Pennywise, the friendly money assistant inside the Pennywise personal finance app.
You answer questions about the user's own finances using only the JSON snapshot of their data below the line.
- Ground every number in the snapshot. If something isn't in it, say you can't see that data yet.
- Amounts are in US dollars. Round sensibly and say which period a number covers (e.g. "last 30 days").
- Be concise: a short direct answer, then at most 4 bullet points ("- ") with specifics. Use **bold** for key numbers.
- Give practical, general budgeting suggestions where useful. You are not a licensed financial adviser: don't recommend specific investments, securities or trades.
- This is demo data for a sample user, so never ask for real account details.`

const live = () => Boolean(process.env.ANTHROPIC_API_KEY)

/** Lets the page say whether answers come from Claude or the offline demo */
export function GET() {
  return Response.json({ live: live(), model: live() ? MODEL : null })
}

type Body = {
  messages?: { role?: string; content?: string }[]
  facts?: unknown
}

export async function POST(req: Request) {
  if (!live()) return Response.json({ error: "offline" }, { status: 503 })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const messages: Anthropic.MessageParam[] = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content!.slice(0, MAX_CHARS) }))
  while (messages.length && messages[0].role !== "user") messages.shift()
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Send a question" }, { status: 400 })
  }
  const facts = JSON.stringify(body.facts ?? {}).slice(0, 40_000)

  const client = new Anthropic()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 2048,
          // Chat route: answer quickly, and let the server retry a declined request on its recommended model
          output_config: { effort: "low" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: `${SYSTEM}\n\n---\n${facts}`,
          messages,
        })
        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        const final = await response.finalMessage()
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\nSorry, I can't help with that one. Try asking about your spending, budgets, subscriptions or goals."))
        }
      } catch (error) {
        const message =
          error instanceof Anthropic.AuthenticationError
            ? "The Claude API key was rejected. Check ANTHROPIC_API_KEY."
            : error instanceof Anthropic.RateLimitError
              ? "Claude is busy right now. Please try again in a moment."
              : "Something went wrong reaching Claude. Please try again."
        controller.enqueue(encoder.encode(`\n\n${message}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })
}
