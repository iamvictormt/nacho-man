import {
  formatMoneyFromAmount,
  formatPercent,
  formatQuantity,
} from "@/lib/saipos/formatters"
import { addUtcDays, toBrazilDateInputValue, toDateInputValue, toPeriodStart } from "@/lib/saipos/period"
import type { SaiposPeriodMode } from "@/lib/saipos/period"
import type {
  SaiposDashboardSale,
  SaiposDashboardSaleItem,
  SaiposProductReference,
  SaiposStockCmv,
} from "@/lib/saipos/dashboard-queries"

export type SaiposDashboardTone = "lime" | "purple" | "amber" | "neutral"

export type SaiposDashboardAlert = {
  title: string
  detail: string
  metric: string
  action: string
  tone: SaiposDashboardTone
  severity: "Atenção" | "Oportunidade" | "Estável"
}

export const saleTypeLabels: Record<number, string> = {
  1: "Delivery",
  2: "Retirada",
  3: "Salão",
  4: "Balcão",
}

export function buildHref(searchParams: Record<string, string | string[] | undefined>, updates: Record<string, string | null>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value)
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `/admin/saipos?${query}` : "/admin/saipos"
}

export function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((totals, item) => {
    const key = getKey(item)
    totals[key] = (totals[key] ?? 0) + 1
    return totals
  }, {})
}

export function topEntries(totals: Record<string, number>, limit = 6) {
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

function getRawString(value: unknown, path: string[]) {
  let current = value

  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return null
    current = (current as Record<string, unknown>)[key]
  }

  return typeof current === "string" && current.trim() ? normalizeSaiposText(current.trim()) : null
}

function getRawStringOrFirst(value: unknown, path: string[]) {
  let current = value

  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return null
    current = (current as Record<string, unknown>)[key]
  }

  if (typeof current === "string" && current.trim()) return normalizeSaiposText(current.trim())
  if (Array.isArray(current)) {
    const first = current.find((item) => typeof item === "string" && item.trim())
    return typeof first === "string" ? normalizeSaiposText(first.trim()) : null
  }

  return null
}

function normalizeSaiposText(value: string) {
  if (!/[ÃÂ]/.test(value)) return value

  const replacements: Record<string, string> = {
    "Ã¡": "á",
    "Ã¢": "â",
    "Ã£": "ã",
    "Ã¤": "ä",
    "Ã©": "é",
    "Ãª": "ê",
    "Ã­": "í",
    "Ã³": "ó",
    "Ã´": "ô",
    "Ãµ": "õ",
    "Ãº": "ú",
    "Ã§": "ç",
    "Ã": "Á",
    "Ã‚": "Â",
    "Ãƒ": "Ã",
    "Ã‰": "É",
    "ÃŠ": "Ê",
    "Ã": "Í",
    "Ã“": "Ó",
    "Ã”": "Ô",
    "Ã•": "Õ",
    "Ãš": "Ú",
    "Ã‡": "Ç",
    "Âº": "º",
    "Âª": "ª",
    "Â°": "°",
    "Â´": "´",
    "Â·": "·",
    "Â ": " ",
  }

  return Object.entries(replacements).reduce((text, [broken, fixed]) => text.replaceAll(broken, fixed), value)
}

export function getStoreName(store: { idStore: number; partnerName?: string | null; raw?: unknown }) {
  const rawName =
    getRawString(store.raw, ["partner_sale", "desc_store_partner"]) ??
    getRawString(store.raw, ["store", "name"]) ??
    getRawString(store.raw, ["store", "desc_store"]) ??
    getRawString(store.raw, ["desc_store"]) ??
    getRawString(store.raw, ["store_name"]) ??
    getRawString(store.raw, ["name_store"])

  return store.partnerName?.trim() || rawName || `Loja #${store.idStore}`
}

export function getKnownStoreNames(stores: Array<{ idStore: number; partnerName?: string | null; raw?: unknown }>) {
  return stores.reduce<Map<number, string>>((names, store) => {
    if (names.has(store.idStore)) return names

    const name = getStoreName(store)
    if (name !== `Loja #${store.idStore}`) names.set(store.idStore, name)

    return names
  }, new Map())
}

export function isCanceled(sale: SaiposDashboardSale) {
  return sale.canceled
}

export function getPaymentLabel(sale: SaiposDashboardSale) {
  return sale.paymentMethod?.trim() || "Não informado"
}

export function getPartnerLabel(sale: SaiposDashboardSale) {
  return (
    getRawString(sale.raw, ["partner_sale", "desc_partner_sale"]) ||
    getRawString(sale.raw, ["partner_sale", "desc_partner"]) ||
    getRawString(sale.raw, ["partner_sale", "name"]) ||
    sale.partnerName?.trim() ||
    "Direto da unidade"
  )
}

export function getCustomerIdentity(sale: SaiposDashboardSale) {
  const name = getRawString(sale.raw, ["customer", "name"]) ?? getRawString(sale.raw, ["customer", "desc_customer"])
  const phone =
    getRawStringOrFirst(sale.raw, ["customer", "phone"]) ??
    getRawStringOrFirst(sale.raw, ["customer", "cellphone"])
  const email = getRawString(sale.raw, ["customer", "email"])
  const document = getRawString(sale.raw, ["customer", "document"]) ?? getRawString(sale.raw, ["customer", "cpf_cnpj"])
  const normalizedName = name && name.toLowerCase() !== "consumidor não identificado" ? name : null
  const key = document ?? phone ?? email ?? normalizedName

  return { key, name: normalizedName, phone, email, document }
}

export function getSaleGrossAmountInCents(sale: SaiposDashboardSale) {
  return sale.totalAmountInCents + sale.totalDiscountInCents - sale.totalIncreaseInCents
}

