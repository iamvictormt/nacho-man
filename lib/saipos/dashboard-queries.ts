import "server-only"

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
