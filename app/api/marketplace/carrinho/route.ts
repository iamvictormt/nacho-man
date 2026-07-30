import { NextResponse } from "next/server"
import { Prisma, type ProductAudience } from "@prisma/client"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const selectedOptionSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  quantity: z.number().int().positive().max(999),
})

const cartItemIdentitySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["PRODUCT", "COMBO"]),
  selectionKey: z.string().optional(),
})

const addCartItemSchema = cartItemIdentitySchema.extend({
  quantity: z.number().int().positive().max(999).optional(),
  selectedOptions: z.array(selectedOptionSchema).optional(),
})

const updateCartItemSchema = cartItemIdentitySchema.extend({
  quantity: z.number().int().positive().max(999),
})

const removeCartItemSchema = cartItemIdentitySchema.partial().extend({
  clear: z.boolean().optional(),
})

type MarketplaceUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

function canUseMarketplace(user: Awaited<ReturnType<typeof getCurrentUser>>): user is MarketplaceUser {
  return Boolean(
    user && !user.mustChangePassword && user.role !== "ADMIN" && (user.role !== "FRANCHISEE" || user.franchise?.active)
  )
}

function audienceForUser(user: MarketplaceUser): ProductAudience {
  return user.role === "FRANCHISEE" ? "FRANCHISEE" : "PUBLIC"
}

function buildItemKey(type: "PRODUCT" | "COMBO", id: string, selectionKey?: string) {
  return `${type}:${id}:${selectionKey || "default"}`
}

function normalizeSelectedOptions(options: z.infer<typeof selectedOptionSchema>[]) {
  return options
    .map((option) => ({
      productId: option.productId,
      quantity: option.quantity,
    }))
    .sort((left, right) => left.productId.localeCompare(right.productId))
}

function buildSelectionKey(options: { productId: string; quantity: number }[]) {
  return options.map((option) => `${option.productId}:${option.quantity}`).join("|")
}

function readSelectedOptions(value: Prisma.JsonValue | null) {
  const parsed = z.array(selectedOptionSchema).safeParse(value)
  return parsed.success ? normalizeSelectedOptions(parsed.data) : []
}

