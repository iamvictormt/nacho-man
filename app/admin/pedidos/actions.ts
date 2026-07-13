"use server"

import { OrderStatus, PromotionScope } from "@prisma/client"
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

export async function removeOrderItemAction(formData: FormData) {
  await requireAdmin()

  const orderId = String(formData.get("orderId") ?? "")
  const itemId = String(formData.get("itemId") ?? "")
  if (!orderId || !itemId) throw new Error("Item do pedido nÃ£o encontrado.")

  const paymentSettings = await getPaymentDiscountSettings()
  const now = new Date()

  await prisma.$transaction(async (tx) => {
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

    if (!order) throw new Error("Pedido nÃ£o encontrado.")
    if (order.status === "CANCELLED") throw new Error("NÃ£o Ã© possÃ­vel alterar um pedido cancelado.")
    if (order.items.length <= 1) throw new Error("O pedido precisa ter pelo menos um item. Cancele o pedido se necessÃ¡rio.")

    const removedItem = order.items.find((item) => item.id === itemId)
    if (!removedItem) throw new Error("Item do pedido nÃ£o encontrado.")

    const remainingItems = order.items.filter((item) => item.id !== itemId)
    const subtotalInCents = remainingItems.reduce((total, item) => total + item.totalInCents, 0)
    const productPromotionDiscountInCents = remainingItems.reduce((total, item) => {
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
    const franchiseDiscountInCents = order.franchise
      ? Math.round(afterCoupon * (order.franchise.priceDiscount / 100))
      : 0
    const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
    const paymentDiscountPercent = getPaymentDiscountPercent(order.paymentMethod, paymentSettings, Boolean(order.franchise))
    const pixDiscountInCents = Math.round(pixBase * (paymentDiscountPercent / 100))
    const totalInCents = Math.max(0, pixBase - pixDiscountInCents)

    await tx.orderItem.delete({ where: { id: itemId } })
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
            note: `Item removido pelo admin: ${removedItem.quantity} ${removedItem.unit} - ${removedItem.name}.`,
          },
        },
      },
    })
  })

  revalidatePath("/admin")
  revalidatePath("/admin/pedidos")
  revalidatePath("/marketplace")
  revalidatePath("/marketplace/pedidos")
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

  revalidatePath("/admin")
  revalidatePath("/admin/pedidos")
  revalidatePath("/marketplace/pedidos")
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
