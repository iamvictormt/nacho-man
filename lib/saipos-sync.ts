import "server-only"

import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  fetchSaiposFinancialTransactionsForSync,
  fetchSaiposSaleItemsForSync,
  fetchSaiposSaleStatusHistoriesForSync,
  fetchSaiposSalesForSync,
  getSaiposDefaultPeriod,
  getSaiposSaleTotal,
  type SaiposFinancialTransaction,
  type SaiposSale,
  type SaiposSaleItem,
  type SaiposSaleItemsSale,
  type SaiposSalePayment,
  type SaiposSaleStatusHistoryEvent,
  type SaiposSaleStatusHistorySale,
  type SaiposSalesPeriod,
} from "@/lib/saipos-data-api"

const businessTimeZone = "America/Sao_Paulo"

function amountToCents(value: number | undefined) {
  return Math.round(Number(value ?? 0) * 100)
}

function amountToOptionalCents(value: number | undefined | null) {
  if (value === undefined || value === null) return 0
  return Math.round(Number(value) * 100)
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

function parseSaiposBoolean(value: unknown) {
  return value === true || value === "Y"
}

function normalizeOptionalString(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function normalizeProductKeyText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeIntegrationCode(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (typeof value === "string" && value.trim()) return value.trim()
  return null
}

function getSaiposProductKey(sale: SaiposSaleItemsSale, item: SaiposSaleItem) {
  const idStore = Number(sale.id_store)
  const integrationCode = normalizeIntegrationCode(item.integration_code)

  if (typeof item.id_store_item === "number") return `${idStore}:item:${item.id_store_item}`
  if (integrationCode) return `${idStore}:code:${normalizeProductKeyText(integrationCode)}`

  const nameKey = normalizeProductKeyText(item.desc_sale_item ?? "")
  return nameKey ? `${idStore}:name:${nameKey}` : null
}

function parsePeriodBoundary(value: string, endOfDay = false) {
  return new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}.000Z`)
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

function normalizeSaiposSaleItem(sale: SaiposSaleItemsSale, item: SaiposSaleItem) {
  if (!item.id_sale_item || !item.desc_sale_item?.trim()) return null

  return {
    idStore: Number(sale.id_store),
    idSale: BigInt(sale.id_sale),
    idSaleItem: BigInt(item.id_sale_item),
    idStoreItem: typeof item.id_store_item === "number" ? item.id_store_item : null,
    idStoreVariation: typeof item.id_store_variation === "number" ? item.id_store_variation : null,
    descSaleItem: item.desc_sale_item.trim(),
    quantity: Number(item.quantity ?? 0),
    unitPriceInCents: amountToCents(item.unit_price),
    deleted: parseSaiposBoolean(item.deleted),
    status: typeof item.status === "number" ? item.status : null,
    createdAtSaipos: parseSaiposDate(item.created_at),
    updatedAtSaipos: parseSaiposDate(item.updated_at),
    doneAt: parseSaiposDate(item.done_at),
    choices: item.choices ?? [],
    raw: item as unknown as object,
    syncedAt: new Date(),
  }
}

function normalizeSaiposSalePayment(sale: SaiposSale, payment: SaiposSalePayment, paymentIndex: number) {
  return {
    idStore: Number(sale.id_store),
    idSale: BigInt(sale.id_sale),
    paymentIndex,
    paymentAmountInCents: amountToOptionalCents(payment.payment_amount),
    paymentType: normalizeOptionalString(payment.desc_store_payment_type),
    changeForInCents: amountToOptionalCents(payment.change_for),
    createdAtSaipos: parseSaiposDate(payment.created_at),
    raw: payment as unknown as object,
    syncedAt: new Date(),
  }
}

function normalizeSaiposStatusHistory(sale: SaiposSaleStatusHistorySale, history: SaiposSaleStatusHistoryEvent) {
  if (!history.id_sale_status_history) return null

  return {
    idStore: Number(sale.id_store),
    idSale: BigInt(sale.id_sale),
    idSaleStatusHistory: BigInt(history.id_sale_status_history),
    statusOrder: typeof history.order === "number" ? history.order : null,
    statusDescription: normalizeOptionalString(history.desc_store_sale_status),
    durationTimeSeconds: typeof history.duration_time_seconds === "number" ? history.duration_time_seconds : null,
    cancellationReason: normalizeOptionalString(history.desc_cancellation_reason),
    userId: typeof history.user?.id_user === "number" ? history.user.id_user : null,
    userName: normalizeOptionalString(history.user?.full_name),
    userEmail: normalizeOptionalString(history.user?.email),
    userType: typeof history.user?.user_type === "number" ? history.user.user_type : null,
    authorizedByUserId: typeof history.authorized_by?.id_user === "number" ? history.authorized_by.id_user : null,
    authorizedByUserName: normalizeOptionalString(history.authorized_by?.full_name),
    authorizedByUserEmail: normalizeOptionalString(history.authorized_by?.email),
    authorizedByUserType: typeof history.authorized_by?.user_type === "number" ? history.authorized_by.user_type : null,
    createdAtSaipos: parseSaiposDate(history.created_at),
    raw: history as unknown as object,
    syncedAt: new Date(),
  }
}

function normalizeSaiposFinancialTransaction(transaction: SaiposFinancialTransaction) {
  if (!transaction.id_store_fin_transaction) return null

  return {
    idStore: Number(transaction.id_store),
    idStoreFinTransaction: BigInt(transaction.id_store_fin_transaction),
    amountInCents: amountToOptionalCents(transaction.amount),
    paid: parseSaiposBoolean(transaction.paid),
    recurring: parseSaiposBoolean(transaction.recurring),
    conciliated: parseSaiposBoolean(transaction.conciliated),
    installment: typeof transaction.installment === "number" ? transaction.installment : null,
    totalInstallments: typeof transaction.total_installments === "number" ? transaction.total_installments : null,
    providerTradeName: normalizeOptionalString(transaction.provider_trade_name),
    bankAccountDescription: normalizeOptionalString(transaction.desc_store_bank_account),
    paymentMethodDescription: normalizeOptionalString(transaction.desc_store_payment_method),
    transactionDescription: normalizeOptionalString(transaction.desc_store_fin_transaction),
    financialCategoryDescription: normalizeOptionalString(transaction.desc_store_category_financial),
    date: parseSaiposDate(transaction.date),
    paymentDate: parseSaiposDate(transaction.payment_date),
    issuanceDate: parseSaiposDate(transaction.issuance_date),
    createdAtSaipos: parseSaiposDate(transaction.created_at),
    updatedAtSaipos: parseSaiposDate(transaction.updated_at),
    children: (transaction.children ?? []) as Prisma.InputJsonValue,
    raw: transaction as unknown as object,
    syncedAt: new Date(),
  }
}

function normalizeSaiposProductReference(sale: SaiposSaleItemsSale, item: SaiposSaleItem) {
  const productKey = getSaiposProductKey(sale, item)
  const name = item.desc_sale_item?.trim()
  if (!productKey || !name) return null

  return {
    productKey,
    idStore: Number(sale.id_store),
    idStoreItem: typeof item.id_store_item === "number" ? item.id_store_item : null,
    idStoreVariation: typeof item.id_store_variation === "number" ? item.id_store_variation : null,
    integrationCode: normalizeIntegrationCode(item.integration_code),
    name,
    firstSeenAtSaipos: parseSaiposDate(item.created_at) ?? parseSaiposDate(sale.created_at),
    lastSeenAtSaipos: parseSaiposDate(item.updated_at) ?? parseSaiposDate(sale.updated_at) ?? parseSaiposDate(item.created_at),
    lastSoldAtSaipos: parseShiftDate(sale.shift_date) ?? parseSaiposDate(sale.created_at),
    raw: item as unknown as object,
    syncedAt: new Date(),
  }
}

type NormalizedSaiposProductReference = NonNullable<ReturnType<typeof normalizeSaiposProductReference>>

function earliestDate(first: Date | null, second: Date | null) {
  if (!first) return second
  if (!second) return first
  return first < second ? first : second
}

function latestDate(first: Date | null, second: Date | null) {
  if (!first) return second
  if (!second) return first
  return first > second ? first : second
}

function mergeProductReference(
  current: NormalizedSaiposProductReference | undefined,
  next: NormalizedSaiposProductReference
) {
  if (!current) return next

  return {
    ...current,
    idStoreItem: current.idStoreItem ?? next.idStoreItem,
    idStoreVariation: current.idStoreVariation ?? next.idStoreVariation,
    integrationCode: current.integrationCode ?? next.integrationCode,
    name: next.name || current.name,
    firstSeenAtSaipos: earliestDate(current.firstSeenAtSaipos, next.firstSeenAtSaipos),
    lastSeenAtSaipos: latestDate(current.lastSeenAtSaipos, next.lastSeenAtSaipos),
    lastSoldAtSaipos: latestDate(current.lastSoldAtSaipos, next.lastSoldAtSaipos),
    raw: next.raw,
    syncedAt: next.syncedAt,
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
  const periodStart = parsePeriodBoundary(period.start)
  const periodEnd = parsePeriodBoundary(period.end, true)
  const previousSuccess = await prisma.saiposSyncRun.findFirst({
    where: {
      status: "SUCCESS",
      dateColumn,
      periodStart,
      periodEnd,
    },
    orderBy: { finishedAt: "desc" },
  })
  const existingItemsInPeriod = await prisma.saiposSaleItem.count({
    where: {
      sale: {
        ...(dateColumn === "created_at"
          ? { createdAtSaipos: { gte: periodStart, lte: periodEnd } }
          : dateColumn === "updated_at"
            ? { updatedAtSaipos: { gte: periodStart, lte: periodEnd } }
            : { shiftDate: { gte: periodStart, lte: periodEnd } }),
      },
    },
  })
  const existingValidSalesInPeriod = await prisma.saiposSale.count({
    where: {
      canceled: false,
      ...(dateColumn === "created_at"
        ? { createdAtSaipos: { gte: periodStart, lte: periodEnd } }
        : dateColumn === "updated_at"
          ? { updatedAtSaipos: { gte: periodStart, lte: periodEnd } }
          : { shiftDate: { gte: periodStart, lte: periodEnd } }),
    },
  })

  const existingPaymentsInPeriod = await prisma.saiposSalePayment.count({
    where: {
      sale: {
        ...(dateColumn === "created_at"
          ? { createdAtSaipos: { gte: periodStart, lte: periodEnd } }
          : dateColumn === "updated_at"
            ? { updatedAtSaipos: { gte: periodStart, lte: periodEnd } }
            : { shiftDate: { gte: periodStart, lte: periodEnd } }),
      },
    },
  })
  const existingStatusHistoriesInPeriod = await prisma.saiposSaleStatusHistory.count({
    where: {
      sale: {
        ...(dateColumn === "created_at"
          ? { createdAtSaipos: { gte: periodStart, lte: periodEnd } }
          : dateColumn === "updated_at"
            ? { updatedAtSaipos: { gte: periodStart, lte: periodEnd } }
            : { shiftDate: { gte: periodStart, lte: periodEnd } }),
      },
    },
  })
  const periodLooksComplete =
    existingItemsInPeriod >= existingValidSalesInPeriod &&
    existingPaymentsInPeriod >= existingValidSalesInPeriod &&
    existingStatusHistoriesInPeriod >= existingValidSalesInPeriod

  if (dateColumn === "shift_date" && previousSuccess && periodLooksComplete) {
    return prisma.saiposSyncRun.create({
      data: {
        status: "SKIPPED",
        dateColumn,
        periodStart,
        periodEnd,
        recordsFetched: 0,
        recordsUpserted: 0,
        errorMessage: `Periodo ja sincronizado com sucesso em ${previousSuccess.finishedAt?.toISOString() ?? previousSuccess.startedAt.toISOString()}.`,
        finishedAt: new Date(),
      },
    })
  }

  const run = await prisma.saiposSyncRun.create({
    data: {
      status: "RUNNING",
      dateColumn,
      periodStart,
      periodEnd,
    },
  })

  try {
    const result = await fetchSaiposSalesForSync({ period, dateColumn })
    let recordsUpserted = 0
    let paymentRecordsUpserted = 0
    let itemRecordsUpserted = 0
    let statusRecordsUpserted = 0
    let financialRecordsUpserted = 0
    let productReferencesUpserted = 0
    let skippedItemRecords = 0
    let skippedStatusRecords = 0
    const endpointWarnings: string[] = []
    const truncatedEndpoints: string[] = []
    const saleExistsCache = new Map<string, boolean>()
    const productReferences = new Map<string, NormalizedSaiposProductReference>()

    for (const sale of result.sales) {
      const data = normalizeSaiposSale(sale)
      if (!data) continue
      const saleKey = `${data.idStore}:${data.idSale.toString()}`

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
      saleExistsCache.set(saleKey, true)
      recordsUpserted += 1

      for (const [paymentIndex, payment] of (sale.payments ?? []).entries()) {
        const paymentData = normalizeSaiposSalePayment(sale, payment, paymentIndex)
        await prisma.saiposSalePayment.upsert({
          where: {
            idStore_idSale_paymentIndex: {
              idStore: paymentData.idStore,
              idSale: paymentData.idSale,
              paymentIndex: paymentData.paymentIndex,
            },
          },
          update: paymentData,
          create: paymentData,
        })
        paymentRecordsUpserted += 1
      }
    }

    let itemResult: Awaited<ReturnType<typeof fetchSaiposSaleItemsForSync>> | null = null
    try {
      itemResult = await fetchSaiposSaleItemsForSync({ period, dateColumn })

      for (const sale of itemResult.sales) {
        for (const item of sale.items ?? []) {
          const data = normalizeSaiposSaleItem(sale, item)
          if (!data) continue
          const saleKey = `${data.idStore}:${data.idSale.toString()}`
          const saleExists =
            saleExistsCache.get(saleKey) ??
            Boolean(
              await prisma.saiposSale.findUnique({
                where: {
                  idStore_idSale: {
                    idStore: data.idStore,
                    idSale: data.idSale,
                  },
                },
                select: { id: true },
              })
            )

          saleExistsCache.set(saleKey, saleExists)

          if (!saleExists) {
            skippedItemRecords += 1
            continue
          }

          await prisma.saiposSaleItem.upsert({
            where: {
              idStore_idSaleItem: {
                idStore: data.idStore,
                idSaleItem: data.idSaleItem,
              },
            },
            update: data,
            create: data,
          })
          itemRecordsUpserted += 1

          const productReference = normalizeSaiposProductReference(sale, item)
          if (productReference) {
            productReferences.set(
              productReference.productKey,
              mergeProductReference(productReferences.get(productReference.productKey), productReference)
            )
          }
        }
      }
    } catch (error) {
      endpointWarnings.push(`Itens de venda: ${error instanceof Error ? error.message : "erro desconhecido"}`)
    }

    for (const productReference of productReferences.values()) {
      await prisma.saiposProductReference.upsert({
        where: { productKey: productReference.productKey },
        update: {
          idStoreItem: productReference.idStoreItem,
          idStoreVariation: productReference.idStoreVariation,
          integrationCode: productReference.integrationCode,
          name: productReference.name,
          firstSeenAtSaipos: productReference.firstSeenAtSaipos,
          lastSeenAtSaipos: productReference.lastSeenAtSaipos,
          lastSoldAtSaipos: productReference.lastSoldAtSaipos,
          raw: productReference.raw,
          syncedAt: productReference.syncedAt,
        },
        create: productReference,
      })
      productReferencesUpserted += 1
    }

    let statusResult: Awaited<ReturnType<typeof fetchSaiposSaleStatusHistoriesForSync>> | null = null
    try {
      statusResult = await fetchSaiposSaleStatusHistoriesForSync({ period, dateColumn })

      for (const sale of statusResult.sales) {
        for (const history of sale.histories ?? []) {
          const data = normalizeSaiposStatusHistory(sale, history)
          if (!data) continue
          const saleKey = `${data.idStore}:${data.idSale.toString()}`
          const saleExists =
            saleExistsCache.get(saleKey) ??
            Boolean(
              await prisma.saiposSale.findUnique({
                where: {
                  idStore_idSale: {
                    idStore: data.idStore,
                    idSale: data.idSale,
                  },
                },
                select: { id: true },
              })
            )

          saleExistsCache.set(saleKey, saleExists)

          if (!saleExists) {
            skippedStatusRecords += 1
            continue
          }

          await prisma.saiposSaleStatusHistory.upsert({
            where: {
              idStore_idSaleStatusHistory: {
                idStore: data.idStore,
                idSaleStatusHistory: data.idSaleStatusHistory,
              },
            },
            update: data,
            create: data,
          })
          statusRecordsUpserted += 1
        }
      }
    } catch (error) {
      endpointWarnings.push(`Histórico de status: ${error instanceof Error ? error.message : "erro desconhecido"}`)
    }

    let financialResult: Awaited<ReturnType<typeof fetchSaiposFinancialTransactionsForSync>> | null = null
    try {
      financialResult = await fetchSaiposFinancialTransactionsForSync({ period, dateColumn: "date" })

      for (const transaction of financialResult.transactions) {
        const data = normalizeSaiposFinancialTransaction(transaction)
        if (!data) continue

        await prisma.saiposFinancialTransaction.upsert({
          where: {
            idStore_idStoreFinTransaction: {
              idStore: data.idStore,
              idStoreFinTransaction: data.idStoreFinTransaction,
            },
          },
          update: data,
          create: data,
        })
        financialRecordsUpserted += 1
      }
    } catch (error) {
      endpointWarnings.push(`Lançamentos financeiros: ${error instanceof Error ? error.message : "erro desconhecido"}`)
    }

    if (result.truncated) truncatedEndpoints.push("vendas")
    if (itemResult?.truncated) truncatedEndpoints.push("itens")
    if (statusResult?.truncated) truncatedEndpoints.push("histórico de status")
    if (financialResult?.truncated) truncatedEndpoints.push("financeiro")

    return prisma.saiposSyncRun.update({
      where: { id: run.id },
      data: {
        status: truncatedEndpoints.length > 0 || endpointWarnings.length > 0 ? "PARTIAL" : "SUCCESS",
        recordsFetched:
          result.sales.length +
          (itemResult?.sales.reduce((total, sale) => total + (sale.items?.length ?? 0), 0) ?? 0) +
          (statusResult?.sales.reduce((total, sale) => total + (sale.histories?.length ?? 0), 0) ?? 0) +
          (financialResult?.transactions.length ?? 0),
        recordsUpserted: recordsUpserted + paymentRecordsUpserted + itemRecordsUpserted + statusRecordsUpserted + financialRecordsUpserted,
        errorMessage:
          truncatedEndpoints.length > 0
            ? `A sincronização atingiu o limite de páginas em: ${truncatedEndpoints.join(", ")}.`
            : [
                `Vendas sincronizadas: ${recordsUpserted}.`,
                `Pagamentos sincronizados: ${paymentRecordsUpserted}.`,
                `Itens sincronizados: ${itemRecordsUpserted}.`,
                `Históricos de status sincronizados: ${statusRecordsUpserted}.`,
                `Lançamentos financeiros sincronizados: ${financialRecordsUpserted}.`,
                `Produtos Saipos atualizados: ${productReferencesUpserted}.`,
                `Itens sem venda correspondente ignorados: ${skippedItemRecords}.`,
                `Históricos sem venda correspondente ignorados: ${skippedStatusRecords}.`,
                endpointWarnings.length > 0 ? `Avisos: ${endpointWarnings.join(" | ")}` : null,
              ]
                .filter(Boolean)
                .join(" "),
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
