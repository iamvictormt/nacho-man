import "server-only"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { toPeriodEnd, toPeriodStart } from "@/lib/saipos/period"

type SaiposDashboardPeriod = {
  start: string
  end: string
}

function storeFilter(selectedStore: string) {
  return selectedStore === "all" ? {} : { idStore: Number(selectedStore) }
}

function salePeriodFilter(period: SaiposDashboardPeriod) {
  return {
    OR: [
      {
        shiftDate: {
          gte: toPeriodStart(period.start),
          lte: toPeriodEnd(period.end),
        },
      },
      {
        shiftDate: null,
        createdAtSaipos: {
          gte: toPeriodStart(period.start),
          lte: toPeriodEnd(period.end),
        },
      },
    ],
  }
}

export async function getSaiposDashboardSales({
  period,
  selectedStore,
}: {
  period: SaiposDashboardPeriod
  selectedStore: string
}) {
  return prisma.saiposSale.findMany({
    where: {
      ...salePeriodFilter(period),
      ...storeFilter(selectedStore),
    },
    orderBy: { createdAtSaipos: "desc" },
  })
}

export async function getSaiposDashboardItems({
  period,
  selectedStore,
  includeDeleted = false,
}: {
  period: SaiposDashboardPeriod
  selectedStore: string
  includeDeleted?: boolean
}) {
  return prisma.saiposSaleItem.findMany({
    where: {
      ...(includeDeleted ? {} : { deleted: false }),
      sale: {
        canceled: false,
        ...salePeriodFilter(period),
        ...storeFilter(selectedStore),
      },
    },
    orderBy: [{ quantity: "desc" }, { unitPriceInCents: "desc" }],
  })
}

export async function getSaiposProductReferences({ selectedStore }: { selectedStore: string }) {
  return prisma.saiposProductReference.findMany({
    where: storeFilter(selectedStore),
    orderBy: [{ name: "asc" }],
  })
}

export type SaiposStockCmvRow = {
  name: string
  value: number
  detail: string
}

export type SaiposStockCmv = {
  estimatedCostInCents: number
  movementCount: number
  ingredientCount: number
  sourceLabel: string
  topIngredients: SaiposStockCmvRow[]
}

function emptySaiposStockCmv(): SaiposStockCmv {
  return {
    estimatedCostInCents: 0,
    movementCount: 0,
    ingredientCount: 0,
    sourceLabel: "Estoque Saipos",
    topIngredients: [],
  }
}

function isMissingSaiposStockMovementError(error: unknown) {
  if (!(error instanceof Error)) return false

  const meta = error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : null
  const metaText = meta ? JSON.stringify(meta) : ""
  const message = `${error.message} ${metaText}`

  return (
    message.includes("42P01") ||
    message.includes('relation "SaiposStockMovement" does not exist') ||
    message.includes('table "SaiposStockMovement" does not exist')
  )
}

export async function getSaiposStockCmv({
  period,
  selectedStore,
}: {
  period: SaiposDashboardPeriod
  selectedStore: string
}): Promise<SaiposStockCmv> {
  try {
    const storeWhere = selectedStore === "all" ? Prisma.empty : Prisma.sql`AND "idStore" = ${Number(selectedStore)}`

    const filter = Prisma.sql`
      "dateMovement" >= ${toPeriodStart(period.start)}
      AND "dateMovement" <= ${toPeriodEnd(period.end)}
      AND "saleId" IS NOT NULL
      AND "includeInCmvCalc" = true
      AND "movementCostInCents" > 0
      ${storeWhere}
    `

    const [rows, totals] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          ingredientName: string | null
          movementCostInCents: number
          movementCount: bigint
        }>
      >`
      SELECT
        COALESCE("ingredientName", 'Ingrediente não identificado') AS "ingredientName",
        SUM("movementCostInCents")::integer AS "movementCostInCents",
        COUNT(*)::bigint AS "movementCount"
      FROM "SaiposStockMovement"
      WHERE ${filter}
      GROUP BY COALESCE("ingredientName", 'Ingrediente não identificado')
      ORDER BY SUM("movementCostInCents") DESC
      LIMIT 12
    `,
      prisma.$queryRaw<Array<{ movementCount: bigint; ingredientCount: bigint; estimatedCostInCents: number }>>`
        SELECT
          COUNT(*)::bigint AS "movementCount",
          COUNT(DISTINCT "idStoreIngredient")::bigint AS "ingredientCount",
          COALESCE(SUM("movementCostInCents"), 0)::integer AS "estimatedCostInCents"
        FROM "SaiposStockMovement"
        WHERE ${filter}
      `,
    ])

    const total = totals[0]
    const estimatedCostInCents = Number(total?.estimatedCostInCents ?? 0)
    const movementCount = Number(total?.movementCount ?? 0)
    const ingredientCount = Number(total?.ingredientCount ?? 0)

    return {
      estimatedCostInCents,
      movementCount,
      ingredientCount,
      sourceLabel: "Estoque Saipos",
      topIngredients: rows.slice(0, 8).map((row) => ({
        name: row.ingredientName ?? "Ingrediente não identificado",
        value: Number(row.movementCostInCents ?? 0),
        detail: `${Number(row.movementCount ?? 0)} movimentos`,
      })),
    }
  } catch (error) {
    if (isMissingSaiposStockMovementError(error)) return emptySaiposStockCmv()
    throw error
  }
}

export async function getSaiposStoreOptionsSource() {
  const [storeIds, storeNameRows] = await Promise.all([
    prisma.saiposSale.findMany({
      distinct: ["idStore"],
      orderBy: { idStore: "asc" },
      select: { idStore: true },
    }),
    prisma.saiposSale.findMany({
      orderBy: { createdAtSaipos: "desc" },
      select: { idStore: true, partnerName: true, raw: true },
      take: 20000,
    }),
  ])

  return { storeIds, storeNameRows }
}

export type SaiposDashboardSale = Awaited<ReturnType<typeof getSaiposDashboardSales>>[number]
export type SaiposDashboardSaleItem = Awaited<ReturnType<typeof getSaiposDashboardItems>>[number]
export type SaiposProductReference = Awaited<ReturnType<typeof getSaiposProductReferences>>[number]
