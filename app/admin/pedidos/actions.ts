"use server"

import { OrderFulfillmentMethod, OrderStatus, PaymentMethod, PromotionScope, type Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { getPaymentDiscountSettings } from "@/lib/site-settings"

function calculateDiscount(type: "PERCENTAGE" | "FIXED", value: number, base: number) {
  return type === "PERCENTAGE" ? Math.round(base * (value / 100)) : Math.min(value, base)
}

function getPaymentDiscountPercent(
  method: "PIX" | "CARD" | "BOLETO",
  settings: Awaited<ReturnType<typeof getPaymentDiscountSettings>>,
  franchisee: boolean
) {
  if (method === "BOLETO") return settings.boletoFranchiseeOnly && !franchisee ? 0 : settings.boletoDiscountPercent
  if (method === "PIX") return settings.pixFranchiseeOnly && !franchisee ? 0 : settings.pixDiscountPercent
  return settings.cardFranchiseeOnly && !franchisee ? 0 : settings.cardDiscountPercent
}

function getProportionalDiscount(discountInCents: number, eligibleBaseInCents: number, totalBaseInCents: number) {
  if (discountInCents <= 0 || eligibleBaseInCents <= 0 || totalBaseInCents <= 0) return 0
  return Math.min(eligibleBaseInCents, Math.round(discountInCents * (eligibleBaseInCents / totalBaseInCents)))
}

function getPaymentDiscountBaseInCents({
  subtotalInCents,
  promotionDiscountInCents,
  couponDiscountInCents,
  franchiseDiscountInCents,
  paymentDiscountEligibleSubtotalInCents,
  paymentDiscountEligiblePromotionDiscountInCents,
}: {
  subtotalInCents: number
  promotionDiscountInCents: number
  couponDiscountInCents: number
  franchiseDiscountInCents: number
  paymentDiscountEligibleSubtotalInCents: number
  paymentDiscountEligiblePromotionDiscountInCents: number
}) {
  const afterPromotions = Math.max(0, subtotalInCents - promotionDiscountInCents)
  const eligibleAfterPromotions = Math.max(
    0,
    paymentDiscountEligibleSubtotalInCents - paymentDiscountEligiblePromotionDiscountInCents
  )
  const eligibleCouponDiscountInCents = getProportionalDiscount(
    couponDiscountInCents,
    eligibleAfterPromotions,
    afterPromotions
  )
  const afterCoupon = Math.max(0, afterPromotions - couponDiscountInCents)
  const eligibleAfterCoupon = Math.max(0, eligibleAfterPromotions - eligibleCouponDiscountInCents)
  const eligibleFranchiseDiscountInCents = getProportionalDiscount(
    franchiseDiscountInCents,
    eligibleAfterCoupon,
    afterCoupon
  )

  return Math.max(0, eligibleAfterCoupon - eligibleFranchiseDiscountInCents)
}

function getSelectedOptions(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return []

  return value
    .map((option) => {
      if (!option || typeof option !== "object") return null
      const record = option as { productId?: unknown; quantity?: unknown }
      const productId = record.productId
      const quantity = record.quantity
      return typeof productId === "string" && typeof quantity === "number" && quantity > 0
        ? { productId, quantity }
        : null
    })
    .filter((option): option is { productId: string; quantity: number } => Boolean(option))
}

async function recalculateOrderTotals(
  tx: Prisma.TransactionClient,
  orderId: string,
  paymentSettings: Awaited<ReturnType<typeof getPaymentDiscountSettings>>,
  note: string
) {
  const now = new Date()
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      coupon: true,
      franchise: { select: { priceDiscount: true } },
      items: {
        include: {
          product: {
            include: {
              promotions: {
                where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
              },
            },
          },
        },
      },
    },
  })

  if (!order) throw new Error("Pedido nao encontrado.")
  if (order.items.length === 0) throw new Error("O pedido precisa ter pelo menos um item.")

  const selectedOptionsByItem = new Map(order.items.map((item) => [item.id, getSelectedOptions(item.selectedOptions)]))
  const selectedProductIds = [
    ...new Set([...selectedOptionsByItem.values()].flatMap((options) => options.map((option) => option.productId))),
  ]
  const selectedProducts = await tx.product.findMany({
    where: { id: { in: selectedProductIds } },
    select: { id: true, paymentDiscountEligible: true },
  })
  const selectedProductEligibility = new Map(
    selectedProducts.map((product) => [product.id, product.paymentDiscountEligible])
  )

  const subtotalInCents = order.items.reduce((total, item) => total + item.totalInCents, 0)
  const productPromotionDiscountInCents = order.items.reduce((total, item) => {
    if (!item.product) return total

    const bestDiscount = item.product.promotions.reduce((best, promotion) => {
      if (
        promotion.scope !== PromotionScope.PRODUCT ||
        (promotion.minimumQuantity && item.quantity < promotion.minimumQuantity)
      ) {
        return best
      }

      return Math.max(best, calculateDiscount(promotion.type, promotion.value, item.totalInCents))
    }, 0)

    return total + bestDiscount
  }, 0)
  const paymentDiscountEligibleSubtotalInCents = order.items.reduce((total, item) => {
    if (item.product) return item.product.paymentDiscountEligible ? total + item.totalInCents : total

    const selectedOptions = selectedOptionsByItem.get(item.id) ?? []
    const selectedTotal = selectedOptions.reduce((sum, option) => sum + option.quantity, 0)
    if (selectedTotal <= 0) return total

    const eligibleUnits = selectedOptions.reduce(
      (sum, option) => sum + (selectedProductEligibility.get(option.productId) ? option.quantity : 0),
      0
    )

    return total + Math.round((item.totalInCents * eligibleUnits) / selectedTotal)
  }, 0)
  const paymentDiscountEligiblePromotionDiscountInCents = order.items.reduce((total, item) => {
    if (!item.product?.paymentDiscountEligible) return total

    const bestDiscount = item.product.promotions.reduce((best, promotion) => {
      if (
        promotion.scope !== PromotionScope.PRODUCT ||
        (promotion.minimumQuantity && item.quantity < promotion.minimumQuantity)
      ) {
        return best
      }

      return Math.max(best, calculateDiscount(promotion.type, promotion.value, item.totalInCents))
    }, 0)

    return total + bestDiscount
  }, 0)
  const afterPromotions = Math.max(0, subtotalInCents - productPromotionDiscountInCents)
  const couponDiscountInCents =
    order.coupon && (order.coupon.minimumInCents === null || afterPromotions >= order.coupon.minimumInCents)
      ? calculateDiscount(order.coupon.type, order.coupon.value, afterPromotions)
      : 0
  const afterCoupon = Math.max(0, afterPromotions - couponDiscountInCents)
  const franchiseDiscountInCents = order.franchise ? Math.round(afterCoupon * (order.franchise.priceDiscount / 100)) : 0
  const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
  const paymentDiscountPercent = getPaymentDiscountPercent(
    order.paymentMethod,
    paymentSettings,
    Boolean(order.franchise)
  )
  const paymentDiscountBaseInCents = getPaymentDiscountBaseInCents({
    subtotalInCents,
    promotionDiscountInCents: productPromotionDiscountInCents,
    couponDiscountInCents,
    franchiseDiscountInCents,
    paymentDiscountEligibleSubtotalInCents,
    paymentDiscountEligiblePromotionDiscountInCents,
  })
  const pixDiscountInCents = Math.round(paymentDiscountBaseInCents * (paymentDiscountPercent / 100))
  const totalInCents = Math.max(0, pixBase - pixDiscountInCents)

  await tx.order.update({
    where: { id: order.id },
    data: {
      subtotalInCents,
      promotionDiscountInCents: productPromotionDiscountInCents + franchiseDiscountInCents,
      couponDiscountInCents,
      pixDiscountInCents,
      totalInCents,
      statusHistory: {
        create: {
          status: order.status,
          note,
        },
      },
    },
  })
}

