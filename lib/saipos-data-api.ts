import "server-only"

const SAIPOS_BASE_URL = "https://data.saipos.io/v1"
const SAIPOS_LIVE_DATE_COLUMN_FILTER = "created_at"
const SAIPOS_LIVE_LIMIT = 15
const SAIPOS_SYNC_LIMIT = 300
const SAIPOS_MAX_LIVE_PAGES = 1
const SAIPOS_REQUEST_TIMEOUT_MS = 15000
const SAIPOS_SYNC_REQUEST_TIMEOUT_MS = 60000
const MAX_SALES_DAYS = 15
const SAIPOS_RETRY_DELAYS_MS: number[] = []

export type SaiposSale = {
  id_store: number
  id_sale: number
  id_sale_type: number
  created_at: string
  updated_at: string
  shift_date: string
  canceled?: "Y" | "N" | string
  total_amount?: number
  total_discount?: number
  total_increase?: number
  total_amount_items?: number
  totals?: {
    total_amount?: number
    total_discount?: number
    total_increase?: number
    total_amount_items?: number
  }
  partner_sale?: {
    desc_store_partner?: string
    partner_status?: string
  } | null
  payments?: Array<{
    payment_amount?: number
    desc_store_payment_type?: string
  }>
}

export type SaiposSalesPeriod = {
  start: string
  end: string
}

type FetchSaiposPageOptions = {
  dateColumn: "shift_date" | "created_at" | "updated_at"
  limit: number
  timeoutMs: number
}

export type SaiposSalesResult =
  | {
      ok: true
      sales: SaiposSale[]
      truncated: boolean
    }
  | {
      ok: false
      sales: SaiposSale[]
      message: string
    }

