import { NextResponse } from "next/server"
import { PaymentMethod, PromotionScope } from "@prisma/client"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { buildWhatsAppUrl, STORE_WHATSAPP_NUMBER } from "@/lib/whatsapp"

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["PRODUCT", "COMBO"]),
        quantity: z.number().int().positive().max(999),
      })
    )
    .min(1),
  paymentMethod: z.enum(["PIX", "CARD"]),
  coupon: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
})

const couponPreviewSchema = z.object({
  coupon: z.string().trim().min(1).max(50),
  subtotalInCents: z.number().int().positive(),
  paymentMethod: z.enum(["PIX", "CARD"]),
})

function calculateDiscount(type: "PERCENTAGE" | "FIXED", value: number, base: number) {
  return type === "PERCENTAGE" ? Math.round(base * (value / 100)) : Math.min(value, base)
}

export async function PUT(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== "FRANCHISEE" || !user.franchise?.active) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 })
  }

  const parsed = couponPreviewSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um cupom válido." }, { status: 400 })
  }

  const now = new Date()
  const code = parsed.data.coupon.toUpperCase()
  const coupon = await prisma.coupon.findUnique({ where: { code } })

  if (
    !coupon ||
    !coupon.active ||
    coupon.startsAt > now ||
    coupon.endsAt < now ||
    (coupon.maximumUses !== null && coupon.uses >= coupon.maximumUses) ||
    (coupon.minimumInCents !== null && parsed.data.subtotalInCents < coupon.minimumInCents)
  ) {
    return NextResponse.json({ error: "Cupom inválido, expirado ou indisponível para este pedido." }, { status: 400 })
  }

  const couponDiscountInCents = calculateDiscount(coupon.type, coupon.value, parsed.data.subtotalInCents)
  const afterCoupon = Math.max(0, parsed.data.subtotalInCents - couponDiscountInCents)
  const franchiseDiscountInCents = Math.round(afterCoupon * (user.franchise.priceDiscount / 100))
  const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
  const pixDiscountInCents = parsed.data.paymentMethod === "PIX" ? Math.round(pixBase * 0.04) : 0

  return NextResponse.json({
    code,
    couponDiscountInCents,
    franchiseDiscountInCents,
    pixDiscountInCents,
    totalInCents: Math.max(0, pixBase - pixDiscountInCents),
  })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== "FRANCHISEE" || !user.franchiseId || !user.franchise?.active) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 })
  }

  const parsed = orderSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Itens do pedido inválidos." }, { status: 400 })
  }

  const productRequests = parsed.data.items.filter((item) => item.type === "PRODUCT")
  const comboRequests = parsed.data.items.filter((item) => item.type === "COMBO")
  const productIds = [...new Set(productRequests.map((item) => item.id))]
  const comboIds = [...new Set(comboRequests.map((item) => item.id))]
  const now = new Date()
  const [products, combos] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, active: true, category: { active: true } },
      include: {
        category: true,
        promotions: {
          where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
        },
      },
    }),
    prisma.combo.findMany({
      where: {
        id: { in: comboIds },
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
    }),
  ])

  if (products.length !== productIds.length || combos.length !== comboIds.length) {
    return NextResponse.json({ error: "Um ou mais produtos não estão disponíveis." }, { status: 400 })
  }

  const productMap = new Map(products.map((product) => [product.id, product]))
  const comboMap = new Map(combos.map((combo) => [combo.id, combo]))
  let subtotalInCents = 0
  let promotionDiscountInCents = 0

  const invalidMinimum = productRequests.find((requestedItem) => {
    const product = productMap.get(requestedItem.id)
    return product && requestedItem.quantity < product.minimumQuantity
  })
  if (invalidMinimum) {
    const product = productMap.get(invalidMinimum.id)!
    return NextResponse.json(
      { error: `A quantidade mínima de ${product.name} é ${product.minimumQuantity}.` },
      { status: 400 }
    )
  }

  const productItems = productRequests.map((requestedItem) => {
    const product = productMap.get(requestedItem.id)!
    const totalInCents = product.priceInCents * requestedItem.quantity
    subtotalInCents += totalInCents

    const bestPromotionDiscount = product.promotions.reduce((best, promotion) => {
      if (
        promotion.scope !== PromotionScope.PRODUCT ||
        (promotion.minimumQuantity && requestedItem.quantity < promotion.minimumQuantity)
      )
        return best
      return Math.max(best, calculateDiscount(promotion.type, promotion.value, totalInCents))
    }, 0)

    promotionDiscountInCents += bestPromotionDiscount

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      quantity: requestedItem.quantity,
      unitPriceInCents: product.priceInCents,
      totalInCents,
    }
  })

  const comboItems = comboRequests.map((requestedItem) => {
    const combo = comboMap.get(requestedItem.id)!
    const totalInCents = combo.priceInCents * requestedItem.quantity
    subtotalInCents += totalInCents
    return {
      comboId: combo.id,
      name: combo.name,
      sku: null,
      unit: "COMBO",
      quantity: requestedItem.quantity,
      unitPriceInCents: combo.priceInCents,
      totalInCents,
    }
  })
  const items = [...productItems, ...comboItems]

  const couponCode = parsed.data.coupon?.trim().toUpperCase()
  const coupon = couponCode ? await prisma.coupon.findUnique({ where: { code: couponCode } }) : null

  if (
    couponCode &&
    (!coupon ||
      !coupon.active ||
      coupon.startsAt > now ||
      coupon.endsAt < now ||
      (coupon.maximumUses !== null && coupon.uses >= coupon.maximumUses) ||
      (coupon.minimumInCents !== null && subtotalInCents < coupon.minimumInCents))
  ) {
    return NextResponse.json({ error: "Cupom inválido, expirado ou indisponível para este pedido." }, { status: 400 })
  }

  const afterPromotions = Math.max(0, subtotalInCents - promotionDiscountInCents)
  const couponDiscountInCents = coupon ? calculateDiscount(coupon.type, coupon.value, afterPromotions) : 0
  const afterCoupon = Math.max(0, afterPromotions - couponDiscountInCents)
  const franchiseDiscountInCents = Math.round(afterCoupon * (user.franchise.priceDiscount / 100))
  const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
  const pixDiscountInCents = parsed.data.paymentMethod === "PIX" ? Math.round(pixBase * 0.04) : 0
  const totalInCents = Math.max(0, pixBase - pixDiscountInCents)

  const order = await prisma.$transaction(async (transaction) => {
    if (coupon) {
      await transaction.coupon.update({
        where: { id: coupon.id },
        data: { uses: { increment: 1 } },
      })
    }

    return transaction.order.create({
      data: {
        franchiseId: user.franchiseId!,
        paymentMethod: parsed.data.paymentMethod as PaymentMethod,
        couponId: coupon?.id,
        subtotalInCents,
        promotionDiscountInCents: promotionDiscountInCents + franchiseDiscountInCents,
        couponDiscountInCents,
        pixDiscountInCents,
        totalInCents,
        notes: parsed.data.notes || null,
        items: { create: items },
        statusHistory: { create: { status: "AWAITING_SERVICE", note: "Pedido criado pelo marketplace." } },
      },
      include: { items: true },
    })
  })

  const orderNumber = `NF-${String(order.number).padStart(5, "0")}`
  const itemLines = order.items.map(
    (item, index) =>
      `${index + 1}. ${item.name} — ${item.quantity} ${item.unit} — ${formatMoneyFromCents(item.totalInCents)}`
  )
  const paymentText =
    order.paymentMethod === "PIX"
      ? "PIX — aguardo o código PIX para pagamento."
      : "Cartão — aguardo o link de pagamento."

  const message = [
    `Olá! Quero finalizar o pedido *${orderNumber}*.`,
    "",
    `Unidade: *${user.franchise.tradeName}*`,
    "",
    ...itemLines,
    "",
    `Subtotal: ${formatMoneyFromCents(order.subtotalInCents)}`,
    order.promotionDiscountInCents > 0 ? `Descontos: -${formatMoneyFromCents(order.promotionDiscountInCents)}` : null,
    order.couponDiscountInCents > 0
      ? `Cupom ${coupon?.code}: -${formatMoneyFromCents(order.couponDiscountInCents)}`
      : null,
    order.pixDiscountInCents > 0 ? `Desconto PIX (4%): -${formatMoneyFromCents(order.pixDiscountInCents)}` : null,
    `*Total estimado: ${formatMoneyFromCents(order.totalInCents)}*`,
    "",
    `Pagamento: ${paymentText}`,
    parsed.data.notes ? `Observações: ${parsed.data.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  return NextResponse.json({
    orderNumber,
    whatsappUrl: buildWhatsAppUrl(STORE_WHATSAPP_NUMBER, message),
  })
}