function revalidateOrderPaths() {
  revalidatePath("/admin")
  revalidatePath("/admin/pedidos")
  revalidatePath("/marketplace")
  revalidatePath("/marketplace/pedidos")
}

const editableOrderStatuses: readonly OrderStatus[] = [
  OrderStatus.AWAITING_SERVICE,
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.PICKING,
  OrderStatus.INVOICED,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
]

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  const status = String(formData.get("status") ?? "") as OrderStatus

  if (!orderId || !editableOrderStatuses.includes(status)) return

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  })
  if (!order || order.status === status || order.status === OrderStatus.CANCELLED) return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      statusHistory: {
        create: { status, note: "Status atualizado pela Nacho Factory." },
      },
    },
  })

  revalidateOrderPaths()
}

export async function updateOrderFulfillmentMethodAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  const fulfillmentMethod = String(formData.get("fulfillmentMethod") ?? "") as OrderFulfillmentMethod

  if (!orderId || !Object.values(OrderFulfillmentMethod).includes(fulfillmentMethod)) return

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, fulfillmentMethod: true },
  })
  if (!order || order.fulfillmentMethod === fulfillmentMethod) return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      fulfillmentMethod,
      statusHistory: {
        create: {
          status: order.status,
          note: "Tipo de entrega atualizado pela Nacho Factory.",
        },
      },
    },
  })

  revalidateOrderPaths()
}

export async function updateOrderPaymentMethodAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  const paymentMethod = String(formData.get("paymentMethod") ?? "") as PaymentMethod

  if (!orderId || !Object.values(PaymentMethod).includes(paymentMethod)) return

  const paymentSettings = await getPaymentDiscountSettings()

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentMethod: true },
    })
    if (!order) throw new Error("Pedido nao encontrado.")
    if (order.status === "CANCELLED") throw new Error("Nao e possivel alterar um pedido cancelado.")
    if (order.paymentMethod === paymentMethod) return

    await tx.order.update({
      where: { id: order.id },
      data: { paymentMethod },
    })
    await recalculateOrderTotals(
      tx,
      order.id,
      paymentSettings,
      `Forma de pagamento alterada pelo admin: ${order.paymentMethod} para ${paymentMethod}.`
    )
  })

  revalidateOrderPaths()
}

