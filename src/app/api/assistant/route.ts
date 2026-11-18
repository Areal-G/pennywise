// Demo build: no external AI service. The page asks this route whether live
// answers are available and falls back to the offline responder
// (src/lib/assistant.ts), which answers from the in-memory sample data.

export function GET() {
  return Response.json({ live: false, model: null })
}
