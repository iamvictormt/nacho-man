import {
  formatPercent,
  formatSignedPercent,
} from "@/lib/saipos/formatters"
import { addUtcDays, toBrazilDateInputValue, toDateInputValue, toPeriodStart } from "@/lib/saipos/period"
import type { SaiposDashboardSale, SaiposDashboardSaleItem, SaiposProductReference } from "@/lib/saipos/dashboard-queries"

export type SaiposDashboardTone = "lime" | "purple" | "amber" | "neutral"

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

  return typeof current === "string" && current.trim() ? current.trim() : null
}

function getRawStringOrFirst(value: unknown, path: string[]) {
  let current = value

  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return null
    current = (current as Record<string, unknown>)[key]
  }

  if (typeof current === "string" && current.trim()) return current.trim()
  if (Array.isArray(current)) {
    const first = current.find((item) => typeof item === "string" && item.trim())
    return typeof first === "string" ? first.trim() : null
  }

  return null
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

function getItemProductKey(item: SaiposDashboardSaleItem) {
  if (typeof item.idStoreItem === "number") return `${item.idStore}:item:${item.idStoreItem}`

  const integrationCode = getRawStringFromObject(item.raw, "integration_code")
  if (integrationCode) return `${item.idStore}:code:${normalizeProductKeyText(integrationCode)}`

  const nameKey = normalizeProductKeyText(item.descSaleItem)
  return `${item.idStore}:name:${nameKey}`
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
    row.share = totalRevenueInCents > 0 ? row.revenueInCents / totalRevenueInCents : 0
    cumulative += row.share
    row.cumulativeShare = cumulative
    row.abc = cumulative <= 0.8 ? "A" : cumulative <= 0.95 ? "B" : "C"
  }

  const totalQuantity = rows.reduce((total, item) => total + item.quantity, 0)
  const choiceRows = getChoiceRows(items)
  const lowTurnover = [...rows]
    .filter((item) => item.quantity > 0 && item.revenueInCents > 0)
    .sort((a, b) => a.quantity - b.quantity || a.revenueInCents - b.revenueInCents)
    .slice(0, 5)
  const includedItems = [...rows]
    .filter((item) => item.quantity > 0 && item.revenueInCents === 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
  const paidChoices = choiceRows.filter((item) => item.revenueInCents > 0)
  const includedChoices = choiceRows.filter((item) => item.revenueInCents === 0).slice(0, 5)

  return {
    rows,
    topProducts: rows.filter((item) => item.revenueInCents > 0).slice(0, 8),
    lowTurnover,
    includedItems,
    choices: paidChoices,
    includedChoices,
    totalProducts: rows.length,
    totalQuantity,
    totalRevenueInCents,
    zeroRevenueProducts: rows.filter((item) => item.revenueInCents === 0).length,
    classARevenueInCents: rows.filter((item) => item.abc === "A").reduce((total, item) => total + item.revenueInCents, 0),
  }
}

export function buildAlerts({
  summary,
  comparisonSummary,
  customerCoverage,
}: {
  summary: ReturnType<typeof summarizeSales>
  comparisonSummary?: ReturnType<typeof summarizeSales>
  customerCoverage: number
}) {
  const revenueGrowth = comparisonSummary ? percentChange(summary.netInCents, comparisonSummary.netInCents) : null
  const ticketGrowth = comparisonSummary ? percentChange(summary.averageTicketInCents, comparisonSummary.averageTicketInCents) : null
  const alerts: Array<{ title: string; detail: string; tone: SaiposDashboardTone }> = []

  if (comparisonSummary && revenueGrowth !== null && revenueGrowth < -0.1) {
    alerts.push({
      title: "Faturamento abaixo",
      detail: `O período está ${formatSignedPercent(revenueGrowth)} contra a referência.`,
      tone: "amber",
    })
  }

  if (comparisonSummary && ticketGrowth !== null && ticketGrowth < -0.08) {
    alerts.push({
      title: "Ticket médio em queda",
      detail: `O período está ${formatSignedPercent(ticketGrowth)} contra a referência.`,
      tone: "amber",
    })
  }

  if (summary.cancellationRate >= 0.05) {
    alerts.push({
      title: "Cancelamento alto",
      detail: `${formatPercent(summary.cancellationRate)} dos registros no período.`,
      tone: "amber",
    })
  }

  if (customerCoverage < 0.35 && summary.orders > 0) {
    alerts.push({
      title: "Base de clientes fraca",
      detail: `${formatPercent(customerCoverage)} dos pedidos válidos têm cliente identificável.`,
      tone: "purple",
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      title: "Sem alertas críticos",
      detail: "Cancelamentos e identificação de clientes estão dentro de uma leitura saudável para o período.",
      tone: "lime",
    })
  }

  return alerts
}
