export type PageSearchParams = Record<string, string | string[] | undefined>
export type SaiposPeriodMode = "day" | "week" | "month" | "year"

const businessTimeZone = "America/Sao_Paulo"

export function getSearchParam(searchParams: PageSearchParams, key: string) {
  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value
}

export function getPeriodMode(searchParams: PageSearchParams): SaiposPeriodMode {
  const value = getSearchParam(searchParams, "mode")
  return value === "day" || value === "week" || value === "month" || value === "year" ? value : "day"
}

export function toPeriodStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

export function toPeriodEnd(value: string) {
  return new Date(`${value}T23:59:59.999Z`)
}

export function addUtcDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function diffUtcDays(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())

  return Math.floor((endUtc - startUtc) / 86400000) + 1
}

export function toDateInputValue(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function toBrazilDateInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: businessTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

function parseDateParam(value: string | undefined, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback
  const date = toPeriodStart(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function parseMonthParam(value: string | undefined, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return fallback
  const date = new Date(`${value}-01T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function parseYearParam(value: string | undefined, fallback: Date) {
  if (!value || !/^\d{4}$/.test(value)) return fallback
  const date = new Date(`${value}-01-01T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function startOfUtcWeek(date: Date) {
  const day = date.getUTCDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1
  return addUtcDays(date, -daysSinceMonday)
}

function parseWeekParam(value: string | undefined, fallback: Date) {
  const match = value?.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return fallback

  const [, rawYear, rawWeek] = match
  const year = Number(rawYear)
  const week = Number(rawWeek)
  if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) return fallback

  const firstWeekStart = startOfUtcWeek(new Date(Date.UTC(year, 0, 4)))
  return addUtcDays(firstWeekStart, (week - 1) * 7)
}

export function toWeekInputValue(date: Date) {
  const day = date.getUTCDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1
  const thursday = addUtcDays(date, 3 - daysSinceMonday)
  const weekYear = thursday.getUTCFullYear()
  const firstThursday = addUtcDays(startOfUtcWeek(new Date(Date.UTC(weekYear, 0, 4))), 3)
  const week = Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000) + 1

  return `${weekYear}-W${String(week).padStart(2, "0")}`
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function endOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
}

function startOfUtcYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
}

function endOfUtcYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), 11, 31))
}

function minUtcDate(a: Date, b: Date) {
  return a < b ? a : b
}

export function buildPeriodFromMode(mode: SaiposPeriodMode, anchorDate: Date, maxDate: Date, equivalentDays?: number) {
  const date = minUtcDate(anchorDate, maxDate)

  if (mode === "day") {
    return {
      label: toDateInputValue(date).split("-").reverse().join("/"),
      start: toDateInputValue(date),
      end: toDateInputValue(date),
    }
  }

  if (mode === "week") {
    const start = startOfUtcWeek(date)
    const fullEnd = addUtcDays(start, 6)
    const equivalentEnd = equivalentDays ? addUtcDays(start, equivalentDays - 1) : fullEnd
    const end = minUtcDate(minUtcDate(fullEnd, equivalentEnd), maxDate)

    return {
      label: `${toDateInputValue(start).split("-").reverse().join("/")} a ${toDateInputValue(end).split("-").reverse().join("/")}`,
      start: toDateInputValue(start),
      end: toDateInputValue(end),
    }
  }

  if (mode === "month") {
    const start = startOfUtcMonth(date)
    const fullEnd = endOfUtcMonth(date)
    const equivalentEnd = equivalentDays ? addUtcDays(start, equivalentDays - 1) : fullEnd
    const end = minUtcDate(minUtcDate(fullEnd, equivalentEnd), maxDate)

    return {
      label: `${new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date)}${
        end < fullEnd ? ` até ${toDateInputValue(end).split("-").reverse().join("/")}` : ""
      }`,
      start: toDateInputValue(start),
      end: toDateInputValue(end),
    }
  }

  const start = startOfUtcYear(date)
  const fullEnd = endOfUtcYear(date)
  const equivalentEnd = equivalentDays ? addUtcDays(start, equivalentDays - 1) : fullEnd
  const end = minUtcDate(minUtcDate(fullEnd, equivalentEnd), maxDate)

  return {
    label: `${date.getUTCFullYear()}${end < fullEnd ? ` até ${toDateInputValue(end).split("-").reverse().join("/")}` : ""}`,
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  }
}

export function getSelectedAnchorDate(mode: SaiposPeriodMode, searchParams: PageSearchParams, fallback: Date) {
  if (mode === "day") return parseDateParam(getSearchParam(searchParams, "day") ?? getSearchParam(searchParams, "date"), fallback)
  if (mode === "week") return parseWeekParam(getSearchParam(searchParams, "week"), fallback)
  if (mode === "month") return parseMonthParam(getSearchParam(searchParams, "month"), fallback)
  return parseYearParam(getSearchParam(searchParams, "year"), fallback)
}

export function getComparisonAnchorDate(mode: SaiposPeriodMode, searchParams: PageSearchParams, fallback: Date) {
  if (mode === "day") return parseDateParam(getSearchParam(searchParams, "compareDay"), fallback)
  if (mode === "week") return parseWeekParam(getSearchParam(searchParams, "compareWeek"), fallback)
  if (mode === "month") return parseMonthParam(getSearchParam(searchParams, "compareMonth"), fallback)
  return parseYearParam(getSearchParam(searchParams, "compareYear"), fallback)
}

export function getPreviousPeriodAnchorDate(mode: SaiposPeriodMode, anchorDate: Date) {
  if (mode === "day") return addUtcDays(anchorDate, -1)
  if (mode === "week") return addUtcDays(anchorDate, -7)
  if (mode === "month") return new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() - 1, 1))
  return new Date(Date.UTC(anchorDate.getUTCFullYear() - 1, 0, 1))
}

function addUtcMonthsClamped(date: Date, months: number) {
  const targetYear = date.getUTCFullYear()
  const targetMonth = date.getUTCMonth() + months
  const targetMonthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const targetDay = Math.min(date.getUTCDate(), targetMonthEnd)

  return new Date(Date.UTC(targetYear, targetMonth, targetDay))
}

export function buildSamePeriodPreviousMonth(period: { start: string; end: string }) {
  const previousStart = addUtcMonthsClamped(toPeriodStart(period.start), -1)
  const days = diffUtcDays(toPeriodStart(period.start), toPeriodStart(period.end))
  const previousEnd = addUtcDays(previousStart, days - 1)

  return {
    label: `${toDateInputValue(previousStart).split("-").reverse().join("/")} a ${toDateInputValue(previousEnd)
      .split("-")
      .reverse()
      .join("/")}`,
    start: toDateInputValue(previousStart),
    end: toDateInputValue(previousEnd),
  }
}
