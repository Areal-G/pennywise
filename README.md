# pennywise

*a personal finance dashboard. accounts, budgets, goals, one screen.*

next.js app that shows where the money went. runs on seeded sample data for now, so no database, no auth and no api keys. you open it and you're the sample user.

## what it does

- dashboard with insight cards (spending spikes, savings rate, top merchant)
- transactions: search, filters, csv export
- budgets and savings goals with progress rings
- analytics: spending heatmap + category donut
- cards with a freeze toggle and spending limits
- light / dark theme

edits to transactions, budgets and goals stick around in `localStorage`. clear it to get the seed back.

## running it

node 20+ and pnpm.

```sh
pnpm install
pnpm dev
```

open http://localhost:3000.

other stuff:

```sh
pnpm build
pnpm lint
```

no tests yet.