function getSaiposToken() {
  const token = process.env.SAIPOS_DATA_API_TOKEN?.trim()
  if (!token) return null

  return token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`
}

function parseLocalDate(value: string, fallback: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return Number.isNaN(date.getTime()) ? fallback : date
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function diffDays(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())

  return Math.floor((endUtc - startUtc) / 86400000) + 1
}

export function getSaiposDefaultPeriod(): SaiposSalesPeriod {
  const today = new Date()
  const start = addDays(today, -6)

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(today),
  }
}

export function normalizeSaiposPeriod(searchParams: Record<string, string | string[] | undefined>): SaiposSalesPeriod {
  const defaultPeriod = getSaiposDefaultPeriod()
  const rawStart = Array.isArray(searchParams.start) ? searchParams.start[0] : searchParams.start
  const rawEnd = Array.isArray(searchParams.end) ? searchParams.end[0] : searchParams.end
  let start = parseLocalDate(rawStart ?? "", parseLocalDate(defaultPeriod.start, new Date()))
  let end = parseLocalDate(rawEnd ?? "", parseLocalDate(defaultPeriod.end, new Date()))

  if (start > end) {
    ;[start, end] = [end, start]
  }

  if (diffDays(start, end) > MAX_SALES_DAYS) {
    start = addDays(end, -(MAX_SALES_DAYS - 1))
  }

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  }
}

export function formatSaiposApiDate(value: string, endOfDay = false) {
  return `${value} ${endOfDay ? "23:59:59" : "00:00:00"}`
}

function readSaiposError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") {
    return payload.message
  }

  return fallback
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTransientSaiposError(status: number, message: string) {
  const normalized = message.toLowerCase()

  return (
    [429, 500, 502, 503, 504].includes(status) ||
    normalized.includes("timed out") ||
    normalized.includes("timeout") ||
    normalized.includes("connection pool")
  )
}

function normalizeSaiposErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes("aborted") || normalized.includes("nao respondeu")) {
    return "A Saipos nao respondeu em ate 15 segundos. Reduza o periodo ou tente novamente em um horario de menor movimento."
  }

  if (normalized.includes("connection pool") || normalized.includes("timed out") || normalized.includes("timeout")) {
    return "A Saipos demorou para responder ou ficou sem conexao disponivel no banco interno dela. Tente novamente em alguns instantes ou reduza o periodo."
  }

  return message
}

async function fetchSaiposPageOnce<T>(
  path: string,
  period: SaiposSalesPeriod,
  offset: number,
  options: FetchSaiposPageOptions
) {
  const token = getSaiposToken()
  if (!token) {
    throw new Error("Configure SAIPOS_DATA_API_TOKEN no ambiente do servidor.")
  }

  const params = new URLSearchParams({
    p_date_column_filter: options.dateColumn,
    p_filter_date_start: formatSaiposApiDate(period.start),
    p_filter_date_end: formatSaiposApiDate(period.end, true),
    p_limit: String(options.limit),
    p_offset: String(offset),
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs)
  let response: Response

  try {
    response = await fetch(`${SAIPOS_BASE_URL}${path}?${params.toString()}`, {
      headers: {
        Authorization: token,
        Accept: "application/json",
      },
      next: { revalidate: 300 },
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("A Saipos nao respondeu em ate 15 segundos.", { cause: error })
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  if (response.status === 404) return []

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = readSaiposError(body, `Saipos retornou HTTP ${response.status}.`)
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return Array.isArray(body) ? (body as T[]) : []
}

async function fetchSaiposPage<T>(
  path: string,
  period: SaiposSalesPeriod,
  offset: number,
  options: FetchSaiposPageOptions
) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= SAIPOS_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await fetchSaiposPageOnce<T>(path, period, offset, options)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Nao foi possivel consultar a Saipos agora.")
      const status = "status" in lastError && typeof lastError.status === "number" ? lastError.status : 0
      const retry = isTransientSaiposError(status, lastError.message) && attempt < SAIPOS_RETRY_DELAYS_MS.length

      if (!retry) break
      await wait(SAIPOS_RETRY_DELAYS_MS[attempt])
    }
  }

  throw lastError ?? new Error("Nao foi possivel consultar a Saipos agora.")
}

export async function fetchSaiposSales(period: SaiposSalesPeriod): Promise<SaiposSalesResult> {
  const sales: SaiposSale[] = []

  try {
    for (let pageNumber = 0; pageNumber < SAIPOS_MAX_LIVE_PAGES; pageNumber += 1) {
      const offset = pageNumber * SAIPOS_LIVE_LIMIT
      const page = await fetchSaiposPage<SaiposSale>("/search_sales", period, offset, {
        dateColumn: SAIPOS_LIVE_DATE_COLUMN_FILTER,
        limit: SAIPOS_LIVE_LIMIT,
        timeoutMs: SAIPOS_REQUEST_TIMEOUT_MS,
      })
      sales.push(...page)

      if (page.length < SAIPOS_LIVE_LIMIT) {
        return { ok: true, sales, truncated: false }
      }
    }

    return { ok: true, sales, truncated: true }
  } catch (error) {
    return {
      ok: false,
      sales,
      message:
        error instanceof Error
          ? normalizeSaiposErrorMessage(error.message)
          : "Nao foi possivel consultar a Saipos agora.",
    }
  }
}

export async function fetchSaiposSalesForSync({
  period,
  dateColumn = "shift_date",
  maxPages = 200,
}: {
  period: SaiposSalesPeriod
  dateColumn?: FetchSaiposPageOptions["dateColumn"]
  maxPages?: number
}) {
  const sales: SaiposSale[] = []

  for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
    const offset = pageNumber * SAIPOS_SYNC_LIMIT
    const page = await fetchSaiposPage<SaiposSale>("/search_sales", period, offset, {
      dateColumn,
      limit: SAIPOS_SYNC_LIMIT,
      timeoutMs: SAIPOS_SYNC_REQUEST_TIMEOUT_MS,
    })

    sales.push(...page)
    if (page.length < SAIPOS_SYNC_LIMIT) return { sales, truncated: false }
  }

  return { sales, truncated: true }
}

export function getSaiposSaleTotal(sale: SaiposSale) {
  return Number(sale.total_amount ?? sale.totals?.total_amount ?? 0)
}