async function getCartItems(user: MarketplaceUser) {
  const audience = audienceForUser(user)
  const now = new Date()
  const rows = await prisma.marketplaceCartItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      quantity: true,
      selectionKey: true,
      selectedOptions: true,
      product: {
        select: {
          id: true,
          name: true,
          image: true,
          unit: true,
          packageLabel: true,
          priceInCents: true,
          minimumQuantity: true,
          audience: true,
          active: true,
          category: { select: { active: true } },
        },
      },
      combo: {
        select: {
          id: true,
          name: true,
          image: true,
          priceInCents: true,
          audience: true,
          active: true,
          startsAt: true,
          endsAt: true,
          totalUnits: true,
          options: {
            select: {
              productId: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  active: true,
                  category: { select: { active: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  const invalidIds: string[] = []
  const items = []

  for (const row of rows) {
    if (row.type === "PRODUCT") {
      const product = row.product
      const valid = product && product.audience === audience && product.active && product.category.active

      if (!valid) {
        invalidIds.push(row.id)
        continue
      }

      const quantity = Math.max(product.minimumQuantity, Math.min(999, row.quantity))
      if (quantity !== row.quantity) {
        await prisma.marketplaceCartItem.update({ where: { id: row.id }, data: { quantity } })
      }

      items.push({
        id: product.id,
        type: "PRODUCT" as const,
        name: product.name,
        image: product.image,
        unit: product.unit,
        packageLabel: product.packageLabel,
        unitPriceInCents: product.priceInCents,
        minimumQuantity: product.minimumQuantity,
        quantity,
      })
      continue
    }

    const combo = row.combo
    const selectedOptions = readSelectedOptions(row.selectedOptions)
    const activeOptions =
      combo?.options.filter((option) => option.product.active && option.product.category.active) ?? []
    const optionMap = new Map(activeOptions.map((option) => [option.productId, option.product]))
    const selectedProductIds = new Set(selectedOptions.map((option) => option.productId))
    const selectedTotal = selectedOptions.reduce((total, option) => total + option.quantity, 0)
    const valid =
      combo &&
      combo.audience === audience &&
      combo.active &&
      (!combo.startsAt || combo.startsAt <= now) &&
      (!combo.endsAt || combo.endsAt >= now) &&
      activeOptions.length === combo.options.length &&
      selectedOptions.length === activeOptions.length &&
      selectedTotal === combo.totalUnits &&
      selectedOptions.every((option) => optionMap.has(option.productId)) &&
      activeOptions.every((option) => selectedProductIds.has(option.productId))

    if (!valid || !combo) {
      invalidIds.push(row.id)
      continue
    }

    const normalizedOptions = selectedOptions.map((option) => {
      const product = optionMap.get(option.productId)!

      return {
        productId: product.id,
        name: product.name,
        quantity: option.quantity,
      }
    })

    items.push({
      id: combo.id,
      type: "COMBO" as const,
      selectionKey: row.selectionKey ?? buildSelectionKey(selectedOptions),
      name: combo.name,
      image: combo.image ?? activeOptions.find((option) => option.product.image)?.product.image ?? null,
      unit: "COMBO",
      packageLabel: normalizedOptions.map((option) => `${option.quantity}x ${option.name}`).join(" | "),
      unitPriceInCents: combo.priceInCents,
      minimumQuantity: 1,
      quantity: Math.max(1, Math.min(999, row.quantity)),
      selectedOptions: normalizedOptions,
    })
  }

  if (invalidIds.length > 0) {
    await prisma.marketplaceCartItem.deleteMany({ where: { id: { in: invalidIds } } })
  }

  return items
}

export async function GET() {
  const user = await getCurrentUser()
  if (!canUseMarketplace(user)) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 })
  }

  return NextResponse.json({ items: await getCartItems(user) })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!canUseMarketplace(user)) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 })
  }

  const parsed = addCartItemSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Item invalido." }, { status: 400 })
  }

  const { type, id } = parsed.data
  const audience = audienceForUser(user)
  let selectionKey = parsed.data.selectionKey
  let selectedOptions: Prisma.InputJsonValue | undefined
  let quantity = parsed.data.quantity ?? 1

  if (type === "PRODUCT") {
    const product = await prisma.product.findFirst({
      where: { id, audience, active: true, category: { active: true } },
      select: { minimumQuantity: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Produto indisponivel." }, { status: 400 })
    }
    quantity = Math.max(product.minimumQuantity, quantity)
  } else {
    const combo = await prisma.combo.findFirst({
      where: {
        id,
        audience,
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        ],
      },
      select: {
        totalUnits: true,
        options: {
          select: {
            productId: true,
            product: {
              select: {
                active: true,
                category: { select: { active: true } },
              },
            },
          },
        },
      },
    })
    const normalizedOptions = normalizeSelectedOptions(parsed.data.selectedOptions ?? [])
    const activeOptions =
      combo?.options.filter((option) => option.product.active && option.product.category.active) ?? []
    const selectedProductIds = new Set(normalizedOptions.map((option) => option.productId))
    const selectedTotal = normalizedOptions.reduce((total, option) => total + option.quantity, 0)
    const valid =
      combo &&
      activeOptions.length === combo.options.length &&
      normalizedOptions.length === activeOptions.length &&
      selectedTotal === combo.totalUnits &&
      normalizedOptions.every((option) =>
        activeOptions.some((activeOption) => activeOption.productId === option.productId)
      ) &&
      activeOptions.every((option) => selectedProductIds.has(option.productId))

    if (!valid) {
      return NextResponse.json({ error: "Combo indisponivel ou selecao invalida." }, { status: 400 })
    }

    selectionKey = selectionKey || buildSelectionKey(normalizedOptions)
    selectedOptions = normalizedOptions
  }

  const itemKey = buildItemKey(type, id, selectionKey)
  await prisma.marketplaceCartItem.upsert({
    where: { userId_itemKey: { userId: user.id, itemKey } },
    create: {
      userId: user.id,
      itemKey,
      type,
      productId: type === "PRODUCT" ? id : null,
      comboId: type === "COMBO" ? id : null,
      selectionKey,
      selectedOptions,
      quantity,
    },
    update: { quantity: { increment: quantity }, selectedOptions },
  })

  return NextResponse.json({ items: await getCartItems(user) })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!canUseMarketplace(user)) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 })
  }

  const parsed = updateCartItemSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Quantidade invalida." }, { status: 400 })
  }

  const itemKey = buildItemKey(parsed.data.type, parsed.data.id, parsed.data.selectionKey)
  await prisma.marketplaceCartItem.updateMany({
    where: { userId: user.id, itemKey },
    data: { quantity: parsed.data.quantity },
  })

  return NextResponse.json({ items: await getCartItems(user) })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!canUseMarketplace(user)) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 })
  }

  const parsed = removeCartItemSchema.safeParse(await request.json().catch(() => ({ clear: true })))
  if (!parsed.success) {
    return NextResponse.json({ error: "Item invalido." }, { status: 400 })
  }

  if (parsed.data.clear) {
    await prisma.marketplaceCartItem.deleteMany({ where: { userId: user.id } })
  } else if (parsed.data.id && parsed.data.type) {
    await prisma.marketplaceCartItem.deleteMany({
      where: { userId: user.id, itemKey: buildItemKey(parsed.data.type, parsed.data.id, parsed.data.selectionKey) },
    })
  }

  return NextResponse.json({ items: await getCartItems(user) })
}
