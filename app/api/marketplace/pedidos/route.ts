import { NextResponse } from "next/server"
import { PaymentMethod, PromotionScope } from "@prisma/client"
import { z } from "zod"
import { getCurrentUser, isAdminRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { getOrderMessageSettings, getPaymentDiscountSettings, getStoreWhatsAppNumber } from "@/lib/site-settings"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { sendOrderConfirmationEmail } from "@/lib/order-email"
import { sortOrderItemsByCategory } from "@/lib/order-items"
import {
  getPaymentDiscountLabel,
  getPaymentMethodInstruction,
  type MarketplacePaymentMethod,
} from "@/lib/payment-method"
import { formatOrderCode } from "@/lib/order-number"
import {
  formatFactoryPickupScheduleAt,
  getFactoryPickupEstimateMessage,
  getOrderFulfillmentInstruction,
  isFactoryPickupScheduleAllowed,
  parseFactoryPickupScheduleValue,
} from "@/lib/order-fulfillment"

export const runtime = "nodejs"

const orderItemRequestSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["PRODUCT", "COMBO"]),
  quantity: z.number().int().positive().max(999),
  selectedOptions: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1).max(200),
        quantity: z.number().int().positive().max(999),
      })
    )
    .optional(),
})

const orderSchema = z.object({
  items: z.array(orderItemRequestSchema).min(1),
  paymentMethod: z.enum(["PIX", "CARD", "BOLETO"]),
  fulfillmentMethod: z.enum(["FACTORY_PICKUP", "SHIP_BY_CARRIER"]),
  scheduledPickupAt: z.string().max(16).optional(),
  coupon: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
})

const couponPreviewSchema = z.object({
  coupon: z.string().trim().min(1).max(50),
  items: z.array(orderItemRequestSchema).min(1),
  paymentMethod: z.enum(["PIX", "CARD", "BOLETO"]),
})

function calculateDiscount(type: "PERCENTAGE" | "FIXED", value: number, base: number) {
  return type === "PERCENTAGE" ? Math.round(base * (value / 100)) : Math.min(value, base)
}

function getPaymentDiscountPercent(
  method: MarketplacePaymentMethod,
  settings: Awaited<ReturnType<typeof getPaymentDiscountSettings>>,
  userRole: string
) {
  const franchisee = userRole === "FRANCHISEE"
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

function canUseMarketplace(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return Boolean(
    user &&
    !user.mustChangePassword &&
    !isAdminRole(user.role) &&
    (user.role !== "FRANCHISEE" || user.franchise?.active)
  )
}

function formatSelectedOptions(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((option) => {
      if (!option || typeof option !== "object") return null
      const record = option as { name?: unknown; quantity?: unknown }
      const name = typeof record.name === "string" ? record.name : ""
      const quantity = typeof record.quantity === "number" ? record.quantity : 0

      return name && quantity > 0 ? `${quantity}x ${name}` : null
    })
    .filter((option): option is string => Boolean(option))
}

function renderTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((message, [key, value]) => message.replaceAll(`{${key}}`, value), template)
}

