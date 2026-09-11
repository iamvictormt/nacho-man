import type { OrderStatus } from "@prisma/client"

export const itemLockStatuses: OrderStatus[] = [
  "PAYMENT_CONFIRMED",
  "INVOICED",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]

export function canEditOrderItems(status: string, history: { status: string }[]) {
  return ![status, ...history.map((entry) => entry.status)].some((value) =>
    itemLockStatuses.includes(value as OrderStatus)
  )
}
