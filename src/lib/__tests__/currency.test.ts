import { describe, expect, it } from "vitest"

import { convertFromUsd, convertToUsd, formatMoney, isCurrency } from "@/lib/currency"

describe("currency", () => {
  it("round-trips amounts through the display currency", () => {
    for (const c of ["USD", "EUR", "GBP"] as const) {
      expect(convertToUsd(convertFromUsd(1234.56, c), c)).toBeCloseTo(1234.56, 6)
    }
  })

  it("formats USD with two decimals by default", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50")
  })

  it("adds an explicit sign when asked", () => {
    expect(formatMoney(10, "USD", { sign: true })).toBe("+$10.00")
    expect(formatMoney(-10, "USD", { sign: true })).toBe("-$10.00")
  })

  it("guards unknown currency codes", () => {
    expect(isCurrency("EUR")).toBe(true)
    expect(isCurrency("JPY")).toBe(false)
    expect(isCurrency(42)).toBe(false)
  })
})