export function summarizeSales(sales: SaiposDashboardSale[]) {
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const canceledSales = sales.filter(isCanceled)
  const grossInCents = validSales.reduce((total, sale) => total + getSaleGrossAmountInCents(sale), 0)
  const netInCents = validSales.reduce((total, sale) => total + sale.totalAmountInCents, 0)
  const discountInCents = validSales.reduce((total, sale) => total + sale.totalDiscountInCents, 0)
  const increaseInCents = validSales.reduce((total, sale) => total + sale.totalIncreaseInCents, 0)
  const canceledInCents = canceledSales.reduce((total, sale) => total + getSaleGrossAmountInCents(sale), 0)

  return {
    records: sales.length,
    orders: validSales.length,
    canceledOrders: canceledSales.length,
    cancellationRate: sales.length > 0 ? canceledSales.length / sales.length : 0,
    grossInCents,
    netInCents,
    discountInCents,
    increaseInCents,
    canceledInCents,
    averageTicketInCents: validSales.length > 0 ? netInCents / validSales.length : 0,
  }
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? null : 0
  return (current - previous) / previous
}

function getSaleDateKey(sale: SaiposDashboardSale) {
  if (sale.shiftDate) return toDateInputValue(sale.shiftDate)
  return toBrazilDateInputValue(sale.createdAtSaipos)
}

export function buildDailyRevenue(sales: SaiposDashboardSale[], period: { start: string; end: string }) {
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const totals = validSales.reduce<Record<string, { grossInCents: number; netInCents: number; orders: number }>>(
    (acc, sale) => {
      const key = getSaleDateKey(sale)
      acc[key] ??= { grossInCents: 0, netInCents: 0, orders: 0 }
      acc[key].orders += 1
      acc[key].grossInCents += getSaleGrossAmountInCents(sale)
      acc[key].netInCents += sale.totalAmountInCents
      return acc
    },
    {}
  )

  const points: Array<{ label: string; grossInCents: number; netInCents: number; orders: number }> = []
  let current = toPeriodStart(period.start)
  const end = toPeriodStart(period.end)

  while (current <= end) {
    const date = current.toISOString().slice(0, 10)
    const item = totals[date] ?? { grossInCents: 0, netInCents: 0, orders: 0 }
    points.push({
      label: date.includes("-") ? date.split("-").reverse().slice(0, 2).join("/") : date,
      ...item,
    })
    current = addUtcDays(current, 1)
  }

  return points
}

export function buildStoreRows({
  sales,
  comparisonSales,
  knownStoreNames,
}: {
  sales: SaiposDashboardSale[]
  comparisonSales: SaiposDashboardSale[]
  knownStoreNames: Map<number, string>
}) {
  const currentStores = sales.reduce<Map<number, SaiposDashboardSale[]>>((stores, sale) => {
    const items = stores.get(sale.idStore) ?? []
    items.push(sale)
    stores.set(sale.idStore, items)
    return stores
  }, new Map())

  const comparisonStores = comparisonSales.reduce<Map<number, SaiposDashboardSale[]>>((stores, sale) => {
    const items = stores.get(sale.idStore) ?? []
    items.push(sale)
    stores.set(sale.idStore, items)
    return stores
  }, new Map())

  return Array.from(currentStores.entries())
    .map(([idStore, storeSales]) => {
      const summary = summarizeSales(storeSales)
      const comparisonSummary = summarizeSales(comparisonStores.get(idStore) ?? [])
      const firstSale = storeSales[0]

      return {
        idStore,
        name: knownStoreNames.get(idStore) ?? (firstSale ? getStoreName(firstSale) : `Loja #${idStore}`),
        revenueInCents: summary.netInCents,
        orders: summary.orders,
        averageTicketInCents: summary.averageTicketInCents,
        cancellationRate: summary.cancellationRate,
        growth: percentChange(comparisonSummary.netInCents, summary.netInCents),
      }
    })
    .sort((a, b) => b.revenueInCents - a.revenueInCents)
}

function getItemRevenueInCents(item: Pick<SaiposDashboardSaleItem, "quantity" | "unitPriceInCents">) {
  return Math.round(item.quantity * item.unitPriceInCents)
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

function getRawStringFromObject(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) return null
  const next = (value as Record<string, unknown>)[key]
  if (typeof next === "number" && Number.isFinite(next)) return String(next)
  return typeof next === "string" && next.trim() ? next.trim() : null
}

export function getItemProductKey(item: SaiposDashboardSaleItem) {
  if (typeof item.idStoreItem === "number") return `${item.idStore}:item:${item.idStoreItem}`

  const integrationCode = getRawStringFromObject(item.raw, "integration_code")
  if (integrationCode) return `${item.idStore}:code:${normalizeProductKeyText(integrationCode)}`

  const nameKey = normalizeProductKeyText(item.descSaleItem)
  return `${item.idStore}:name:${nameKey}`
}

export function buildEstimatedCmv(stockCmv?: SaiposStockCmv) {
  if (stockCmv && stockCmv.estimatedCostInCents > 0) {
    return {
      source: "stock" as const,
      sourceLabel: stockCmv.sourceLabel,
      estimatedCostInCents: stockCmv.estimatedCostInCents,
      coveredRevenueInCents: 0,
      coveredQuantity: 0,
      totalRevenueInCents: 0,
      totalQuantity: 0,
      revenueCoverage: 0,
      quantityCoverage: 0,
      costCount: stockCmv.ingredientCount,
      movementCount: stockCmv.movementCount,
      topIngredients: stockCmv.topIngredients,
      missingProducts: [],
    }
  }

  return {
    source: "stock" as const,
    sourceLabel: "Estoque Saipos",
    estimatedCostInCents: 0,
    coveredRevenueInCents: 0,
    coveredQuantity: 0,
    totalRevenueInCents: 0,
    totalQuantity: 0,
    revenueCoverage: 0,
    quantityCoverage: 0,
    costCount: 0,
    movementCount: 0,
    topIngredients: [],
    missingProducts: [],
  }
}

function getChoiceRows(items: SaiposDashboardSaleItem[]) {
  const choices = new Map<string, { name: string; quantity: number; revenueInCents: number }>()

  for (const item of items) {
    if (!Array.isArray(item.choices)) continue

    for (const choice of item.choices) {
      if (!choice || typeof choice !== "object") continue
      const raw = choice as Record<string, unknown>
      const deleted = raw.deleted === true || raw.deleted === "Y"
      if (deleted) continue

      const name =
        (typeof raw.desc_store_choice_item === "string" && raw.desc_store_choice_item.trim()) ||
        (typeof raw.desc_sale_item_choice === "string" && raw.desc_sale_item_choice.trim()) ||
        null
      if (!name) continue

      const current = choices.get(name) ?? { name, quantity: 0, revenueInCents: 0 }
      current.quantity += item.quantity
      current.revenueInCents += Math.round(Number(raw.aditional_price ?? 0) * 100 * item.quantity)
      choices.set(name, current)
    }
  }

  return Array.from(choices.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6)
}