export async function updateOrderItemQuantityAction(formData: FormData) {
  await requireAdmin()

  const orderId = String(formData.get("orderId") ?? "")
  const itemId = String(formData.get("itemId") ?? "")
  const quantity = Math.max(1, Math.min(999, Number(formData.get("quantity") ?? 0)))
  if (!orderId || !itemId || !Number.isInteger(quantity)) throw new Error("Informe uma quantidade valida.")

  const paymentSettings = await getPaymentDiscountSettings()

  await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findFirst({
      where: { id: itemId, orderId },
      include: {
        order: { select: { id: true, status: true } },
        product: { select: { minimumQuantity: true } },
      },
    })
    if (!item) throw new Error("Item do pedido nao encontrado.")
    if (item.order.status === "CANCELLED") throw new Error("Nao e possivel alterar um pedido cancelado.")
    if (item.product && quantity < item.product.minimumQuantity) {
      throw new Error(`A quantidade minima para este produto e ${item.product.minimumQuantity}.`)
    }

    await tx.orderItem.update({
      where: { id: item.id },
      data: {
        quantity,
        totalInCents: item.unitPriceInCents * quantity,
      },
    })
    await recalculateOrderTotals(
      tx,
      item.order.id,
      paymentSettings,
      `Quantidade alterada pelo admin: ${item.name} de ${item.quantity} para ${quantity}.`
    )
  })

  revalidateOrderPaths()
}

export async function addOrderProductItemAction(formData: FormData) {
  await requireAdmin()

  const orderId = String(formData.get("orderId") ?? "")
  const productId = String(formData.get("productId") ?? "")
  const quantity = Math.max(1, Math.min(999, Number(formData.get("quantity") ?? 0)))
  if (!orderId || !productId || !Number.isInteger(quantity)) throw new Error("Informe produto e quantidade.")

  const paymentSettings = await getPaymentDiscountSettings()

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, franchiseId: true },
    })
    if (!order) throw new Error("Pedido nao encontrado.")
    if (order.status === "CANCELLED") throw new Error("Nao e possivel alterar um pedido cancelado.")

    const product = await tx.product.findFirst({
      where: {
        id: productId,
        active: true,
        audience: order.franchiseId ? "FRANCHISEE" : "PUBLIC",
        category: { active: true },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        priceInCents: true,
        minimumQuantity: true,
      },
    })
    if (!product) throw new Error("Produto indisponivel para este pedido.")
    if (quantity < product.minimumQuantity) {
      throw new Error(`A quantidade minima para este produto e ${product.minimumQuantity}.`)
    }

    const existingItem = await tx.orderItem.findFirst({
      where: { orderId: order.id, productId: product.id, comboId: null },
      select: { id: true, quantity: true },
    })

    if (existingItem) {
      const nextQuantity = Math.min(999, existingItem.quantity + quantity)
      await tx.orderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: nextQuantity,
          totalInCents: product.priceInCents * nextQuantity,
        },
      })
    } else {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          quantity,
          unitPriceInCents: product.priceInCents,
          totalInCents: product.priceInCents * quantity,
        },
      })
    }

    await recalculateOrderTotals(
      tx,
      order.id,
      paymentSettings,
      `Produto adicionado pelo admin: ${quantity} ${product.unit} - ${product.name}.`
    )
  })

  revalidateOrderPaths()
}

export async function removeOrderItemAction(formData: FormData) {
  await requireAdmin()

  const orderId = String(formData.get("orderId") ?? "")
  const itemId = String(formData.get("itemId") ?? "")
  if (!orderId || !itemId) throw new Error("Item do pedido nao encontrado.")

  const paymentSettings = await getPaymentDiscountSettings()

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) throw new Error("Pedido nao encontrado.")
    if (order.status === "CANCELLED") throw new Error("Nao e possivel alterar um pedido cancelado.")
    if (order.items.length <= 1)
      throw new Error("O pedido precisa ter pelo menos um item. Cancele o pedido se necessario.")

    const removedItem = order.items.find((item) => item.id === itemId)
    if (!removedItem) throw new Error("Item do pedido nao encontrado.")

    await tx.orderItem.delete({ where: { id: itemId } })
    await recalculateOrderTotals(
      tx,
      order.id,
      paymentSettings,
      `Item removido pelo admin: ${removedItem.quantity} ${removedItem.unit} - ${removedItem.name}.`
    )
  })

  revalidateOrderPaths()
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  if (!orderId) return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      statusHistory: {
        create: { status: "CANCELLED", note: "Pedido cancelado pelo admin." },
      },
    },
  })

  revalidateOrderPaths()
}

export async function deleteOrderAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  if (!orderId) return
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } })
  if (!order || order.status !== "CANCELLED") return
  await prisma.order.delete({ where: { id: orderId } })
  revalidatePath("/admin")
  revalidatePath("/admin/pedidos")
}