export async function PUT(request: Request) {
  const user = await getCurrentUser()
  if (!canUseMarketplace(user)) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 })
  }

  const parsed = couponPreviewSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um cupom válido." }, { status: 400 })
  }
  if (parsed.data.paymentMethod === "BOLETO" && user?.role !== "FRANCHISEE") {
    return NextResponse.json({ error: "Boleto está disponível apenas para franqueados." }, { status: 403 })
  }

  const productRequests = parsed.data.items.filter((item) => item.type === "PRODUCT")
  const comboRequests = parsed.data.items.filter((item) => item.type === "COMBO")
  const productIds = [...new Set(productRequests.map((item) => item.id))]
  const comboIds = [...new Set(comboRequests.map((item) => item.id))]
  const now = new Date()
  const paymentSettings = await getPaymentDiscountSettings()
  const productAudience = user!.role === "FRANCHISEE" ? "FRANCHISEE" : "PUBLIC"
  const [products, combos] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, audience: productAudience, active: true, category: { active: true } },
      include: {
        promotions: {
          where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
        },
      },
    }),
    prisma.combo.findMany({
      where: {
        id: { in: comboIds },
        audience: productAudience,
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: { options: { include: { product: { select: { id: true, paymentDiscountEligible: true } } } } },
    }),
  ])

  if (products.length !== productIds.length || combos.length !== comboIds.length) {
    return NextResponse.json({ error: "Um ou mais produtos não estão disponíveis." }, { status: 400 })
  }

  const productMap = new Map(products.map((product) => [product.id, product]))
  const comboMap = new Map(combos.map((combo) => [combo.id, combo]))
  let subtotalInCents = 0
  let promotionDiscountInCents = 0
  let paymentDiscountEligibleSubtotalInCents = 0
  let paymentDiscountEligiblePromotionDiscountInCents = 0

  for (const requestedItem of productRequests) {
    const product = productMap.get(requestedItem.id)!
    if (requestedItem.quantity < product.minimumQuantity) {
      return NextResponse.json(
        { error: `A quantidade mínima de ${product.name} é ${product.minimumQuantity}.` },
        { status: 400 }
      )
    }

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

    if (product.paymentDiscountEligible) {
      paymentDiscountEligibleSubtotalInCents += totalInCents
      paymentDiscountEligiblePromotionDiscountInCents += bestPromotionDiscount
    }
  }

  for (const requestedItem of comboRequests) {
    const combo = comboMap.get(requestedItem.id)!
    const selectedOptions = requestedItem.selectedOptions ?? []
    const optionMap = new Map(combo.options.map((option) => [option.productId, option.product]))
    const selectedProductIds = new Set(selectedOptions.map((option) => option.productId))
    const selectedTotal = selectedOptions.reduce((total, option) => total + option.quantity, 0)
    const valid =
      selectedTotal === combo.totalUnits &&
      selectedProductIds.size === selectedOptions.length &&
      selectedOptions.every((option) => optionMap.has(option.productId)) &&
      combo.options.every((option) => selectedProductIds.has(option.productId))

    if (!valid) {
      return NextResponse.json({ error: `Seleção inválida para o combo ${combo.name}.` }, { status: 400 })
    }

    const totalInCents = combo.priceInCents * requestedItem.quantity
    const eligibleUnits = selectedOptions.reduce((total, option) => {
      const product = optionMap.get(option.productId)
      return total + (product?.paymentDiscountEligible ? option.quantity : 0)
    }, 0)
    subtotalInCents += totalInCents
    paymentDiscountEligibleSubtotalInCents += Math.round((totalInCents * eligibleUnits) / combo.totalUnits)
  }

  const code = parsed.data.coupon.toUpperCase()
  const coupon = await prisma.coupon.findUnique({ where: { code } })

  if (
    !coupon ||
    !coupon.active ||
    coupon.startsAt > now ||
    coupon.endsAt < now ||
    (coupon.maximumUses !== null && coupon.uses >= coupon.maximumUses) ||
    (coupon.minimumInCents !== null && subtotalInCents < coupon.minimumInCents)
  ) {
    return NextResponse.json({ error: "Cupom inválido, expirado ou indisponível para este pedido." }, { status: 400 })
  }

  const afterPromotions = Math.max(0, subtotalInCents - promotionDiscountInCents)
  const couponDiscountInCents = calculateDiscount(coupon.type, coupon.value, afterPromotions)
  const afterCoupon = Math.max(0, afterPromotions - couponDiscountInCents)
  const franchiseDiscountInCents =
    user?.role === "FRANCHISEE" && user.franchise ? Math.round(afterCoupon * (user.franchise.priceDiscount / 100)) : 0
  const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
  const paymentDiscountPercent = getPaymentDiscountPercent(parsed.data.paymentMethod, paymentSettings, user!.role)
  const paymentDiscountBaseInCents = getPaymentDiscountBaseInCents({
    subtotalInCents,
    promotionDiscountInCents,
    couponDiscountInCents,
    franchiseDiscountInCents,
    paymentDiscountEligibleSubtotalInCents,
    paymentDiscountEligiblePromotionDiscountInCents,
  })
  const pixDiscountInCents = Math.round(paymentDiscountBaseInCents * (paymentDiscountPercent / 100))

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
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 })
  }

  const parsed = orderSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Itens do pedido inválidos." }, { status: 400 })
  }
  if (parsed.data.paymentMethod === "BOLETO" && user!.role !== "FRANCHISEE") {
    return NextResponse.json({ error: "Boleto está disponível apenas para franqueados." }, { status: 403 })
  }
  if (parsed.data.fulfillmentMethod === "FACTORY_PICKUP" && !parsed.data.scheduledPickupAt) {
    return NextResponse.json({ error: "Escolha o dia e horário para retirada." }, { status: 400 })
  }
  if (
    parsed.data.fulfillmentMethod === "FACTORY_PICKUP" &&
    parsed.data.scheduledPickupAt &&
    !isFactoryPickupScheduleAllowed(parsed.data.scheduledPickupAt)
  ) {
    return NextResponse.json({ error: "Escolha um horário de retirada dentro da agenda disponível." }, { status: 400 })
  }

  const productRequests = parsed.data.items.filter((item) => item.type === "PRODUCT")
  const comboRequests = parsed.data.items.filter((item) => item.type === "COMBO")

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
        audience: productAudience,
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: {
        options: { include: { product: { select: { id: true, name: true, paymentDiscountEligible: true } } } },
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
  let paymentDiscountEligibleSubtotalInCents = 0
  let paymentDiscountEligiblePromotionDiscountInCents = 0

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
      ) {
        return best
      }

      return Math.max(best, calculateDiscount(promotion.type, promotion.value, totalInCents))
    }, 0)

    promotionDiscountInCents += bestPromotionDiscount
    if (product.paymentDiscountEligible) {
      paymentDiscountEligibleSubtotalInCents += totalInCents
      paymentDiscountEligiblePromotionDiscountInCents += bestPromotionDiscount
    }

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      quantity: requestedItem.quantity,
      unitPriceInCents: product.priceInCents,
      totalInCents,
      product: { category: product.category },
    }
  })

  const invalidComboSelection = comboRequests.find((requestedItem) => {
    const combo = comboMap.get(requestedItem.id)!
    const selectedOptions = requestedItem.selectedOptions ?? []
    const optionMap = new Map(combo.options.map((option) => [option.productId, option.product]))
    const selectedProductIds = new Set(selectedOptions.map((option) => option.productId))
    const selectedTotal = selectedOptions.reduce((total, option) => total + option.quantity, 0)
    const hasInvalidOption = selectedOptions.some((option) => !optionMap.has(option.productId))
    const hasDuplicateOption = selectedProductIds.size !== selectedOptions.length
    const hasMissingRequiredOption = combo.options.some((option) => !selectedProductIds.has(option.productId))

    return selectedTotal !== combo.totalUnits || hasInvalidOption || hasDuplicateOption || hasMissingRequiredOption
  })
  if (invalidComboSelection) {
    const combo = comboMap.get(invalidComboSelection.id)!

    return NextResponse.json(
      {
        error: `Escolha exatamente ${combo.totalUnits} unidades para o combo ${combo.name}, com pelo menos 1 de cada produto.`,
      },
      { status: 400 }
    )
  }

  const comboItems = comboRequests.map((requestedItem) => {
    const combo = comboMap.get(requestedItem.id)!
    const selectedOptions = requestedItem.selectedOptions ?? []
    const optionMap = new Map(combo.options.map((option) => [option.productId, option.product]))

    const normalizedOptions = selectedOptions.map((option) => {
      const product = optionMap.get(option.productId)!

      return {
        productId: product.id,
        name: product.name,
        quantity: option.quantity,
      }
    })
    const totalInCents = combo.priceInCents * requestedItem.quantity
    const eligibleUnits = selectedOptions.reduce((total, option) => {
      const product = optionMap.get(option.productId)
      return total + (product?.paymentDiscountEligible ? option.quantity : 0)
    }, 0)
    subtotalInCents += totalInCents
    paymentDiscountEligibleSubtotalInCents += Math.round((totalInCents * eligibleUnits) / combo.totalUnits)
    return {
      comboId: combo.id,
      name: combo.name,
      sku: null,
      unit: "COMBO",
      quantity: requestedItem.quantity,
      unitPriceInCents: combo.priceInCents,
      totalInCents,
      selectedOptions: normalizedOptions,
    }
  })
  const items = sortOrderItemsByCategory([...productItems, ...comboItems]).map((item) => {
    if ("product" in item) {
      const { product: _product, ...createItem } = item
      return createItem
    }

    return item
  })

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
  const franchiseDiscountInCents =
    user!.role === "FRANCHISEE" && user!.franchise ? Math.round(afterCoupon * (user!.franchise.priceDiscount / 100)) : 0
  const pixBase = Math.max(0, afterCoupon - franchiseDiscountInCents)
  const paymentDiscountPercent = getPaymentDiscountPercent(parsed.data.paymentMethod, paymentSettings, user!.role)
  const paymentDiscountBaseInCents = getPaymentDiscountBaseInCents({
    subtotalInCents,
    promotionDiscountInCents,
    couponDiscountInCents,
    franchiseDiscountInCents,
    paymentDiscountEligibleSubtotalInCents,
    paymentDiscountEligiblePromotionDiscountInCents,
  })
  const pixDiscountInCents = Math.round(paymentDiscountBaseInCents * (paymentDiscountPercent / 100))
  const totalInCents = Math.max(0, pixBase - pixDiscountInCents)
  const scheduledPickupAt =
    parsed.data.fulfillmentMethod === "FACTORY_PICKUP" && parsed.data.scheduledPickupAt
      ? parseFactoryPickupScheduleValue(parsed.data.scheduledPickupAt)
      : null

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
        fulfillmentMethod: parsed.data.fulfillmentMethod,
        scheduledPickupAt,
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
      include: { items: { include: { product: { include: { category: true } } } } },
    })
  })

  const orderNumber = formatOrderCode(order.number)
  const sortedOrderItems = sortOrderItemsByCategory(order.items)
  const itemLines = sortedOrderItems.map((item, index) => {
    const selectedOptions = formatSelectedOptions(item.selectedOptions)

    return [
      `${index + 1}. ${item.name} - ${item.quantity} ${item.unit} - ${formatMoneyFromCents(item.totalInCents)}`,
      selectedOptions.length > 0 ? `   Sabores: ${selectedOptions.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  })
  const paymentText = getPaymentMethodInstruction(order.paymentMethod)
  const buyerLine =
    user!.role === "FRANCHISEE" && user!.franchise
      ? `Unidade: *${user!.franchise.tradeName}*`
      : `Cliente: *${user!.name}*`
  const discountLines = [
    order.promotionDiscountInCents > 0 ? `Descontos: -${formatMoneyFromCents(order.promotionDiscountInCents)}` : null,
    order.couponDiscountInCents > 0
      ? `Cupom ${coupon?.code}: -${formatMoneyFromCents(order.couponDiscountInCents)}`
      : null,
    order.pixDiscountInCents > 0
      ? `${getPaymentDiscountLabel(order.paymentMethod)} (${paymentDiscountPercent}%): -${formatMoneyFromCents(order.pixDiscountInCents)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n")
  const messageSettings = await getOrderMessageSettings()
  const pickupEstimateText =
    order.fulfillmentMethod === "FACTORY_PICKUP"
      ? order.scheduledPickupAt
        ? `Retirada agendada para ${formatFactoryPickupScheduleAt(order.scheduledPickupAt)}`
        : getFactoryPickupEstimateMessage(order.createdAt)
      : ""
  const fulfillmentText = [getOrderFulfillmentInstruction(order.fulfillmentMethod), pickupEstimateText]
    .filter(Boolean)
    .join("\n")
  const notesLine = parsed.data.notes ? `Observações: ${parsed.data.notes}` : ""
  const observationLines = [
    messageSettings.whatsappTemplate.includes("{entrega}") ? null : `Entrega: ${fulfillmentText}`,
    notesLine,
  ]
    .filter(Boolean)
    .join("\n")
  const message = renderTemplate(messageSettings.whatsappTemplate, {
    pedido: `*${orderNumber}*`,
    cliente: buyerLine,
    itens: itemLines.join("\n"),
    subtotal: formatMoneyFromCents(order.subtotalInCents),
    descontos: discountLines,
    total: `*${formatMoneyFromCents(order.totalInCents)}*`,
    pagamento: paymentText,
    entrega: fulfillmentText,
    observacoes: observationLines,
  })

  await sendOrderConfirmationEmail({
    to: user!.email,
    customerName: user!.name,
    franchiseName: user!.franchise?.tradeName ?? "Cliente Nacho Man",
    orderNumber,
    orderCreatedAt: order.createdAt,
    scheduledPickupAt: order.scheduledPickupAt,
    status: order.status,
    paymentMethod: order.paymentMethod,
    fulfillmentMethod: order.fulfillmentMethod,
    items: sortedOrderItems,
    subtotalInCents: order.subtotalInCents,
    promotionDiscountInCents: order.promotionDiscountInCents,
    couponDiscountInCents: order.couponDiscountInCents,
    pixDiscountInCents: order.pixDiscountInCents,
    totalInCents: order.totalInCents,
    notes: order.notes,
  }).catch((error) => {
    console.error("Falha ao enviar e-mail de confirmação do pedido.", error)
  })

  return NextResponse.json({
    orderNumber,
    whatsappUrl: buildWhatsAppUrl(await getStoreWhatsAppNumber(), message),
  })
}
