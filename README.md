<div align="center">

# pennywise

*a personal finance dashboard that turns accounts, budgets and goals into answers.*
where the money went, what renews next, and whether you're on track.

![Next.js](https://img.shields.io/badge/Next.js-16.2-000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![Demo](https://img.shields.io/badge/demo-no_login_needed-4f46e5)

</div>

Pennywise is a single-user finance workspace. It covers the day-to-day (accounts, transactions, cards, transfers), the long view (analytics, investments, crypto) and a planning section for subscriptions, goals, cash flow and statement reconciliation.

Everything runs on a seeded data set, so there's nothing to set up: no database, no auth provider, no API keys. The root route opens the dashboard as the sample user, Alex Morgan.

Quick version:

```sh
pnpm install && pnpm dev
```

then open `http://localhost:3000`. No sign-up.

## What's in it

**Dashboard.** Drag-and-drop widgets with a Customize mode that remembers the order, plus insight cards for spending spikes, savings rate, top merchant and budgets over limit.

**Transactions.** Search, filters, expandable rows and CSV export of filtered or selected rows. The export escapes anything that looks like a spreadsheet formula.

**Cards and transfers.** 3D card flip, a freeze toggle, spending limits, a virtual card generator and quick transfers to saved contacts.

**Analytics.** A 365-day spending heatmap, a category donut, month-over-month comparison and plain-language insights like "Transport costs dropped 13%".

**Markets.** Investments with allocation and sparklines; crypto with candlesticks and a trade form.

**Power tools.** Command palette (`Ctrl/⌘ + K`), a USD/EUR/GBP switcher and light/dark/system themes.

Edits to transactions, budgets and goals are saved in `localStorage`. Reset them from **Settings → Demo data** or the command palette.

### Look and feel 🎨

One design system end to end: shadcn/ui primitives on Base UI, themed with OKLCH tokens in `globals.css`. Indigo-violet primary, near-white surfaces, Geist and Geist Mono, and a single `--radius` every corner derives from.

- **light and dark, both finished.** every token has a dark twin (deep indigo, not pure black), and charts read the same tokens
- **responsive by layout.** the sidebar collapses to a sheet, grids drop to one column, tables turn into stacked cards down to 375 px
- **motion that backs off.** count-ups, chart draw-ins and the chat's streaming dots all respect `prefers-reduced-motion`
- **keyboard and touch friendly.** icon buttons have `aria-label`s, and row actions show on focus and on touch screens, not only on hover
- **real states.** skeleton loaders, empty states with a next action, and a toast for every write

## Planning tools

The planning section is where the app stops being a list of numbers.

- **Subscriptions** – every recurring charge is detected from transactions. You get monthly and yearly cost, the next 30 days of renewals, price increases, and services unused for 30+ days with what cancelling would save.
- **Cash flow** – income against expenses for 6 or 12 months, with a savings-rate line, income sources and spending by category.
- **Goals** – progress rings, the monthly contribution you'd need, a projected finish date and an on track / behind timeline.
- **Reconcile** – a card statement matched line by line against transactions: exact, suggested or unmatched.

### Ask Pennywise 💬

Ask "Where did my money go this month?" and get an answer built from your own transactions, budgets and goals.

With an `ANTHROPIC_API_KEY`, a route handler streams Claude's reply. Without one, an offline responder computes the same answers locally, so the assistant always works in the demo. The key never reaches the browser.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| UI | React 19.2, TypeScript 5 (strict) |
| Components | shadcn/ui on Base UI 1.4, lucide-react, cmdk |
| Styling | Tailwind CSS 4, next-themes |
| Charts | Recharts 3.8 |
| Motion | Motion 12 |
| Drag and drop | @dnd-kit/core 6, @dnd-kit/sortable 10 |
| 3D | three 0.183, three-globe, @react-three/fiber |
| AI (optional) | @anthropic-ai/sdk |
| Dates | date-fns 4, react-day-picker 9 |

How it fits together: every page is client-rendered React on top of one seeded data module. A small store layers your edits over the seed, and pure functions in `src/lib/insights.ts` and `src/lib/planning.ts` derive everything else. The only server code is the optional assistant route.

A couple of decisions worth knowing about:

- the seed uses a seeded PRNG (mulberry32), so server and client render the same numbers and nothing hydrates wrong
- dates are written relative to "today" and shifted at runtime, so the demo never looks stale
- amounts stay in USD internally and only get converted at display time by `<Money>`
- every storage read is wrapped in `try/catch` and shape-checked, so a private window or corrupt JSON just falls back to the seed

## Run it locally

You need Node.js 20+ and pnpm 10. On pnpm 11, run `pnpm approve-builds` once after installing.

```sh
git clone <your-fork-url> pennywise
cd pennywise
pnpm install
pnpm dev
```

Open `http://localhost:3000`. You should land on the dashboard with insights, an overview chart and a stack of cards.

Want live AI answers? Optional:

```sh
cp .env.example .env.local
```

| Variable | Required | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Turns on Claude answers in Ask Pennywise. Server-side only. |

Scripts:

| Script | What it does |
|---|---|
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the build |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Type check |

Checks:

```sh
pnpm exec tsc --noEmit
pnpm lint
```

Both pass with zero warnings, and CI runs them plus a build on every push and pull request to `main`. No test suite yet; the pure functions in `src/lib/planning.ts` and `src/lib/insights.ts` are first in line for unit tests.

Deploying is plain Next.js: Vercel or any Node host with `pnpm build && pnpm start`.

## Project layout

```
src/
├── app/
│   ├── (auth)/              sign-in / sign-up with the 3D globe
│   ├── (dashboard)/         dashboard and every app page
│   └── api/assistant/       optional Claude streaming route
├── components/
│   ├── dashboard/           widgets and the drag-and-drop customizer
│   ├── planning/            subscriptions, goals, cash flow, reconcile
│   ├── assistant/           chat UI
│   └── ui/                  shadcn/ui primitives
├── data/seed.ts             sample user, accounts, transactions, holdings
└── lib/
    ├── demo-store.ts        persisted user edits
    ├── insights.ts          dashboard insight cards
    ├── planning.ts          subscription, goal and cash-flow maths
    ├── assistant.ts         offline assistant answers
    └── mock.ts              seeded PRNG and relative dates
```

Next up: unit tests for the insight and goal maths, a real Postgres + auth backend behind the same store interface, CSV/OFX import feeding Reconcile, and live FX rates.