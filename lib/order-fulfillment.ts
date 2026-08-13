export type OrderFulfillmentMethod = "FACTORY_PICKUP" | "SHIP_BY_CARRIER"

export const orderFulfillmentMethods = ["FACTORY_PICKUP", "SHIP_BY_CARRIER"] as const
const factoryPickupPreparationBusinessDays = 2
const factoryPickupOpeningHour = 8
const factoryPickupCutoffHour = 12

export function getOrderFulfillmentLabel(method: OrderFulfillmentMethod | string) {
  return method === "FACTORY_PICKUP" ? "Retirar na fábrica" : "Receber via transportadora"
}

export function getOrderFulfillmentInstruction(method: OrderFulfillmentMethod | string) {
  return method === "FACTORY_PICKUP" ? "Retirada na fábrica" : "Entrega via transportadora"
}

function isBusinessDay(date: Date) {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

function getNextBusinessDay(date: Date) {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  next.setHours(factoryPickupOpeningHour, 0, 0, 0)

  while (!isBusinessDay(next)) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

function getOrderReceivedBusinessDay(from: Date) {
  const receivedAt = new Date(from)

  if (!isBusinessDay(receivedAt)) {
    receivedAt.setHours(factoryPickupOpeningHour, 0, 0, 0)
    while (!isBusinessDay(receivedAt)) {
      receivedAt.setDate(receivedAt.getDate() + 1)
    }
    return receivedAt
  }

  if (
    receivedAt.getHours() > factoryPickupCutoffHour ||
    (receivedAt.getHours() === factoryPickupCutoffHour && receivedAt.getMinutes() > 0)
  ) {
    return getNextBusinessDay(receivedAt)
  }

  receivedAt.setHours(factoryPickupOpeningHour, 0, 0, 0)
  return receivedAt
}

function addBusinessDays(date: Date, days: number) {
  const result = new Date(date)
  let remaining = days

  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    if (isBusinessDay(result)) remaining -= 1
  }

  return result
}

export function getFactoryPickupAvailableAt(from = new Date()) {
  const receivedAt = getOrderReceivedBusinessDay(from)
  const availableAt = addBusinessDays(receivedAt, factoryPickupPreparationBusinessDays)
  availableAt.setHours(factoryPickupOpeningHour, 0, 0, 0)

  return availableAt
}

export function formatFactoryPickupAvailableAt(date: Date) {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date)
  const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date)
  const hours = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date)
  const formattedHours = hours.endsWith(":00") ? `${Number(hours.slice(0, 2))}h` : hours.replace(":", "h")

  return `${weekday}, ${dayMonth}, a partir das ${formattedHours}`
}

export function getFactoryPickupEstimateMessage(from = new Date()) {
  return `Seu pedido estará disponível para retirada na ${formatFactoryPickupAvailableAt(
    getFactoryPickupAvailableAt(from)
  )}. Prazo de preparo: 36h a 48h em dias úteis, com pedidos após meio-dia contando a partir do próximo dia útil.`
}
