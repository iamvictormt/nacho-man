import "server-only"

import { prisma } from "@/lib/prisma"
import {
  fetchSaiposSalesForSync,
  formatSaiposApiDate,
  getSaiposDefaultPeriod,
  getSaiposSaleTotal,
  type SaiposSale,
  type SaiposSalesPeriod,
} from "@/lib/saipos-data-api"

const businessTimeZone = "America/Sao_Paulo"

function amountToCents(value: number | undefined) {
  return Math.round(Number(value ?? 0) * 100)
}

function parseSaiposDate(value: string | undefined | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseShiftDate(value: string | undefined | null) {
  if (!value) return null
  const dateOnly = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return parseSaiposDate(value)
  return new Date(`${dateOnly}T00:00:00.000Z`)
}

function normalizeSaiposSale(sale: SaiposSale) {
  const createdAtSaipos = parseSaiposDate(sale.created_at)
  if (!createdAtSaipos) return null

  return {
    idStore: Number(sale.id_store),
    idSale: BigInt(sale.id_sale),
    idSaleType: Number(sale.id_sale_type),
    createdAtSaipos,
    updatedAtSaipos: parseSaiposDate(sale.updated_at),
    shiftDate: parseShiftDate(sale.shift_date),
    canceled: sale.canceled === "Y",
    totalAmountInCents: amountToCents(getSaiposSaleTotal(sale)),
    totalDiscountInCents: amountToCents(sale.total_discount ?? sale.totals?.total_discount),
    totalIncreaseInCents: amountToCents(sale.total_increase ?? sale.totals?.total_increase),
    totalAmountItemsInCents: amountToCents(sale.total_amount_items ?? sale.totals?.total_amount_items),
    paymentMethod: sale.payments?.[0]?.desc_store_payment_type?.trim() || null,
    partnerName: sale.partner_sale?.desc_store_partner?.trim() || null,
    partnerStatus: sale.partner_sale?.partner_status?.trim() || null,
    raw: sale as unknown as object,
    syncedAt: new Date(),
  }
}

export function getSaiposRecommendedSyncText(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: businessTimeZone,
    hour: "2-digit",
    minute: "2-digit",
  })

  return `Dados sincronizados pelo banco local. A atualização automática deve rodar diariamente a partir das 05:00 (Brasília). Agora: ${formatter.format(now)}.`
}

export async function syncSaiposSales({
  period = getSaiposDefaultPeriod(),
  dateColumn = "shift_date",
}: {
  period?: SaiposSalesPeriod
  dateColumn?: "shift_date" | "created_at" | "updated_at"
} = {}) {
  const run = await prisma.saiposSyncRun.create({
    data: {
      status: "RUNNING",
      dateColumn,
      periodStart: new Date(formatSaiposApiDate(period.start)),
      periodEnd: new Date(formatSaiposApiDate(period.end, true)),
    },
  })

  try {
    const result = await fetchSaiposSalesForSync({ period, dateColumn })
    let recordsUpserted = 0

    for (const sale of result.sales) {
      const data = normalizeSaiposSale(sale)
      if (!data) continue

      await prisma.saiposSale.upsert({
        where: {
          idStore_idSale: {
            idStore: data.idStore,
            idSale: data.idSale,
          },
        },
        update: data,
        create: data,
      })
      recordsUpserted += 1
    }

    return prisma.saiposSyncRun.update({
      where: { id: run.id },
      data: {
        status: result.truncated ? "PARTIAL" : "SUCCESS",
        recordsFetched: result.sales.length,
        recordsUpserted,
        errorMessage: result.truncated ? "A sincronização atingiu o limite de paginas configurado." : null,
        finishedAt: new Date(),
      },
    })
  } catch (error) {
    await prisma.saiposSyncRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Erro desconhecido ao sincronizar Saipos.",
        finishedAt: new Date(),
      },
    })

    throw error
  }
}

