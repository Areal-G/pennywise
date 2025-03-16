import { describe, expect, it } from "vitest"

import type { SavingsGoal } from "@/data/seed"
import {
  goalPlan,
  isUnused,
  monthlyCost,
  priceIncrease,
  subscriptionSummary,
  UNUSED_AFTER_DAYS,
  yearlyCost,
  type Subscription,
} from "@/lib/planning"

const sub = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: "t1",
  name: "Test",
  category: "Technology",
  amount: 10,
  cycle: "monthly",
  anchor: "Jan 01, 2026",
  lastUsedDaysAgo: 0,
  cardLast4: "0000",
  ...overrides,
})

const goal = (overrides: Partial<SavingsGoal> = {}): SavingsGoal => ({
  id: "g1",
  name: "Goal",
  targetAmount: 1000,
  currentAmount: 0,
  deadline: "Dec 2030",
  iconName: "piggy-bank",
  monthlyContribution: 100,
  ...overrides,
})

describe("subscription costs", () => {
  it("normalises monthly and yearly cycles", () => {
    expect(monthlyCost(sub({ amount: 120, cycle: "yearly" }))).toBe(10)
    expect(yearlyCost(sub({ amount: 10 }))).toBe(120)
  })

  it("only reports real price increases", () => {
    expect(priceIncrease(sub({ amount: 12, previousAmount: 10 }))).toBe(2)
    expect(priceIncrease(sub({ amount: 8, previousAmount: 10 }))).toBe(0)
    expect(priceIncrease(sub())).toBe(0)
  })

  it("flags subscriptions unused for the threshold period", () => {
    expect(isUnused(sub({ lastUsedDaysAgo: UNUSED_AFTER_DAYS }))).toBe(true)
    expect(isUnused(sub({ lastUsedDaysAgo: UNUSED_AFTER_DAYS - 1 }))).toBe(false)
  })

  it("summarises spend, unused services and yearly increase", () => {
    const summary = subscriptionSummary([
      sub({ amount: 10 }),
      sub({ id: "t2", amount: 120, cycle: "yearly", lastUsedDaysAgo: 90 }),
      sub({ id: "t3", amount: 15, previousAmount: 12 }),
    ])
    expect(summary.count).toBe(3)
    expect(summary.monthly).toBe(35)
    expect(summary.unusedYearly).toBe(120)
    expect(summary.increaseYearly).toBe(36)
  })
})

describe("goalPlan", () => {
  it("marks a funded goal as reached", () => {
    const plan = goalPlan(goal({ currentAmount: 1000 }))
    expect(plan.status).toBe("reached")
    expect(plan.remaining).toBe(0)
    expect(plan.percent).toBe(100)
  })

  it("needs a monthly contribution to have a plan", () => {
    expect(goalPlan(goal({ monthlyContribution: 0 })).status).toBe("no-plan")
  })

  it("is behind when contributions cannot reach the target in time", () => {
    const plan = goalPlan(goal({ targetAmount: 1_000_000, monthlyContribution: 1 }))
    expect(plan.status).toBe("behind")
    expect(plan.neededPerMonth).toBeGreaterThan(1)
  })
})
