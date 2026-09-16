import "server-only"
import { prisma } from "@/lib/prisma"
import {
  buildDailyRevenue,
  buildProductMix,
  getKnownStoreNames,
  summarizeSales,
  percentChange,
} from "./dashboard-metrics"
import {
  getSaiposDashboardSales,
  getSaiposDashboardItems,
  getSaiposProductReferences,
  getSaiposStockCmv,
  getSaiposStoreOptionsSource,
} from "./dashboard-queries"
import type { AnalysisInput } from "./analysis-input"

export async function buildAnalysisContext(input: AnalysisInput) {
  const selectedStore = input.store
  const source = await getSaiposStoreOptionsSource()
  if (selectedStore !== "all" && !source.storeIds.some((store) => String(store.idStore) === selectedStore)) {
    throw new Error("UNKNOWN_STORE")
  }
  const names = getKnownStoreNames(source.storeNameRows)
  const references = await getSaiposProductReferences({ selectedStore })
  async function collect(period: { start: string; end: string }) {
    const [sales, items, cmv] = await Promise.all([
      getSaiposDashboardSales({ period, selectedStore }),
      getSaiposDashboardItems({ period, selectedStore }),
      getSaiposStockCmv({ period, selectedStore }),
    ])
    const summary = summarizeSales(sales)
    const products = buildProductMix(items, references)
    const daily = buildDailyRevenue(sales, period).map((day, index) => ({
      ...day,
      date: new Date(Date.parse(period.start) + index * 86400000).toISOString().slice(0, 10),
    }))
    const stores = Array.from(new Set(sales.map((sale) => sale.idStore)))
      .sort()
      .map((id) => ({
        id,
        name: names.get(id) ?? `Loja #${id}`,
        ...summarizeSales(sales.filter((sale) => sale.idStore === id)),
      }))
    return {
      period,
      summary,
      daily,
      stores,
      products: products.rows
        .slice(0, 100)
        .map(({ name, quantity, revenueInCents, share }) => ({ name, quantity, revenueInCents, share })),
      productsTotal: products.totalProducts,
      productsOmitted: Math.max(0, products.totalProducts - 100),
      cmv:
        cmv.movementCount > 0
          ? { estimatedCostInCents: cmv.estimatedCostInCents, movementCount: cmv.movementCount }
          : null,
      lastSyncedAt: sales.length
        ? new Date(sales.reduce((latest, sale) => Math.max(latest, sale.syncedAt.getTime()), 0)).toISOString()
        : null,
    }
  }
  const [current, comparison, lastSync] = await Promise.all([
    collect({ start: input.start, end: input.end }),
    collect({ start: input.comparisonStart, end: input.comparisonEnd }),
    prisma.saiposSyncRun.findFirst({
      orderBy: { startedAt: "desc" },
      select: { status: true, periodStart: true, periodEnd: true, finishedAt: true },
    }),
  ])
  if (!current.summary.records && !comparison.summary.records) throw new Error("NO_DATA")
  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    source: "Saipos / banco do painel de Indicadores",
    store: selectedStore,
    storeName:
      selectedStore === "all" ? "Todas as lojas" : (names.get(Number(selectedStore)) ?? `Loja #${selectedStore}`),
    units: "Valores InCents em centavos de BRL; taxas e participações em fração (0.1 = 10%).",
    limitations: [
      "Ausência de registros não comprova ausência de vendas. A base depende das importações Saipos; não há garantia de cobertura integral.",
      "CMV nulo significa indisponível, nunca custo zero. Receita não é lucro. Produtos limitados aos 100 de maior receita de cada período.",
      "Receita de produtos usa quantidade × preço e pode diferir do faturamento líquido dos pedidos.",
      "Cada pergunta é independente; somente os dois períodos selecionados estão disponíveis. Períodos podem ter durações diferentes.",
    ],
    lastSync,
    current,
    comparison,
    changes: {
      netRevenue: percentChange(current.summary.netInCents, comparison.summary.netInCents),
      orders: percentChange(current.summary.orders, comparison.summary.orders),
      averageTicket: percentChange(current.summary.averageTicketInCents, comparison.summary.averageTicketInCents),
    },
  }
}
