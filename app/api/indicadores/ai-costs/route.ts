import { NextResponse } from "next/server"
import { getCurrentUser, isAdminRole } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })

export async function GET() {
  const user = await getCurrentUser()
  if (
    !user ||
    user.mustChangePassword ||
    !isAdminRole(user.role) ||
    (user.role !== "ADMIN_MASTER" && !user.canAccessIndicators)
  )
    return json({ error: "Não autorizado." }, 401)
  const key = process.env.ANTHROPIC_ADMIN_KEY?.trim()
  if (!key) return json({ configured: false, amountUsd: null })
  const now = new Date()
  const startingAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const params = new URLSearchParams({
    starting_at: startingAt,
    ending_at: now.toISOString(),
    bucket_width: "1d",
    limit: "31",
  })
  let cents = 0
  const seen = new Set<string>()
  try {
    const signal = AbortSignal.timeout(15000)
    for (let page = 0; page < 100; page++) {
      const response = await fetch(`https://api.anthropic.com/v1/organizations/cost_report?${params}`, {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
        cache: "no-store",
        signal,
      })
      if (!response.ok) {
        const error =
          response.status === 401 || response.status === 403
            ? "A credencial administrativa não tem acesso aos custos. Peça ao administrador para verificar a chave e suas permissões."
            : response.status === 429
              ? "O limite de consultas de custos foi atingido. Aguarde alguns minutos e atualize."
              : "A Anthropic não disponibilizou os custos agora. Tente atualizar mais tarde."
        return json({ error }, 503)
      }
      const report = await response.json()
      if (!Array.isArray(report.data)) throw new Error("INVALID_REPORT")
      for (const bucket of report.data) {
        if (!Array.isArray(bucket.results)) throw new Error("INVALID_REPORT")
        for (const row of bucket.results) {
          if (row.currency !== "USD" || typeof row.amount !== "string" || !/^\d+(\.\d+)?$/.test(row.amount))
            throw new Error("INVALID_REPORT")
          cents += Number(row.amount)
          if (!Number.isFinite(cents)) throw new Error("INVALID_REPORT")
        }
      }
      if (report.has_more === false)
        return json({ configured: true, amountUsd: cents / 100, startingAt, updatedAt: now.toISOString() })
      if (!report.has_more || typeof report.next_page !== "string" || !report.next_page || seen.has(report.next_page))
        throw new Error("INVALID_REPORT")
      seen.add(report.next_page)
      params.set("page", report.next_page)
    }
    throw new Error("INCOMPLETE_REPORT")
  } catch {
    return json(
      {
        error:
          "Não foi possível consultar os custos completos da Anthropic. Tente novamente; se persistir, peça ao administrador para verificar a conexão e a integração.",
      },
      503
    )
  }
}
