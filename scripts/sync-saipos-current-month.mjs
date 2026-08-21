#!/usr/bin/env node
import "dotenv/config"

const TIME_ZONE = "America/Sao_Paulo"
const DEFAULT_DATE_COLUMN = "shift_date"
const DEFAULT_RETRIES = 4
const DEFAULT_RETRY_DELAY_MS = 30000
const DEFAULT_DAY_DELAY_MS = 3000
const BOOLEAN_ARGS = new Set(["dry-run", "yesterday"])

function readArgs() {
  const args = process.argv.slice(2)
  const values = new Map()
  const positionals = []

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg.startsWith("--")) {
      positionals.push(arg)
      continue
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=")
    if (BOOLEAN_ARGS.has(rawKey)) {
      values.set(rawKey, "true")
      continue
    }

    const nextValue = inlineValue ?? args[index + 1]
    if (inlineValue === undefined && nextValue && !nextValue.startsWith("--")) index += 1
    values.set(rawKey, nextValue ?? "true")
  }

  values.set("_positionals", positionals)
  return values
}

function getBrazilDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
  }
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Data inválida: ${value}. Use YYYY-MM-DD.`)
  }

  return new Date(`${value}T00:00:00.000Z`)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function getDefaultRange() {
  const today = getBrazilDateParts(new Date())
  const todayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day))
  const end = addDays(todayUtc, -1)
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))

  return {
    start: formatDate(start),
    end: formatDate(end),
  }
}

function getYesterdayRange() {
  const today = getBrazilDateParts(new Date())
  const todayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day))
  const yesterday = formatDate(addDays(todayUtc, -1))

  return {
    start: yesterday,
    end: yesterday,
  }
}

function getConfig() {
  const args = readArgs()
  const positionals = args.get("_positionals")
  const range = args.has("yesterday") ? getYesterdayRange() : getDefaultRange()
  const baseUrl = (args.get("base-url") ?? process.env.SAIPOS_SYNC_BASE_URL ?? `http://localhost:${process.env.APP_PORT ?? 3000}`).replace(/\/$/, "")
  const secret = process.env.SAIPOS_SYNC_SECRET ?? process.env.CRON_SECRET

  if (!secret) {
    throw new Error("Configure SAIPOS_SYNC_SECRET ou CRON_SECRET no ambiente.")
  }

  return {
    baseUrl,
    secret,
    start: args.get("start") ?? positionals[0] ?? range.start,
    end: args.get("end") ?? positionals[1] ?? range.end,
    dateColumn: args.get("date-column") ?? DEFAULT_DATE_COLUMN,
    retries: Number(args.get("retries") ?? DEFAULT_RETRIES),
    retryDelayMs: Number(args.get("retry-delay-ms") ?? DEFAULT_RETRY_DELAY_MS),
    dayDelayMs: Number(args.get("day-delay-ms") ?? DEFAULT_DAY_DELAY_MS),
    dryRun: args.has("dry-run"),
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getSyncUrl(baseUrl, day, dateColumn) {
  const url = new URL("/api/admin/saipos/sync", baseUrl)
  url.searchParams.set("start", day)
  url.searchParams.set("end", day)
  url.searchParams.set("dateColumn", dateColumn)
  return url
}

async function syncDay({ baseUrl, secret, dateColumn }, day) {
  const url = getSyncUrl(baseUrl, day, dateColumn)
  const response = await fetch(url, {
    headers: {
      "x-saipos-sync-secret": secret,
      accept: "application/json",
    },
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? `HTTP ${response.status}`)
  }

  return payload
}

async function syncDayWithRetry(config, day) {
  for (let attempt = 1; attempt <= config.retries; attempt += 1) {
    try {
      const result = await syncDay(config, day)
      return { day, ok: true, attempt, result }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido."
      const lastAttempt = attempt === config.retries

      if (lastAttempt) {
        return { day, ok: false, attempt, message }
      }

      const delay = config.retryDelayMs * attempt
      console.log(`WARN ${day} tentativa ${attempt}/${config.retries}: ${message}. Retry em ${Math.round(delay / 1000)}s.`)
      await wait(delay)
    }
  }
}

async function main() {
  const config = getConfig()
  const start = parseDate(config.start)
  const end = parseDate(config.end)
  const results = []

  if (start > end) {
    throw new Error("A data inicial não pode ser maior que a data final.")
  }

  console.log(`Saipos sync ${config.start} -> ${config.end} (${config.dateColumn})`)
  console.log(`Base URL: ${config.baseUrl}`)
  console.log("Janela recomendada: a partir das 05:00 no horário de Brasília.")

  if (config.dryRun) {
    const days = []
    for (let current = start; current <= end; current = addDays(current, 1)) {
      days.push(formatDate(current))
    }
    console.log(`Dry run: ${days.join(", ")}`)
    return
  }

  for (let current = start; current <= end; current = addDays(current, 1)) {
    const day = formatDate(current)
    console.log(`SYNC ${day}`)
    const result = await syncDayWithRetry(config, day)
    results.push(result)

    if (result.ok) {
      console.log(`${result.result.status} fetched=${result.result.recordsFetched} upserted=${result.result.recordsUpserted}`)
      if (result.result.errorMessage) console.log(result.result.errorMessage)
    } else {
      console.log(`FAILED ${day} ${result.message}`)
    }

    await wait(config.dayDelayMs)
  }

  const failed = results.filter((result) => !result.ok)
  console.log(`Concluído: ${results.length - failed.length}/${results.length} dias sincronizados.`)

  if (failed.length > 0) {
    console.log(`Falharam: ${failed.map((result) => result.day).join(", ")}`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