export function buildProductMix(items: SaiposDashboardSaleItem[], productReferences: SaiposProductReference[] = []) {
  const referencesByKey = new Map(productReferences.map((product) => [product.productKey, product]))
  const products = new Map<
    string,
    {
      name: string
      integrationCode: string | null
      quantity: number
      revenueInCents: number
      averageUnitPriceInCents: number
      orders: number
      abc: "A" | "B" | "C"
      share: number
      cumulativeShare: number
    }
  >()

  for (const item of items) {
    const key = getItemProductKey(item)
    const reference = referencesByKey.get(key)
    const current = products.get(key) ?? {
      name: reference?.name ?? item.descSaleItem,
      integrationCode: reference?.integrationCode ?? getRawStringFromObject(item.raw, "integration_code"),
      quantity: 0,
      revenueInCents: 0,
      averageUnitPriceInCents: 0,
      orders: 0,
      abc: "C" as const,
      share: 0,
      cumulativeShare: 0,
    }
    current.quantity += item.quantity
    current.revenueInCents += getItemRevenueInCents(item)
    current.orders += 1
    products.set(key, current)
  }

  const rows = Array.from(products.values()).sort((a, b) => b.revenueInCents - a.revenueInCents)
  const totalRevenueInCents = rows.reduce((total, item) => total + item.revenueInCents, 0)
  let cumulative = 0

  for (const row of rows) {
    row.averageUnitPriceInCents = row.quantity > 0 ? row.revenueInCents / row.quantity : 0
    row.share = totalRevenueInCents > 0 ? row.revenueInCents / totalRevenueInCents : 0
    const previousCumulative = cumulative
    cumulative += row.share
    row.cumulativeShare = cumulative
    row.abc = previousCumulative < 0.8 ? "A" : previousCumulative < 0.95 ? "B" : "C"
  }

  const totalQuantity = rows.reduce((total, item) => total + item.quantity, 0)
  const choiceRows = getChoiceRows(items)
  const paidRows = rows.filter((item) => item.revenueInCents > 0)
  const averageUnitRevenueInCents = totalQuantity > 0 ? totalRevenueInCents / totalQuantity : 0
  const lowTurnover = [...rows]
    .filter((item) => item.quantity > 0 && item.revenueInCents > 0)
    .sort((a, b) => a.quantity - b.quantity || a.revenueInCents - b.revenueInCents)
    .slice(0, 5)
  const volumeOpportunities = [...paidRows]
    .filter((item) => item.quantity >= 2 && item.averageUnitPriceInCents < averageUnitRevenueInCents)
    .sort((a, b) => b.quantity - a.quantity || a.averageUnitPriceInCents - b.averageUnitPriceInCents)
    .slice(0, 6)
  const includedItems = [...rows]
    .filter((item) => item.quantity > 0 && item.revenueInCents === 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
  const paidChoices = choiceRows.filter((item) => item.revenueInCents > 0)
  const includedChoices = choiceRows.filter((item) => item.revenueInCents === 0).slice(0, 5)

  return {
    rows,
    topProducts: paidRows.slice(0, 8),
    lowTurnover,
    volumeOpportunities,
    includedItems,
    choices: paidChoices,
    includedChoices,
    totalProducts: rows.length,
    totalQuantity,
    totalRevenueInCents,
    top3RevenueShare:
      totalRevenueInCents > 0
        ? paidRows.slice(0, 3).reduce((total, item) => total + item.revenueInCents, 0) / totalRevenueInCents
        : 0,
    averageUnitRevenueInCents,
    zeroRevenueProducts: rows.filter((item) => item.revenueInCents === 0).length,
    classARevenueInCents: rows.filter((item) => item.abc === "A").reduce((total, item) => total + item.revenueInCents, 0),
  }
}

export function buildAlerts({
  summary,
  customerCoverage,
  dailyRevenue = [],
  storeRows = [],
  saleTypes = [],
  productMix,
  operational,
  payments,
  periodMode = "day",
}: {
  summary: ReturnType<typeof summarizeSales>
  customerCoverage: number
  dailyRevenue?: ReturnType<typeof buildDailyRevenue>
  storeRows?: ReturnType<typeof buildStoreRows>
  saleTypes?: Array<{ name: string; value: number }>
  productMix?: ReturnType<typeof buildProductMix>
  operational?: {
    deliveryOrders: number
    averageDeliveryMinutes: number
    averagePrepMinutes: number
    averageDeliveryFeeInCents: number
    finishedItems: number
    deletedItems: number
    hours: Array<{ name: string; value: number; detail: string }>
    districts?: Array<{ name: string; value: number; detail: string }>
    deliveryModes?: Array<{ name: string; value: number; detail: string }>
  }
  payments?: {
    splitPaymentOrders: number
    capturedInCents?: number
    rows?: Array<{ name: string; value: number; detail: string }>
  }
  periodMode?: SaiposPeriodMode
}) {
  const alerts: SaiposDashboardAlert[] = []
  const usedTitles = new Set<string>()
  const addAlert = (alert: SaiposDashboardAlert) => {
    if (usedTitles.has(alert.title)) return
    usedTitles.add(alert.title)
    alerts.push(alert)
  }
  const activeDays = dailyRevenue.filter((day) => day.orders > 0)
  const strongestDay = [...activeDays].sort((first, second) => second.netInCents - first.netInCents)[0]
  const weakestDay = [...activeDays].sort((first, second) => first.netInCents - second.netInCents)[0]
  const averageDailyRevenue =
    activeDays.length > 0 ? activeDays.reduce((total, day) => total + day.netInCents, 0) / activeDays.length : 0
  const topStore = storeRows[0]
  const topStoreShare = topStore && summary.netInCents > 0 ? topStore.revenueInCents / summary.netInCents : 0
  const topSaleType = saleTypes[0]
  const topSaleTypeShare = topSaleType && summary.orders > 0 ? topSaleType.value / summary.orders : 0
  const deliveryShare = operational && summary.orders > 0 ? operational.deliveryOrders / summary.orders : 0
  const averageItemsPerOrder = summary.orders > 0 && productMix ? productMix.totalQuantity / summary.orders : 0
  const discountShare = summary.grossInCents > 0 ? summary.discountInCents / summary.grossInCents : 0
  const increaseShare = summary.netInCents > 0 ? summary.increaseInCents / summary.netInCents : 0
  const canceledValueShare = summary.grossInCents + summary.canceledInCents > 0
    ? summary.canceledInCents / (summary.grossInCents + summary.canceledInCents)
    : 0
  const deletedItemShare =
    operational && operational.finishedItems + operational.deletedItems > 0
      ? operational.deletedItems / (operational.finishedItems + operational.deletedItems)
      : 0
  const splitPaymentShare = payments && summary.orders > 0 ? payments.splitPaymentOrders / summary.orders : 0
  const peakHour = operational?.hours ? [...operational.hours].sort((first, second) => second.value - first.value)[0] : null
  const quietHour = operational?.hours ? [...operational.hours].filter((hour) => hour.value > 0).sort((first, second) => first.value - second.value)[0] : null
  const topDistrict = operational?.districts?.[0]
  const topDistrictShare = topDistrict && operational && operational.deliveryOrders > 0 ? topDistrict.value / operational.deliveryOrders : 0
  const unknownDistrict = operational?.districts?.find((district) => district.name === "Bairro não informado")
  const unknownDistrictShare = unknownDistrict && operational && operational.deliveryOrders > 0 ? unknownDistrict.value / operational.deliveryOrders : 0
  const topDeliveryMode = operational?.deliveryModes?.[0]
  const topDeliveryModeShare = topDeliveryMode && operational && operational.deliveryOrders > 0 ? topDeliveryMode.value / operational.deliveryOrders : 0
  const topPayment = payments?.rows?.[0]
  const topPaymentShare = topPayment && payments?.capturedInCents ? topPayment.value / payments.capturedInCents : 0
  const paidProducts = productMix?.rows.filter((item) => item.revenueInCents > 0) ?? []
  const topProduct = productMix?.topProducts[0]
  const topProductShare = topProduct && productMix.totalRevenueInCents > 0 ? topProduct.revenueInCents / productMix.totalRevenueInCents : 0
  const lowTurnoverProduct = productMix?.lowTurnover[0]
  const classAShare = productMix && productMix.totalRevenueInCents > 0 ? productMix.classARevenueInCents / productMix.totalRevenueInCents : 0
  const periodNoun =
    periodMode === "day" ? "dia" : periodMode === "week" ? "semana" : periodMode === "month" ? "mês" : "ano"
  const isShortPeriod = periodMode === "day" || periodMode === "week"
  const isLongPeriod = periodMode === "month" || periodMode === "year"

  if (summary.orders === 0) {
    addAlert({
      title: "Sem movimento no período",
      detail: "Não há pedidos válidos para formar leitura operacional ou comercial.",
      metric: "0 pedidos",
      action: "Confira o filtro de data/unidade ou rode a sincronização do período.",
      tone: "amber",
      severity: "Atenção",
    })

    return alerts
  }

  if (periodMode === "day" && peakHour && summary.orders >= 10) {
    addAlert({
      title: "Plantão do dia",
      detail: `O ponto mais sensível do dia foi ${peakHour.name}, com maior acúmulo de pedidos.`,
      metric: `${formatQuantity(peakHour.value)} pedidos`,
      action: "Use essa faixa para conferir escala, despacho, preparo e tempo de entrega do dia.",
      tone: "amber",
      severity: peakHour.value / summary.orders >= 0.25 ? "Atenção" : "Oportunidade",
    })
  }

  if (periodMode === "day" && operational && operational.averageDeliveryMinutes > 0) {
    addAlert({
      title: "Leitura operacional diária",
      detail: "Para um recorte diário, tempo de entrega e preparo são os sinais mais sensíveis.",
      metric: `${Math.round(operational.averageDeliveryMinutes)} min`,
      action: "Compare o horário de pico com entrega/preparo antes de concluir problema comercial.",
      tone: operational.averageDeliveryMinutes >= 45 || operational.averagePrepMinutes >= 18 ? "amber" : "lime",
      severity: operational.averageDeliveryMinutes >= 45 || operational.averagePrepMinutes >= 18 ? "Atenção" : "Estável",
    })
  }

  if (periodMode === "week" && activeDays.length > 0) {
    addAlert({
      title: "Ritmo da semana",
      detail: `A semana teve ${activeDays.length} dias com venda dentro do filtro selecionado.`,
      metric: `${activeDays.length} dias`,
      action: "Procure diferença entre dias úteis e fim de semana antes de mexer em cardápio ou preço.",
      tone: activeDays.length < dailyRevenue.length ? "amber" : "lime",
      severity: activeDays.length < dailyRevenue.length ? "Atenção" : "Estável",
    })
  }

  if (periodMode === "week" && strongestDay && weakestDay && averageDailyRevenue > 0) {
    addAlert({
      title: "Melhor e pior dia da semana",
      detail: `${strongestDay.label} foi o melhor dia; ${weakestDay.label} foi o mais fraco.`,
      metric: formatMoneyFromAmount(strongestDay.netInCents / 100),
      action: "Use essa diferença para ajustar campanha, escala e abastecimento por dia da semana.",
      tone: strongestDay.netInCents > averageDailyRevenue * 1.5 ? "amber" : "purple",
      severity: strongestDay.netInCents > averageDailyRevenue * 1.5 ? "Atenção" : "Oportunidade",
    })
  }

  if (periodMode === "month" && productMix && productMix.totalRevenueInCents > 0) {
    addAlert({
      title: "Leitura mensal do mix",
      detail: "No mês, a leitura mais útil é concentração de receita, giro e dependência dos líderes.",
      metric: formatPercent(productMix.top3RevenueShare),
      action: "Use Curva ABC e concentração de receita para decidir estoque, combos e exposição.",
      tone: productMix.top3RevenueShare >= 0.5 ? "amber" : "purple",
      severity: productMix.top3RevenueShare >= 0.5 ? "Atenção" : "Oportunidade",
    })
  }

  if (periodMode === "month" && discountShare > 0) {
    addAlert({
      title: "Descontos acumulados no mês",
      detail: "Em recorte mensal, descontos deixam de ser evento pontual e viram leitura de margem.",
      metric: formatPercent(discountShare),
      action: "Separe campanha planejada de desconto sem motivo informado pela Saipos.",
      tone: discountShare >= 0.06 ? "amber" : "purple",
      severity: discountShare >= 0.06 ? "Atenção" : "Oportunidade",
    })
  }

  if (periodMode === "year" && topSaleType) {
    addAlert({
      title: "Dependência anual de canal",
      detail: `No ano, ${topSaleType.name} aparece como o principal canal do faturamento operacional.`,
      metric: formatPercent(topSaleTypeShare),
      action: "Use essa visão para revisar dependência estratégica, taxa e recorrência por canal.",
      tone: topSaleTypeShare >= 0.65 ? "amber" : "purple",
      severity: topSaleTypeShare >= 0.65 ? "Atenção" : "Oportunidade",
    })
  }

  if (periodMode === "year" && productMix && classAShare > 0) {
    addAlert({
      title: "Curva A no acumulado anual",
      detail: "Em visão anual, a Curva A mostra quais produtos sustentam a operação por mais tempo.",
      metric: formatPercent(classAShare),
      action: "Proteja ficha técnica, fornecedor e precificação dos itens da Curva A.",
      tone: classAShare >= 0.75 ? "amber" : "lime",
      severity: classAShare >= 0.75 ? "Atenção" : "Estável",
    })
  }

  if (summary.cancellationRate >= 0.05) {
    addAlert({
      title: "Cancelamento pede atenção",
      detail: `${summary.canceledOrders} pedidos cancelados no ${periodNoun} analisado.`,
      metric: formatPercent(summary.cancellationRate),
      action: "Abra Dados Brutos e confira canal, unidade e horários com mais cancelamentos.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (summary.cancellationRate >= 0.1) {
    addAlert({
      title: "Cancelamento crítico",
      detail: "A taxa de cancelamento passou de dois dígitos e pode estar corroendo venda e operação.",
      metric: formatPercent(summary.cancellationRate),
      action: "Separe cancelamentos por canal e horário antes de analisar ticket ou produto.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (summary.canceledInCents > 0 && canceledValueShare >= 0.04) {
    addAlert({
      title: "Valor cancelado relevante",
      detail: "Além da quantidade de pedidos, o valor cancelado também pesa no faturamento potencial.",
      metric: formatMoneyFromAmount(summary.canceledInCents / 100),
      action: "Priorize pedidos cancelados com maior valor para entender causa e canal.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (summary.cancellationRate > 0 && summary.cancellationRate < 0.02 && summary.orders >= 30) {
    addAlert({
      title: "Cancelamento sob controle",
      detail: "A operação manteve cancelamentos baixos mesmo com volume mínimo relevante.",
      metric: formatPercent(summary.cancellationRate),
      action: "Use esse período como referência de atendimento e despacho.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (discountShare >= 0.08) {
    addAlert({
      title: "Descontos pesando",
      detail: "A participação de descontos sobre a venda bruta está alta para o período.",
      metric: formatPercent(discountShare),
      action: "Confira se os descontos vêm de campanha planejada, cupom ou ajuste manual.",
      tone: "amber",
      severity: "Atenção",
    })
  } else if (summary.discountInCents > 0 && discountShare < 0.03) {
    addAlert({
      title: "Desconto controlado",
      detail: "Há desconto no período, mas o peso sobre a venda bruta segue baixo.",
      metric: formatPercent(discountShare),
      action: "Mantenha acompanhamento para evitar erosão silenciosa da margem.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (increaseShare >= 0.03) {
    addAlert({
      title: "Acréscimos ajudam receita",
      detail: "Taxas e acréscimos têm participação perceptível no faturamento líquido.",
      metric: formatMoneyFromAmount(summary.increaseInCents / 100),
      action: "Valide se esses acréscimos são recorrentes e conciliáveis no financeiro.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (summary.averageTicketInCents < 4500 && summary.orders >= 20) {
    addAlert({
      title: "Ticket médio baixo",
      detail: "O volume existe, mas o valor médio por pedido está abaixo de uma faixa saudável.",
      metric: formatMoneyFromAmount(summary.averageTicketInCents / 100),
      action: "Teste combos, adicionais e sugestões no canal de maior volume.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (summary.averageTicketInCents >= 12000 && summary.orders >= 20) {
    addAlert({
      title: "Ticket médio forte",
      detail: "O período tem boa eficiência de venda por pedido.",
      metric: formatMoneyFromAmount(summary.averageTicketInCents / 100),
      action: "Identifique canal, unidade e produtos que puxaram esse ticket.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (averageItemsPerOrder > 0 && averageItemsPerOrder < 1.4 && summary.orders >= 20) {
    addAlert({
      title: "Poucos itens por pedido",
      detail: "Os pedidos estão saindo enxutos, com pouca composição de adicionais ou acompanhamentos.",
      metric: formatQuantity(averageItemsPerOrder),
      action: "Reforce venda sugestiva nos produtos líderes e combos de acompanhamento.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (averageItemsPerOrder >= 2.4 && summary.orders >= 20) {
    addAlert({
      title: "Boa composição por pedido",
      detail: "A quantidade média de itens indica pedidos mais completos.",
      metric: formatQuantity(averageItemsPerOrder),
      action: "Preserve a oferta que está puxando adicionais e acompanhamentos.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (customerCoverage < 0.35 && summary.orders > 0) {
    addAlert({
      title: "Pouco cliente identificável",
      detail: "A base fica fraca para recorrência, CRM e análise de novos vs. recorrentes.",
      metric: formatPercent(customerCoverage),
      action: "Priorize telefone/documento nos canais próprios e cadastro no balcão.",
      tone: "purple",
      severity: "Oportunidade",
    })
  } else if (customerCoverage >= 0.7) {
    addAlert({
      title: "Boa leitura de clientes",
      detail: "A maior parte dos pedidos tem identificação suficiente para análises de recorrência.",
      metric: formatPercent(customerCoverage),
      action: "Use a aba Vendas e Clientes para encontrar clientes recorrentes e canais fortes.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (customerCoverage >= 0.45 && customerCoverage < 0.7) {
    addAlert({
      title: "Cadastro parcialmente útil",
      detail: "A base já permite alguma leitura de clientes, mas ainda há espaço para melhorar identificação.",
      metric: formatPercent(customerCoverage),
      action: "Comece pelos canais próprios, onde o ajuste de cadastro tende a ser mais fácil.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (storeRows.length > 1 && topStore && topStoreShare >= 0.45) {
    addAlert({
      title: "Receita concentrada em unidade",
      detail: `${topStore.name} concentra uma fatia alta do faturamento do período.`,
      metric: formatPercent(topStoreShare),
      action: "Compare operação, canal e ticket das demais unidades para replicar o padrão.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (storeRows.length > 1) {
    const weakStore = [...storeRows].filter((store) => store.orders > 0).sort((first, second) => first.revenueInCents - second.revenueInCents)[0]
    if (weakStore && weakStore.revenueInCents > 0 && topStore && weakStore.idStore !== topStore.idStore) {
      addAlert({
        title: "Unidade abaixo da rede",
        detail: `${weakStore.name} aparece como menor faturamento entre as unidades com venda.`,
        metric: formatMoneyFromAmount(weakStore.revenueInCents / 100),
        action: "Compare canal, ticket e cancelamento dessa unidade contra as líderes.",
        tone: "purple",
        severity: "Oportunidade",
      })
    }

    const highCancelStore = [...storeRows].filter((store) => store.orders >= 5).sort((first, second) => second.cancellationRate - first.cancellationRate)[0]
    if (highCancelStore && highCancelStore.cancellationRate >= 0.05) {
      addAlert({
        title: "Unidade com cancelamento alto",
        detail: `${highCancelStore.name} concentra uma taxa de cancelamento que merece investigação.`,
        metric: formatPercent(highCancelStore.cancellationRate),
        action: "Abra a unidade isolada no filtro e cruze com canal e horário.",
        tone: "amber",
        severity: "Atenção",
      })
    }

    const bestTicketStore = [...storeRows].filter((store) => store.orders >= 5).sort((first, second) => second.averageTicketInCents - first.averageTicketInCents)[0]
    if (bestTicketStore) {
      addAlert({
        title: "Unidade com melhor ticket",
        detail: `${bestTicketStore.name} lidera o ticket médio entre unidades com volume mínimo.`,
        metric: formatMoneyFromAmount(bestTicketStore.averageTicketInCents / 100),
        action: "Entenda mix e canal dessa unidade para replicar a venda sugestiva.",
        tone: "lime",
        severity: "Estável",
      })
    }
  }

  if (topSaleType && topSaleTypeShare >= 0.65) {
    addAlert({
      title: "Canal dominante",
      detail: `${topSaleType.name} concentra a maior parte dos pedidos válidos.`,
      metric: formatPercent(topSaleTypeShare),
      action: "Verifique se margem, taxa e operação desse canal sustentam a dependência.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (saleTypes.length >= 3 && topSaleTypeShare < 0.5) {
    addAlert({
      title: "Canais bem distribuídos",
      detail: "Nenhum canal concentra sozinho a maior parte dos pedidos.",
      metric: formatPercent(topSaleTypeShare),
      action: "Use essa distribuição para testar campanhas sem depender de um único canal.",
      tone: "lime",
      severity: "Estável",
    })
  }

  const weakSaleType = [...saleTypes].filter((type) => type.value > 0).sort((first, second) => first.value - second.value)[0]
  if (weakSaleType && summary.orders >= 30 && weakSaleType.value / summary.orders <= 0.05) {
    addAlert({
      title: "Canal quase parado",
      detail: `${weakSaleType.name} aparece com baixa participação no período.`,
      metric: formatPercent(weakSaleType.value / summary.orders),
      action: "Confira se o canal está ativo, com cardápio disponível e horário correto.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (operational && isShortPeriod && operational.averageDeliveryMinutes >= 60) {
    addAlert({
      title: "Entrega acima do ideal",
      detail: "O tempo médio de entrega está alto para uma operação de delivery recorrente.",
      metric: `${Math.round(operational.averageDeliveryMinutes)} min`,
      action: "Confira bairros, raio de entrega e acúmulo nos horários de pico.",
      tone: "amber",
      severity: "Atenção",
    })
  } else if (operational && isShortPeriod && operational.averageDeliveryMinutes > 0 && operational.averageDeliveryMinutes <= 35) {
    addAlert({
      title: "Entrega em bom ritmo",
      detail: "O tempo médio de entrega está em uma faixa saudável para o período.",
      metric: `${Math.round(operational.averageDeliveryMinutes)} min`,
      action: "Mantenha esse padrão nos bairros e horários com maior volume.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (operational && isShortPeriod && operational.averageDeliveryMinutes >= 45 && operational.averageDeliveryMinutes < 60) {
    addAlert({
      title: "Entrega em zona de atenção",
      detail: "O tempo médio ainda não é crítico, mas já pode afetar experiência e recompra.",
      metric: `${Math.round(operational.averageDeliveryMinutes)} min`,
      action: "Monitore bairros e horários antes que a média passe de uma hora.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (operational && operational.averageDeliveryFeeInCents >= 1000) {
    addAlert({
      title: "Taxa média de entrega alta",
      detail: "A taxa média pode virar barreira de conversão nos canais de delivery.",
      metric: formatMoneyFromAmount(operational.averageDeliveryFeeInCents / 100),
      action: "Compare bairros, raio e canal para entender onde a taxa pesa mais.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (operational && operational.averageDeliveryFeeInCents > 0 && operational.averageDeliveryFeeInCents <= 350) {
    addAlert({
      title: "Taxa de entrega competitiva",
      detail: "A taxa média de entrega está baixa e pode ajudar conversão.",
      metric: formatMoneyFromAmount(operational.averageDeliveryFeeInCents / 100),
      action: "Use isso em ofertas locais sem comprometer margem logística.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (operational && isShortPeriod && operational.averagePrepMinutes >= 25) {
    addAlert({
      title: "Preparo pressionado",
      detail: "Os itens finalizados indicam tempo médio de preparo elevado.",
      metric: `${Math.round(operational.averagePrepMinutes)} min`,
      action: "Revise gargalos de cozinha, praça quente e montagem nos produtos mais vendidos.",
      tone: "amber",
      severity: "Atenção",
    })
  } else if (operational && isShortPeriod && operational.averagePrepMinutes > 0 && operational.averagePrepMinutes <= 12) {
    addAlert({
      title: "Preparo ágil",
      detail: "A cozinha está finalizando itens em bom tempo médio.",
      metric: `${Math.round(operational.averagePrepMinutes)} min`,
      action: "Use esse período como referência de escala e organização da praça.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (operational && isShortPeriod && operational.averagePrepMinutes >= 18 && operational.averagePrepMinutes < 25) {
    addAlert({
      title: "Preparo começando a alongar",
      detail: "A cozinha ainda não está crítica, mas o tempo médio já merece acompanhamento.",
      metric: `${Math.round(operational.averagePrepMinutes)} min`,
      action: "Cruze com horário de pico e produtos mais vendidos.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (operational && operational.finishedItems === 0 && productMix && productMix.totalQuantity > 0) {
    addAlert({
      title: "Sem baixa de preparo",
      detail: "Há itens vendidos, mas nenhum item aparece como finalizado no KDS.",
      metric: "0 itens",
      action: "Confirme se a unidade usa KDS ou se a integração de status está chegando.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (operational && deletedItemShare >= 0.03) {
    addAlert({
      title: "Itens removidos acima do normal",
      detail: "A proporção de itens removidos pode indicar erro de lançamento ou ajuste operacional.",
      metric: formatPercent(deletedItemShare),
      action: "Investigue operador, produto e horário com maior volume de remoções.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (operational && operational.deletedItems > 0 && deletedItemShare < 0.03) {
    addAlert({
      title: "Remoções baixas",
      detail: "Existem itens removidos, mas em proporção pequena dentro do fluxo operacional.",
      metric: formatPercent(deletedItemShare),
      action: "Mantenha acompanhamento em dias de maior movimento.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (operational && deliveryShare >= 0.75) {
    addAlert({
      title: "Operação muito dependente do delivery",
      detail: "A maior parte dos pedidos vem de entrega, aumentando peso de taxa, logística e prazo.",
      metric: formatPercent(deliveryShare),
      action: "Acompanhe taxa média, bairros e canais para proteger margem.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (operational && deliveryShare > 0 && deliveryShare <= 0.35) {
    addAlert({
      title: "Delivery com baixa participação",
      detail: "O delivery representa uma fatia pequena do movimento no período.",
      metric: formatPercent(deliveryShare),
      action: "Confira se a estratégia do período é salão/balcão ou se há canal online subaproveitado.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (topDeliveryMode && topDeliveryModeShare >= 0.8) {
    addAlert({
      title: "Entrega concentrada em um responsável",
      detail: `${topDeliveryMode.name} concentra a maior parte das entregas.`,
      metric: formatPercent(topDeliveryModeShare),
      action: "Monitore prazo, taxa e disponibilidade desse modelo de entrega.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (topDistrict && topDistrictShare >= 0.18) {
    addAlert({
      title: "Bairro com alta concentração",
      detail: `${topDistrict.name} concentra uma fatia relevante das entregas.`,
      metric: formatPercent(topDistrictShare),
      action: "Use o bairro para campanhas locais e análise de raio/logística.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (unknownDistrictShare >= 0.08) {
    addAlert({
      title: "Bairro não informado relevante",
      detail: "Uma parte das entregas está sem bairro mapeado, enfraquecendo análise logística.",
      metric: formatPercent(unknownDistrictShare),
      action: "Revise cadastro/endereço dos canais que chegam sem bairro.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (operational && isShortPeriod && peakHour && summary.orders > 0 && peakHour.value / summary.orders >= 0.22) {
    addAlert({
      title: "Pico concentrado de pedidos",
      detail: `${peakHour.name} concentra uma fatia relevante do movimento.`,
      metric: formatPercent(peakHour.value / summary.orders),
      action: "Ajuste escala, pré-preparo e despacho para esse intervalo.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (operational && isShortPeriod && peakHour && peakHour.value >= 20) {
    addAlert({
      title: "Horário de maior pressão",
      detail: `${peakHour.name} foi o horário mais carregado do período.`,
      metric: `${formatQuantity(peakHour.value)} pedidos`,
      action: "Prepare escala, insumos e despacho antes desse intervalo.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (isShortPeriod && quietHour && peakHour && peakHour.value >= quietHour.value * 5 && quietHour.value > 0) {
    addAlert({
      title: "Movimento muito desigual por horário",
      detail: `O pico de ${peakHour.name} ficou muito acima do horário mais fraco com venda.`,
      metric: `${formatQuantity(peakHour.value)} vs ${formatQuantity(quietHour.value)}`,
      action: "Use a diferença para ajustar escala sem inflar custo em horário fraco.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (payments && splitPaymentShare >= 0.08) {
    addAlert({
      title: "Pagamentos divididos relevantes",
      detail: "Uma parte dos pedidos usa mais de uma forma de pagamento.",
      metric: formatPercent(splitPaymentShare),
      action: "Confira conciliação e consistência dos meios de pagamento no financeiro.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (payments && payments.splitPaymentOrders === 0 && summary.orders >= 20) {
    addAlert({
      title: "Sem pagamentos divididos",
      detail: "Todos os pedidos do período aparecem com pagamento único.",
      metric: "0 pedidos",
      action: "Isso é bom para conciliação; confirme se canais externos não agrupam dados.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (topPayment && topPaymentShare >= 0.55) {
    addAlert({
      title: "Meio de pagamento dominante",
      detail: `${topPayment.name} concentra mais da metade do valor capturado em pagamentos.`,
      metric: formatPercent(topPaymentShare),
      action: "Confira taxas e prazos de recebimento desse meio.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (payments?.capturedInCents && Math.abs(payments.capturedInCents - summary.netInCents) / summary.netInCents >= 0.03) {
    addAlert({
      title: "Pagamentos não batem com vendas",
      detail: "O total capturado nos pagamentos difere do faturamento líquido do período.",
      metric: formatMoneyFromAmount((payments.capturedInCents - summary.netInCents) / 100),
      action: "Verifique pagamentos online, múltiplos meios e pedidos integrados.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (
    activeDays.length >= 3 &&
    strongestDay &&
    weakestDay &&
    averageDailyRevenue > 0 &&
    strongestDay.netInCents > averageDailyRevenue * 1.6
  ) {
    addAlert({
      title: "Faturamento oscilando",
      detail: `${strongestDay.label} puxou o período; ${weakestDay.label} ficou bem abaixo.`,
      metric: formatMoneyFromAmount(strongestDay.netInCents / 100),
      action: "Use o gráfico de evolução para separar sazonalidade de falha operacional.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (activeDays.length >= 3 && weakestDay && averageDailyRevenue > 0 && weakestDay.netInCents < averageDailyRevenue * 0.55) {
    addAlert({
      title: "Dia fraco fora da curva",
      detail: `${weakestDay.label} ficou muito abaixo da média dos dias com movimento.`,
      metric: formatMoneyFromAmount(weakestDay.netInCents / 100),
      action: "Confira clima, campanha, disponibilidade de canal e operação desse dia.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (activeDays.length >= 5 && strongestDay && weakestDay && strongestDay.netInCents <= averageDailyRevenue * 1.25) {
    addAlert({
      title: "Faturamento consistente",
      detail: "Os dias com venda estão mais próximos da média, sem pico extremo.",
      metric: formatMoneyFromAmount(averageDailyRevenue / 100),
      action: "Use o padrão para planejar compra e escala com menor risco.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (activeDays.length > 0 && activeDays.length < dailyRevenue.length) {
    addAlert({
      title: "Período com dias sem venda",
      detail: "Nem todos os dias do intervalo selecionado têm pedidos válidos.",
      metric: `${activeDays.length}/${dailyRevenue.length}`,
      action: "Confirme se são dias fechados, falha de sync ou filtro de unidade.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (productMix && productMix.top3RevenueShare >= 0.5) {
    addAlert({
      title: "Mix dependente de poucos produtos",
      detail: "Os três principais itens sustentam metade ou mais da receita de produtos.",
      metric: formatPercent(productMix.top3RevenueShare),
      action: "Veja Mix de Produtos para proteger estoque e testar combos nos itens líderes.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (topProduct && topProductShare >= 0.22) {
    addAlert({
      title: "Produto líder muito forte",
      detail: `${topProduct.name} sozinho representa uma fatia alta da receita de produtos.`,
      metric: formatPercent(topProductShare),
      action: "Garanta estoque e mantenha alternativa caso o item fique indisponível.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (topProduct && topProduct.quantity >= 20) {
    addAlert({
      title: "Produto com alto giro",
      detail: `${topProduct.name} lidera a saída em quantidade no período.`,
      metric: `${formatQuantity(topProduct.quantity)} un.`,
      action: "Proteja pré-preparo, embalagem e insumos desse item.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (lowTurnoverProduct && paidProducts.length >= 8) {
    addAlert({
      title: "Produto com baixo giro",
      detail: `${lowTurnoverProduct.name} teve pouca saída entre os produtos pagos.`,
      metric: `${formatQuantity(lowTurnoverProduct.quantity)} un.`,
      action: "Reavalie exposição no cardápio, foto, preço ou permanência do item.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (productMix && productMix.zeroRevenueProducts >= 5) {
    addAlert({
      title: "Muitos itens sem receita direta",
      detail: "Há vários produtos/adicionais aparecendo sem valor direto no mix.",
      metric: `${productMix.zeroRevenueProducts} itens`,
      action: "Confira se são acompanhamentos esperados ou cadastro com preço zerado.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (productMix && classAShare >= 0.75) {
    addAlert({
      title: "Curva A muito concentrada",
      detail: "Poucos itens da curva A sustentam grande parte da receita de produtos.",
      metric: formatPercent(classAShare),
      action: "Use a curva A para prioridade de estoque e treinamento de venda.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (productMix && productMix.choices.length > 0) {
    const choice = productMix.choices[0]
    addAlert({
      title: "Adicional pago com tração",
      detail: `${choice.name} aparece entre os adicionais pagos com maior saída.`,
      metric: formatMoneyFromAmount(choice.revenueInCents / 100),
      action: "Destaque esse adicional em produtos compatíveis.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (productMix && productMix.volumeOpportunities.length > 0) {
    const first = productMix.volumeOpportunities[0]
    addAlert({
      title: "Volume com ticket baixo",
      detail: `${first.name} tem boa saída, mas valor médio abaixo da média do mix.`,
      metric: formatMoneyFromAmount(first.averageUnitPriceInCents / 100),
      action: "Teste adicional, combo ou sugestão de acompanhamento nesse grupo.",
      tone: "purple",
      severity: "Oportunidade",
    })
  }

  if (summary.orders >= 50 && summary.cancellationRate < 0.03) {
    addAlert({
      title: "Operação estável",
      detail: "Volume relevante com cancelamentos sob controle no período atual.",
      metric: `${summary.orders} pedidos`,
      action: "Acompanhe ticket e mix para buscar ganho sem mexer na base operacional.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (isLongPeriod && summary.orders >= 500) {
    addAlert({
      title: "Alto volume operacional",
      detail: "O período concentra um volume grande de pedidos válidos.",
      metric: `${formatQuantity(summary.orders)} pedidos`,
      action: "Use esse recorte para benchmark de escala, cozinha e logística.",
      tone: "lime",
      severity: "Estável",
    })
  }

  if (summary.orders < 20) {
    addAlert({
      title: "Amostra pequena",
      detail: "O período tem poucos pedidos, então percentuais podem oscilar com facilidade.",
      metric: `${summary.orders} pedidos`,
      action: "Amplie o intervalo antes de tomar decisão estrutural.",
      tone: "amber",
      severity: "Atenção",
    })
  }

  if (alerts.length === 0) {
    addAlert({
      title: "Sem sinais críticos",
      detail: "Os principais indicadores do período não passaram dos limites de atenção.",
      metric: formatMoneyFromAmount(summary.netInCents / 100),
      action: "Use as abas específicas para aprofundar canal, ticket, produtos e operação.",
      tone: "lime",
      severity: "Estável",
    })
  }

  const severityWeight: Record<SaiposDashboardAlert["severity"], number> = {
    Atenção: 0,
    Oportunidade: 1,
    Estável: 2,
  }

  return alerts.sort((first, second) => severityWeight[first.severity] - severityWeight[second.severity])
}
