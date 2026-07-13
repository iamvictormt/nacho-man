"use server"

import { OrderStatus, PromotionScope, type Prisma } from "@prisma/client"
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
  const afterPromotions = Math.max(0, subtotalInCents - productPromotionDiscountInCents)
  const couponDiscountInCents =
    order.coupon && (order.coupon.minimumInCents === null || afterPromotions >= order.coupon.minimumInCents)
      ? calculateDiscount(order.coupon.type, order.coupon.value, afterPromotions)
      : 0
  const afterCoupon = Math.max(0, afterPromotions - couponDiscountInCents)
  const franchiseDiscountInCents = order.franchise ? Math.round(afterCoupon * (order.franchise.priceDiscount / 100)) : 0
  const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
  const paymentDiscountPercent = getPaymentDiscountPercent(order.paymentMethod, paymentSettings, Boolean(order.franchise))
  const pixDiscountInCents = Math.round(pixBase * (paymentDiscountPercent / 100))
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

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  const status = String(formData.get("status") ?? "") as OrderStatus

  if (!orderId || !Object.values(OrderStatus).includes(status)) return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      statusHistory: {
        create: { status, note: "Status atualizado pela Nacho Factory." },
      },
    },
  })

  revalidatePath("/admin/pedidos")
  revalidatePath("/marketplace/pedidos")
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
    if (order.items.length <= 1) throw new Error("O pedido precisa ter pelo menos um item. Cancele o pedido se necessario.")

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
