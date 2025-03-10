# 💸 pennywise 💸

*a personal finance dashboard that turns accounts, budgets and goals into answers* ✨

### 👋 hey

pennywise is a single-user finance workspace 🏦 day-to-day stuff (accounts, transactions, cards, transfers), the long view (analytics, investments, crypto) and now a planning section 📅 too. it runs on seeded data so there's zero setup 🙌 no database, no auth, no api keys.

#### 🔥 features 🔥

- 📊 dashboard with insight cards
- 🚨 spending spike alerts
- 💰 savings rate card
- 🏪 top merchant card
- ⚠️ budgets over limit card
- 🧩 drag-and-drop widgets (dnd-kit)
- ✏️ customize mode with saved order
- 🔍 transaction search
- 🎛️ transaction filters
- ↕️ expandable rows
- 📤 csv export of filtered or selected rows
- 🛡️ csv export escapes formula injection
- 💳 3d card flip
- 🧊 card freeze toggle
- 🚦 spending limits
- 🪪 virtual card generator
- 💸 quick transfers to saved contacts
- 🎯 savings goals with progress rings
- 📆 required monthly contribution
- 🏁 projected finish date
- 📈 on track / behind timeline
- 🔁 subscriptions detected from transactions
- 💵 monthly and yearly subscription cost
- 🗓️ next 30 days of renewals
- 📈 price increase alerts
- 😴 services unused for 30+ days
- ✂️ what cancelling would save
- 🌊 cash flow for 6 or 12 months
- 📉 savings-rate line
- 🧾 income sources
- 🗂️ spending by category
- 🧮 reconcile a card statement
- ✅ exact / suggested / unmatched matches
- 🔥 365-day spending heatmap
- 🍩 category donut
- 📅 month-over-month comparison
- 🔁 recurring-charge detector
- 💬 plain-language insights ("Transport costs dropped 13%")
- 📈 investments with allocation
- 〰️ sparklines
- ⏱️ simulated live ticker
- 🪙 crypto with candlesticks
- 🛒 crypto trade form
- 🤖 ask pennywise ai assistant
- 📴 offline assistant mode
- ⌨️ command palette (`Ctrl/⌘ + K`)
- 💱 USD / EUR / GBP switcher
- 🌗 light / dark / system themes
- 🌍 3d globe on sign in

## 🤖 ask pennywise

ask "where did my money go this month?" 🤔 and get an answer built from your own transactions, budgets and goals. with an `ANTHROPIC_API_KEY` a route handler streams claude's reply ⚡ without one, an offline responder computes the same answers locally 💻

##### 🔑 env

none needed!! 🎉 for live ai answers:

```sh
cp .env.example .env.local
```

then set `ANTHROPIC_API_KEY` 🔐 (server-side only, never reaches the browser)

# 🚀 running it 🚀

needs node 20+ 🟢 and pnpm 10 📦

```sh
pnpm install
pnpm dev
```

open http://localhost:3000 👀 you land on the dashboard as alex morgan 🙋

⚠️ on pnpm 11 run `pnpm approve-builds` once after install ⚠️

### 🧹 reset

reset the demo data from **settings → demo data** 🔄 or from the command palette ⌨️

### 🛠️ scripts

- 🏃 `pnpm dev` dev server on port 3000
- 🏗️ `pnpm build` production build
- ▶️ `pnpm start` serve the build
- 🧽 `pnpm lint` eslint
- 🔎 `pnpm exec tsc --noEmit` type check

###### 🧱 stack

- ▲ next.js 16.2 (app router, turbopack)
- ⚛️ react 19.2
- 🟦 typescript 5 strict
- 🎨 tailwind css 4
- 🧩 shadcn/ui on base ui 1.4
- 📊 recharts 3.8
- 🎬 motion 12
- 🧲 @dnd-kit/core 6, @dnd-kit/sortable 10
- 🌐 three 0.183, three-globe, @react-three/fiber
- 🤖 @anthropic-ai/sdk
- 📅 date-fns 4, react-day-picker 9

## 🧪 tests

no test suite yet 😅 `tsc --noEmit` and `pnpm lint` both pass with zero warnings ✅ ci runs type check, lint and build on every push 🔁

#### 🌍 deploy

vercel or any node host 🚢 `pnpm build && pnpm start` 🎉