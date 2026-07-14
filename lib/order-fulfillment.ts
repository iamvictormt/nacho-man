export type OrderFulfillmentMethod = "FACTORY_PICKUP" | "SHIP_BY_CARRIER"

export const orderFulfillmentMethods = ["FACTORY_PICKUP", "SHIP_BY_CARRIER"] as const

export function getOrderFulfillmentLabel(method: OrderFulfillmentMethod | string) {
  return method === "FACTORY_PICKUP" ? "Retirar na fábrica" : "Receber via transportadora"
}

export function getOrderFulfillmentInstruction(method: OrderFulfillmentMethod | string) {
  return method === "FACTORY_PICKUP" ? "Retirada na fábrica" : "Entrega via transportadora"
}
