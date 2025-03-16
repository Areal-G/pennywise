// Display currencies. All amounts in the app are stored in USD and converted at
// fixed demo rates when shown (no live exchange rates).
export const CURRENCIES = {
  USD: { label: "US Dollar", rate: 1, locale: "en-US" },
  EUR: { label: "Euro", rate: 0.92, locale: "en-IE" },
  GBP: { label: "British Pound", rate: 0.79, locale: "en-GB" },
} as const

export type Currency = keyof typeof CURRENCIES

export const isCurrency = (v: unknown): v is Currency =>
  typeof v === "string" && v in CURRENCIES

export type MoneyOptions = {
  /** Fraction digits (default 2) */
  decimals?: number
  /** Compact notation for axes and big numbers: $1.2K */
  compact?: boolean
  /** Prefix + / − (e.g. for income vs expense) */
  sign?: boolean
}

const cache = new Map<string, Intl.NumberFormat>()

function formatter(currency: Currency, { decimals = 2, compact = false, sign = false }: MoneyOptions) {
  const key = `${currency}|${decimals}|${compact}|${sign}`
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(CURRENCIES[currency].locale, {
      style: "currency",
      currency,
      signDisplay: sign ? "exceptZero" : "auto",
      // Compact (chart axes): €130K, $1.4M — converted ticks stay tidy
      ...(compact
        ? { notation: "compact", maximumSignificantDigits: 2 }
        : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    })
    cache.set(key, f)
  }
  return f
}

/** Convert a USD amount to the display currency */
export const convertFromUsd = (usd: number, currency: Currency) => usd * CURRENCIES[currency].rate

/** Convert an amount entered in the display currency back to USD for storage */
export const convertToUsd = (amount: number, currency: Currency) => amount / CURRENCIES[currency].rate

/** Format a USD amount in the display currency */
export const formatMoney = (usd: number, currency: Currency, opts: MoneyOptions = {}) =>
  formatter(currency, opts).format(convertFromUsd(usd, currency))

/** The currency symbol on its own, e.g. for input adornments */
export const currencySymbol = (currency: Currency) =>
  formatter(currency, { decimals: 0 })
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value ?? currency
