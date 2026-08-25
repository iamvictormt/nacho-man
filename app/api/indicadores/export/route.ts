import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser, isAdminRole } from "@/lib/auth"
import {
  buildAlerts,
  buildDailyRevenue,
  buildEstimatedCmv,
  buildProductMix,
  buildStoreRows,
  getCustomerIdentity,
  getKnownStoreNames,
  getPartnerLabel,
  getSaleGrossAmountInCents,
  groupBy,
  isCanceled,
  saleTypeLabels,
  summarizeSales,
  topEntries,
} from "@/lib/saipos/dashboard-metrics"
import {
  buildCustomerInsights,
  buildOperationalInsights,
  buildPaymentInsights,
} from "@/lib/saipos/dashboard-insights"
import {
  getSaiposDashboardItems,
  getSaiposDashboardSales,
  getSaiposProductReferences,
  getSaiposStockCmv,
  getSaiposStoreOptionsSource,
} from "@/lib/saipos/dashboard-queries"
import {
  addUtcDays,
  buildPeriodFromMode,
  diffUtcDays,
  getComparisonAnchorDate,
  getPeriodMode,
  getPreviousPeriodAnchorDate,
  getSearchParam,
  getSelectedAnchorDate,
  toBrazilDateInputValue,
  toDateInputValue,
  toPeriodStart,
  type PageSearchParams,
} from "@/lib/saipos/period"
import { formatMoneyFromAmount, formatPercent, formatQuantity } from "@/lib/saipos/formatters"

export const dynamic = "force-dynamic"

function getTab(searchParams: PageSearchParams) {
  const tab = getSearchParam(searchParams, "tab")
  return tab === "semanal" || tab === "mensal" ? tab : null
}

function requestSearchParamsToRecord(searchParams: URLSearchParams): PageSearchParams {
  return Array.from(searchParams.entries()).reduce<PageSearchParams>((record, [key, value]) => {
    record[key] = value
    return record
  }, {})
}

