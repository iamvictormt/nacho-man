import { NextResponse } from "next/server"
import { PaymentMethod, PromotionScope } from "@prisma/client"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { getPaymentDiscountSettings, getStoreWhatsAppNumber } from "@/lib/site-settings"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { sendOrderConfirmationEmail } from "@/lib/order-email"

export const runtime = "nodejs"

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

function getPaymentDiscountPercent(method: "PIX" | "CARD", settings: Awaited<ReturnType<typeof getPaymentDiscountSettings>>) {
  return method === "PIX" ? settings.pixDiscountPercent : settings.cardDiscountPercent
}

function canUseMarketplace(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return Boolean(user && user.role !== "ADMIN" && (user.role !== "FRANCHISEE" || user.franchise?.active))
}

export async function PUT(request: Request) {
  const user = await getCurrentUser()
  if (!canUseMarketplace(user)) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 })
  }

  const parsed = couponPreviewSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um cupom valido." }, { status: 400 })
  }

  const now = new Date()
  const paymentSettings = await getPaymentDiscountSettings()
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
    return NextResponse.json({ error: "Cupom invalido, expirado ou indisponivel para este pedido." }, { status: 400 })
  }

  const couponDiscountInCents = calculateDiscount(coupon.type, coupon.value, parsed.data.subtotalInCents)
  const afterCoupon = Math.max(0, parsed.data.subtotalInCents - couponDiscountInCents)
  const franchiseDiscountInCents =
    user?.role === "FRANCHISEE" && user.franchise ? Math.round(afterCoupon * (user.franchise.priceDiscount / 100)) : 0
  const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
  const paymentDiscountPercent = getPaymentDiscountPercent(parsed.data.paymentMethod, paymentSettings)
  const pixDiscountInCents = Math.round(pixBase * (paymentDiscountPercent / 100))

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
  if (!canUseMarketplace(user)) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 })
  }

  const parsed = orderSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Itens do pedido invalidos." }, { status: 400 })
  }

  const productRequests = parsed.data.items.filter((item) => item.type === "PRODUCT")
  const comboRequests = parsed.data.items.filter((item) => item.type === "COMBO")
  if (user!.role !== "FRANCHISEE" && comboRequests.length > 0) {
    return NextResponse.json({ error: "Combos estao disponiveis apenas para franqueados." }, { status: 403 })
  }

  const productIds = [...new Set(productRequests.map((item) => item.id))]
  const comboIds = [...new Set(comboRequests.map((item) => item.id))]
  const now = new Date()
  const paymentSettings = await getPaymentDiscountSettings()
  const productAudience = user!.role === "FRANCHISEE" ? "FRANCHISEE" : "PUBLIC"
  const [products, combos] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, audience: productAudience, active: true, category: { active: true } },
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
    return NextResponse.json({ error: "Um ou mais produtos nao estao disponiveis." }, { status: 400 })
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
      { error: `A quantidade minima de ${product.name} e ${product.minimumQuantity}.` },
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
      ) {
        return best
      }

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
    return NextResponse.json({ error: "Cupom invalido, expirado ou indisponivel para este pedido." }, { status: 400 })
  }

  const afterPromotions = Math.max(0, subtotalInCents - promotionDiscountInCents)
  const couponDiscountInCents = coupon ? calculateDiscount(coupon.type, coupon.value, afterPromotions) : 0
  const afterCoupon = Math.max(0, afterPromotions - couponDiscountInCents)
  const franchiseDiscountInCents =
    user!.role === "FRANCHISEE" && user!.franchise
      ? Math.round(afterCoupon * (user!.franchise.priceDiscount / 100))
      : 0
  const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
  const paymentDiscountPercent = getPaymentDiscountPercent(parsed.data.paymentMethod, paymentSettings)
  const pixDiscountInCents = Math.round(pixBase * (paymentDiscountPercent / 100))
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
        franchiseId: user!.role === "FRANCHISEE" ? user!.franchiseId : null,
        userId: user!.id,
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
      `${index + 1}. ${item.name} - ${item.quantity} ${item.unit} - ${formatMoneyFromCents(item.totalInCents)}`
  )
  const paymentText =
    order.paymentMethod === "PIX" ? "PIX - aguardo o codigo PIX para pagamento." : "Cartao - aguardo o link de pagamento."
  const buyerLine =
    user!.role === "FRANCHISEE" && user!.franchise
      ? `Unidade: *${user!.franchise.tradeName}*`
      : `Cliente: *${user!.name}*`

  const message = [
    `Ola! Quero finalizar o pedido *${orderNumber}*.`,
    "",
    buyerLine,
    "",
    ...itemLines,
    "",
    `Subtotal: ${formatMoneyFromCents(order.subtotalInCents)}`,
    order.promotionDiscountInCents > 0 ? `Descontos: -${formatMoneyFromCents(order.promotionDiscountInCents)}` : null,
    order.couponDiscountInCents > 0
      ? `Cupom ${coupon?.code}: -${formatMoneyFromCents(order.couponDiscountInCents)}`
      : null,
    order.pixDiscountInCents > 0
      ? `Desconto ${order.paymentMethod === "PIX" ? "PIX" : "cartao"} (${paymentDiscountPercent}%): -${formatMoneyFromCents(order.pixDiscountInCents)}`
      : null,
    `*Total estimado: ${formatMoneyFromCents(order.totalInCents)}*`,
    "",
    `Pagamento: ${paymentText}`,
    parsed.data.notes ? `Observacoes: ${parsed.data.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  await sendOrderConfirmationEmail({
    to: user!.email,
    customerName: user!.name,
    franchiseName: user!.franchise?.tradeName ?? "Cliente Nacho Man",
    orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    items: order.items,
    subtotalInCents: order.subtotalInCents,
    promotionDiscountInCents: order.promotionDiscountInCents,
    couponDiscountInCents: order.couponDiscountInCents,
    pixDiscountInCents: order.pixDiscountInCents,
    totalInCents: order.totalInCents,
    notes: order.notes,
  }).catch((error) => {
    console.error("Falha ao enviar e-mail de confirmacao do pedido.", error)
  })

  return NextResponse.json({
    orderNumber,
    whatsappUrl: buildWhatsAppUrl(await getStoreWhatsAppNumber(), message),
  })
}
