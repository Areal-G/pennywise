import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  parse,
  startOfDay,
} from "date-fns"

// Seeded PRNG (mulberry32) so mock data is identical on the server and the
// client — Math.random() at render time causes hydration mismatches.
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The seed data was written as if "today" were this date. Every mock date is
// shifted by the distance from it to the real today so the data stays current.
const AUTHORED_TODAY = new Date(2026, 3, 13) // Apr 13, 2026

export const today = startOfDay(new Date())
const dayShift = differenceInCalendarDays(today, AUTHORED_TODAY)
const monthShift = differenceInCalendarMonths(today, AUTHORED_TODAY)

/** Shift an authored "MMM dd, yyyy" date to the same distance from today. */
export const shiftDay = (authored: string) =>
  format(addDays(parse(authored, "MMM dd, yyyy", AUTHORED_TODAY), dayShift), "MMM dd, yyyy")

/** Shift an authored "MMM yyyy" month label by whole months. */
export const shiftMonth = (authored: string) =>
  format(addMonths(parse(authored, "MMM yyyy", AUTHORED_TODAY), monthShift), "MMM yyyy")

/** Local YYYY-MM-DD (toISOString would convert to UTC and can shift the day). */
export const isoDay = (date: Date) => format(date, "yyyy-MM-dd")

/** Parse / format the "MMM dd, yyyy" dates used throughout the mock data */
export const parseDay = (value: string) => parse(value, "MMM dd, yyyy", today)
export const formatDay = (date: Date) => format(date, "MMM dd, yyyy")