function fileSafe(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

function xmlEscape(value: unknown) {
  return (value === null || value === undefined ? "" : String(value))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function worksheet(name: string, rows: unknown[][]) {
  const sheetName = xmlEscape(name.slice(0, 31))
  const tableRows = rows
    .map(
      (row, rowIndex) =>
        `<Row>${row
          .map((cell) => `<Cell${rowIndex === 0 ? ' ss:StyleID="Header"' : ""}><Data ss:Type="String">${xmlEscape(cell)}</Data></Cell>`)
          .join("")}</Row>`
    )
    .join("")

  return `<Worksheet ss:Name="${sheetName}"><Table>${tableRows}</Table></Worksheet>`
}

function workbook(sheets: Array<{ name: string; rows: unknown[][] }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#EFFF0D" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${sheets.map((sheet) => worksheet(sheet.name, sheet.rows)).join("")}
</Workbook>`
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.mustChangePassword || !isAdminRole(user.role) || (user.role !== "ADMIN_MASTER" && !user.canAccessIndicators)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const resolvedSearchParams = requestSearchParamsToRecord(request.nextUrl.searchParams)
  const yesterday = addUtcDays(toPeriodStart(toBrazilDateInputValue(new Date())), -1)
  const selectedStore = getSearchParam(resolvedSearchParams, "store") ?? "all"
  const activeTab = getTab(resolvedSearchParams)
  const selectedMode =
    activeTab === "semanal" ? "week" : activeTab === "mensal" ? "month" : getPeriodMode(resolvedSearchParams)
  const selectedDate = getSelectedAnchorDate(selectedMode, resolvedSearchParams, yesterday)
  const period = buildPeriodFromMode(selectedMode, selectedDate, yesterday)
  const equivalentDays = diffUtcDays(toPeriodStart(period.start), toPeriodStart(period.end))
  const previousPeriodAnchorDate = getPreviousPeriodAnchorDate(selectedMode, toPeriodStart(period.start))
  const requestedComparisonDate = getComparisonAnchorDate(selectedMode, resolvedSearchParams, previousPeriodAnchorDate)
  const requestedComparisonPeriod = buildPeriodFromMode(selectedMode, requestedComparisonDate, yesterday, equivalentDays)
  const comparisonPeriod =
    requestedComparisonPeriod.start === period.start && requestedComparisonPeriod.end === period.end
      ? buildPeriodFromMode(selectedMode, previousPeriodAnchorDate, yesterday, equivalentDays)
      : requestedComparisonPeriod

  const [sales, comparisonSales, productItems, allProductItems, productReferences, stockCmv, storeOptionsSource] =
    await Promise.all([
      getSaiposDashboardSales({ period, selectedStore }),
      getSaiposDashboardSales({ period: comparisonPeriod, selectedStore }),
      getSaiposDashboardItems({ period, selectedStore }),
      getSaiposDashboardItems({ period, selectedStore, includeDeleted: true }),
      getSaiposProductReferences({ selectedStore }),
      getSaiposStockCmv({ period, selectedStore }),
      getSaiposStoreOptionsSource(),
    ])

  const knownStoreNames = getKnownStoreNames(storeOptionsSource.storeNameRows)
  const selectedStoreName =
    selectedStore === "all" ? "Todas as lojas" : knownStoreNames.get(Number(selectedStore)) ?? `Loja #${selectedStore}`
  const summary = summarizeSales(sales)
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const dailyRevenue = buildDailyRevenue(sales, period)
  const storeRows = buildStoreRows({ sales, comparisonSales, knownStoreNames })
  const saleTypes = topEntries(groupBy(validSales, (sale) => saleTypeLabels[sale.idSaleType] ?? "Outro"), 12)
  const partners = topEntries(groupBy(validSales, getPartnerLabel), 12)
  const productMix = buildProductMix(productItems, productReferences)
  const estimatedCmv = buildEstimatedCmv(stockCmv)
  const estimatedCmvRate =
    summary.netInCents > 0 && estimatedCmv.estimatedCostInCents > 0
      ? estimatedCmv.estimatedCostInCents / summary.netInCents
      : null
  const paymentInsights = buildPaymentInsights(sales)
  const operationalInsights = buildOperationalInsights(sales, allProductItems)
  const customerInsights = buildCustomerInsights(sales)
  const alerts = buildAlerts({
    summary,
    customerCoverage: validSales.length > 0 ? customerInsights.uniqueCustomers / validSales.length : 0,
    dailyRevenue,
    storeRows,
    saleTypes,
    productMix,
    operational: operationalInsights,
    payments: paymentInsights,
    periodMode: selectedMode,
  })

  const sheets = [
    {
      name: "Resumo",
      rows: [
      ["Campo", "Valor"],
      ["Período", period.label],
      ["Início", period.start],
      ["Fim", period.end],
      ["Escala", selectedMode],
      ["Unidade", selectedStoreName],
      ["Gerado em", new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date())],
      ["Usuário", user.name],
      [],
      ["Indicador", "Valor"],
      ["Vendas carregadas", sales.length],
      ["Pedidos válidos", summary.orders],
      ["Cancelamentos", summary.canceledOrders],
      ["Taxa de cancelamento", formatPercent(summary.cancellationRate)],
      ["Vendas brutas", formatMoneyFromAmount(summary.grossInCents / 100)],
      ["Descontos", formatMoneyFromAmount(summary.discountInCents / 100)],
      ["Acréscimos", formatMoneyFromAmount(summary.increaseInCents / 100)],
      ["Faturamento líquido", formatMoneyFromAmount(summary.netInCents / 100)],
      ["Ticket médio", formatMoneyFromAmount(summary.averageTicketInCents / 100)],
      ["CMV estimado", formatMoneyFromAmount(estimatedCmv.estimatedCostInCents / 100)],
      ["% CMV estimado", estimatedCmvRate === null ? "--" : formatPercent(estimatedCmvRate)],
      ["Fonte do CMV", estimatedCmv.sourceLabel],
      ["Movimentos de estoque CMV", estimatedCmv.movementCount],
      ],
    },
    {
      name: "Alertas",
      rows: [
      ["Severidade", "Título", "Métrica", "Detalhe", "Sugestão"],
      ...alerts.slice(0, 10).map((alert) => [alert.severity, alert.title, alert.metric, alert.detail, alert.action]),
      ],
    },
    {
      name: "Faturamento",
      rows: [
      ["Dia", "Vendas brutas", "Faturamento líquido", "Pedidos", "Ticket médio"],
      ...dailyRevenue.map((day) => [
        day.label,
        formatMoneyFromAmount(day.grossInCents / 100),
        formatMoneyFromAmount(day.netInCents / 100),
        day.orders,
        day.orders > 0 ? formatMoneyFromAmount(day.netInCents / day.orders / 100) : formatMoneyFromAmount(0),
      ]),
      ],
    },
    {
      name: "Produtos",
      rows: [
      ["Produto", "PDV", "Qtd.", "Pedidos", "Receita", "Preço médio", "Participação", "Acumulado", "Curva"],
      ...productMix.rows.slice(0, 50).map((item) => [
        item.name,
        item.integrationCode ?? "",
        formatQuantity(item.quantity),
        item.orders,
        formatMoneyFromAmount(item.revenueInCents / 100),
        formatMoneyFromAmount(item.averageUnitPriceInCents / 100),
        formatPercent(item.share),
        formatPercent(item.cumulativeShare),
        item.abc,
      ]),
      ],
    },
    {
      name: "CMV",
      rows: [
      ["Indicador", "Valor"],
      ["Custo estimado", formatMoneyFromAmount(estimatedCmv.estimatedCostInCents / 100)],
      ["% CMV estimado", estimatedCmvRate === null ? "--" : formatPercent(estimatedCmvRate)],
      ["Fonte", estimatedCmv.sourceLabel],
      ["Movimentos de estoque", estimatedCmv.movementCount],
      ["Ingredientes/custos ativos", estimatedCmv.costCount],
      [],
      ["Ingredientes com maior custo", "Movimentos", "Custo"],
      ...estimatedCmv.topIngredients.map((item) => [item.name, item.detail, formatMoneyFromAmount(item.value / 100)]),
      ],
    },
    {
      name: "Canais",
      rows: [
      ["Canal", "Pedidos"],
      ...partners.map((row) => [row.name, row.value]),
      [],
      ["Tipo", "Pedidos"],
      ...saleTypes.map((row) => [row.name, row.value]),
      ],
    },
    {
      name: "Pagamentos",
      rows: [
      ["Meio", "Valor", "Detalhe"],
      ...paymentInsights.rows.map((row) => [row.name, formatMoneyFromAmount(row.value / 100), row.detail]),
      ],
    },
    {
      name: "Unidades",
      rows: [
      ["Unidade", "Faturamento", "Pedidos", "Ticket médio", "Cancelamento"],
      ...storeRows.map((row) => [
        row.name,
        formatMoneyFromAmount(row.revenueInCents / 100),
        row.orders,
        formatMoneyFromAmount(row.averageTicketInCents / 100),
        formatPercent(row.cancellationRate),
      ]),
      ],
    },
    {
      name: "Vendas",
      rows: [
      ["ID venda", "Unidade", "Canal", "Cliente", "Status", "Bruto", "Desconto", "Acréscimo", "Líquido"],
      ...sales.slice(0, 1000).map((sale) => [
        String(sale.idSale),
        knownStoreNames.get(sale.idStore) ?? `Loja #${sale.idStore}`,
        getPartnerLabel(sale),
        getCustomerIdentity(sale).name ?? "Cliente não identificado",
        sale.canceled ? "Cancelada" : "Válida",
        formatMoneyFromAmount(getSaleGrossAmountInCents(sale) / 100),
        formatMoneyFromAmount(sale.totalDiscountInCents / 100),
        formatMoneyFromAmount(sale.totalIncreaseInCents / 100),
        formatMoneyFromAmount(sale.totalAmountInCents / 100),
      ]),
      ],
    },
  ]

  const xls = workbook(sheets)
  const filename = `nacho-bi-${fileSafe(period.label)}-${toDateInputValue(new Date())}.xls`

  return new NextResponse(xls, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
