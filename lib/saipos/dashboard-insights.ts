import type { SaiposDashboardSale, SaiposDashboardSaleItem } from "@/lib/saipos/dashboard-queries"
import { getCustomerIdentity, getPartnerLabel, getSaleGrossAmountInCents, isCanceled } from "@/lib/saipos/dashboard-metrics"

type RankedNumber = {
  name: string
  value: number
  detail: string
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function getRaw(value: unknown, path: string[]) {
  let current = value

  for (const key of path) {
    const record = asRecord(current)
    if (!record || !(key in record)) return null
    current = record[key]
  }

  return current
}

function getRawString(value: unknown, path: string[]) {
  const current = getRaw(value, path)
  return typeof current === "string" && current.trim() ? current.trim() : null
}

function getRawNumber(value: unknown, path: string[]) {
  const current = getRaw(value, path)
  const parsed = typeof current === "number" ? current : typeof current === "string" ? Number(current) : Number.NaN
  return Number.isFinite(parsed) ? parsed : null
}

function getRawArray(value: unknown, path: string[]) {
  const current = getRaw(value, path)
  return Array.isArray(current) ? current : []
}

function amountToCents(value: number | null) {
  return Math.round((value ?? 0) * 100)
}

function getDeliveryModeLabel(value: string | null) {
  if (value === "MERCHANT") return "Entrega própria da loja"
  if (value === "PARTNER") return "Entrega pelo parceiro"
  return value ?? "Sem responsável"
}

function sortRanked(rows: Map<string, RankedNumber>, limit = 8) {
  return Array.from(rows.values())
    .sort((first, second) => second.value - first.value)
    .slice(0, limit)
}

export function buildPaymentInsights(sales: SaiposDashboardSale[]) {
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const rows = new Map<string, RankedNumber>()
  let capturedInCents = 0
  let splitPaymentOrders = 0

  for (const sale of validSales) {
    const payments = getRawArray(sale.raw, ["payments"])
    if (payments.length > 1) splitPaymentOrders += 1

    for (const payment of payments) {
      const name = getRawString(payment, ["desc_store_payment_type"]) ?? "Não informado"
      const value = amountToCents(getRawNumber(payment, ["payment_amount"]))
      const current = rows.get(name) ?? { name, value: 0, detail: "0 lançamentos" }
      current.value += value
      const count = Number(current.detail.split(" ")[0]) + 1
      current.detail = `${count} lançamentos`
      rows.set(name, current)
      capturedInCents += value
    }
  }

  return {
    capturedInCents,
    splitPaymentOrders,
    rows: sortRanked(rows),
  }
}

export function buildCommercialFinanceInsights(sales: SaiposDashboardSale[]) {
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const discountReasons = new Map<string, RankedNumber>()
  const increases = new Map<string, RankedNumber>()
  const partnerRevenue = new Map<string, RankedNumber>()
  let fiscalOrders = 0
  let fiscalAmountInCents = 0

  for (const sale of validSales) {
    const partner = getPartnerLabel(sale)
    const partnerRow = partnerRevenue.get(partner) ?? { name: partner, value: 0, detail: "0 pedidos" }
    partnerRow.value += sale.totalAmountInCents
    partnerRow.detail = `${Number(partnerRow.detail.split(" ")[0]) + 1} pedidos`
    partnerRevenue.set(partner, partnerRow)

    if (sale.totalDiscountInCents > 0) {
      const reason =
        getRawString(sale.raw, ["discount_coupon"]) ?? getRawString(sale.raw, ["discount_reason"]) ?? "Desconto sem motivo"
      const current = discountReasons.get(reason) ?? { name: reason, value: 0, detail: "0 pedidos" }
      current.value += sale.totalDiscountInCents
      current.detail = `${Number(current.detail.split(" ")[0]) + 1} pedidos`
      discountReasons.set(reason, current)
    }

    if (sale.totalIncreaseInCents > 0) {
      const reason = getRawString(sale.raw, ["increase_reason"]) ?? "Acréscimo sem motivo"
      const current = increases.get(reason) ?? { name: reason, value: 0, detail: "0 pedidos" }
      current.value += sale.totalIncreaseInCents
      current.detail = `${Number(current.detail.split(" ")[0]) + 1} pedidos`
      increases.set(reason, current)
    }

    if (asRecord(getRaw(sale.raw, ["nfce"]))) {
      fiscalOrders += 1
      fiscalAmountInCents += sale.totalAmountInCents
    }
  }

  return {
    discountReasons: sortRanked(discountReasons),
    increases: sortRanked(increases),
    partnerRevenue: sortRanked(partnerRevenue),
    fiscalOrders,
    fiscalAmountInCents,
  }
}

export function buildOperationalInsights(sales: SaiposDashboardSale[], items: SaiposDashboardSaleItem[]) {
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const districts = new Map<string, RankedNumber>()
  const deliveryModes = new Map<string, RankedNumber>()
  const hours = new Map<string, RankedNumber>()
  let deliveryOrders = 0
  let deliveryTimeMinutes = 0
  let deliveryTimeSamples = 0
  let deliveryFeeInCents = 0

  for (const sale of validSales) {
    const hour = `${String(sale.createdAtSaipos.getHours()).padStart(2, "0")}h`
    const hourRow = hours.get(hour) ?? { name: hour, value: 0, detail: "0 pedidos" }
    hourRow.value += 1
    hourRow.detail = `${hourRow.value} pedidos`
    hours.set(hour, hourRow)

    const delivery = asRecord(getRaw(sale.raw, ["delivery"]))
    if (!delivery) continue

    deliveryOrders += 1
    deliveryFeeInCents += amountToCents(getRawNumber(delivery, ["delivery_fee"]))

    const deliveryTime = getRawNumber(delivery, ["delivery_time"])
    if (deliveryTime !== null) {
      deliveryTimeMinutes += deliveryTime
      deliveryTimeSamples += 1
    }

    const district = getRawString(delivery, ["district"]) ?? "Bairro não informado"
    const districtRow = districts.get(district) ?? { name: district, value: 0, detail: "0 entregas" }
    districtRow.value += 1
    districtRow.detail = `${districtRow.value} entregas`
    districts.set(district, districtRow)

    const mode = getDeliveryModeLabel(getRawString(delivery, ["delivery_by"]))
    const modeRow = deliveryModes.get(mode) ?? { name: mode, value: 0, detail: "0 entregas" }
    modeRow.value += 1
    modeRow.detail = `${modeRow.value} entregas`
    deliveryModes.set(mode, modeRow)
  }

  const prepSamples = items
    .map((item) => {
      if (!item.createdAtSaipos || !item.doneAt) return null
      const seconds = Math.round((item.doneAt.getTime() - item.createdAtSaipos.getTime()) / 1000)
      return seconds > 0 ? seconds : null
    })
    .filter((value): value is number => typeof value === "number")

  const deletedItems = items.filter((item) => item.deleted).length
  const finishedItems = items.filter((item) => item.doneAt).length

  return {
    deliveryOrders,
    averageDeliveryMinutes: deliveryTimeSamples > 0 ? deliveryTimeMinutes / deliveryTimeSamples : 0,
    averageDeliveryFeeInCents: deliveryOrders > 0 ? deliveryFeeInCents / deliveryOrders : 0,
    averagePrepMinutes: prepSamples.length > 0 ? prepSamples.reduce((total, value) => total + value, 0) / prepSamples.length / 60 : 0,
    finishedItems,
    deletedItems,
    districts: sortRanked(districts),
    deliveryModes: sortRanked(deliveryModes),
    hours: Array.from(hours.values()).sort((first, second) => first.name.localeCompare(second.name)),
  }
}

export function buildCustomerInsights(sales: SaiposDashboardSale[]) {
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const customers = validSales.map(getCustomerIdentity)
  const knownCustomers = customers.filter((customer): customer is typeof customer & { key: string } => Boolean(customer.key))
  const customerCounts = new Map<string, number>()

  for (const customer of knownCustomers) {
    customerCounts.set(customer.key, (customerCounts.get(customer.key) ?? 0) + 1)
  }

  const recurringCustomers = Array.from(customerCounts.values()).filter((count) => count > 1).length

  return {
    uniqueCustomers: new Set(knownCustomers.map((customer) => customer.key)).size,
    phoneCustomers: customers.filter((customer) => customer.phone).length,
    documentCustomers: customers.filter((customer) => customer.document).length,
    actionableCustomers: customers.filter((customer) => customer.phone || customer.document).length,
    recurringCustomers,
  }
}

export function buildRawDataInsights(sales: SaiposDashboardSale[], items: SaiposDashboardSaleItem[]) {
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const recentSales = sales.slice(0, 10).map((sale) => ({
    id: `${sale.idStore}-${String(sale.idSale)}`,
    saleNumber: getRawNumber(sale.raw, ["sale_number"]),
    idSale: String(sale.idSale),
    partner: getPartnerLabel(sale),
    customer: getCustomerIdentity(sale).name ?? "Cliente não identificado",
    district: getRawString(sale.raw, ["delivery", "district"]) ?? "Sem entrega",
    amountInCents: sale.totalAmountInCents,
    canceled: sale.canceled,
  }))

  return {
    sales: sales.length,
    validSales: validSales.length,
    items: items.length,
    nfce: validSales.filter((sale) => asRecord(getRaw(sale.raw, ["nfce"]))).length,
    customers: validSales.filter((sale) => getCustomerIdentity(sale).key).length,
    delivery: validSales.filter((sale) => asRecord(getRaw(sale.raw, ["delivery"]))).length,
    payments: validSales.filter((sale) => getRawArray(sale.raw, ["payments"]).length > 0).length,
    smartpos: validSales.filter((sale) => getRawArray(sale.raw, ["payment_transaction_smartpos"]).length > 0).length,
    tef: validSales.filter((sale) => getRawArray(sale.raw, ["payment_transaction_tef"]).length > 0).length,
    grossInCents: validSales.reduce((total, sale) => total + getSaleGrossAmountInCents(sale), 0),
    recentSales,
  }
}
