import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { normalizeSaiposPeriod } from "@/lib/saipos-data-api"
import { syncSaiposSales } from "@/lib/saipos-sync"

function getYesterdayPeriod() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const year = yesterday.getFullYear()
  const month = String(yesterday.getMonth() + 1).padStart(2, "0")
  const day = String(yesterday.getDate()).padStart(2, "0")
  const value = `${year}-${month}-${day}`

  return { start: value, end: value }
}

function hasValidSyncSecret(request: NextRequest) {
  const secret = (process.env.SAIPOS_SYNC_SECRET ?? process.env.CRON_SECRET)?.trim()
  if (!secret) return false

  const authorization = request.headers.get("authorization") ?? ""
  const headerSecret = request.headers.get("x-saipos-sync-secret") ?? ""

  return authorization === `Bearer ${secret}` || headerSecret === secret
}

function getOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined
}

async function runSyncRequest(request: NextRequest, body: Record<string, unknown>) {
  const user = await getCurrentUser()
  const authorized = (user?.role === "ADMIN" && !user.mustChangePassword) || hasValidSyncSecret(request)

  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const requestedPeriod =
    typeof body?.start === "string" || typeof body?.end === "string"
      ? normalizeSaiposPeriod({ start: getOptionalString(body.start), end: getOptionalString(body.end) })
      : getYesterdayPeriod()
  const dateColumn =
    body?.dateColumn === "created_at" || body?.dateColumn === "updated_at" || body?.dateColumn === "shift_date"
      ? body.dateColumn
      : "shift_date"

  const syncRun = await syncSaiposSales({
    period: requestedPeriod,
    dateColumn,
  })

  return NextResponse.json({
    ok: true,
    status: syncRun.status,
    recordsFetched: syncRun.recordsFetched,
    recordsUpserted: syncRun.recordsUpserted,
    startedAt: syncRun.startedAt,
    finishedAt: syncRun.finishedAt,
    errorMessage: syncRun.errorMessage,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return runSyncRequest(request, body)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  return runSyncRequest(request, {
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
    dateColumn: searchParams.get("dateColumn") ?? undefined,
  })
}
