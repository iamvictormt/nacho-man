"use server"

import { DiscountType, PromotionScope } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { parseMoneyToCents } from "@/lib/money"

function parseDate(value: FormDataEntryValue | null, endOfDay = false) {
  const rawValue = String(value ?? "").trim()
  const brDate = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const normalized = brDate ? `${brDate[3]}-${brDate[2]}-${brDate[1]}` : rawValue
  const date = new Date(`${normalized}T${endOfDay ? "23:59:59" : "00:00:00"}`)
  return Number.isNaN(date.getTime()) ? null : date
}

function parsePercentage(value: FormDataEntryValue | null) {
  const percentage = Number(String(value ?? "").replace(",", "."))
  return Number.isFinite(percentage) ? percentage : 0
}

export async function createCouponAction(formData: FormData) {
  await requireAdmin()
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
  const type = String(formData.get("type")) as DiscountType
  const startsAt = parseDate(formData.get("startsAt"))
  const endsAt = parseDate(formData.get("endsAt"), true)
  const value =
    type === "PERCENTAGE" ? parsePercentage(formData.get("value")) : parseMoneyToCents(formData.get("value"))
  if (!code || !startsAt || !endsAt || value <= 0) return

  await prisma.coupon.create({
    data: {
      code,
      description: String(formData.get("description") ?? "").trim() || null,
      type,
      value,
      startsAt,
      endsAt,
      minimumInCents: parseMoneyToCents(formData.get("minimum")) || null,
      maximumUses: Number(formData.get("maximumUses")) || null,
    },
  })
  revalidatePath("/admin/campanhas")
}

export async function createPromotionAction(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  const type = String(formData.get("type")) as DiscountType
  const productId = String(formData.get("productId") ?? "")
  const startsAt = parseDate(formData.get("startsAt"))
  const endsAt = parseDate(formData.get("endsAt"), true)
  const value =
    type === "PERCENTAGE" ? parsePercentage(formData.get("value")) : parseMoneyToCents(formData.get("value"))
  if (!name || !productId || !startsAt || !endsAt || value <= 0) return

  await prisma.promotion.create({
    data: {
      name,
      type,
      value,
      scope: PromotionScope.PRODUCT,
      productId,
      startsAt,
      endsAt,
      minimumQuantity: Number(formData.get("minimumQuantity")) || null,
    },
  })
  revalidatePath("/admin/campanhas")
  revalidatePath("/marketplace")
}

export async function updateCouponAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
  const type = String(formData.get("type")) as DiscountType
  const startsAt = parseDate(formData.get("startsAt"))
  const endsAt = parseDate(formData.get("endsAt"), true)
  const value =
    type === "PERCENTAGE" ? parsePercentage(formData.get("value")) : parseMoneyToCents(formData.get("value"))
  if (!id || !code || !startsAt || !endsAt || value <= 0) return
  await prisma.coupon.update({
    where: { id },
    data: {
      code,
      description: String(formData.get("description") ?? "").trim() || null,
      type,
      value,
      startsAt,
      endsAt,
      minimumInCents: parseMoneyToCents(formData.get("minimum")) || null,
      maximumUses: Number(formData.get("maximumUses")) || null,
      active: formData.get("active") === "on",
    },
  })
  revalidatePath("/admin/campanhas")
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const coupon = await prisma.coupon.findUnique({ where: { id }, select: { _count: { select: { orders: true } } } })
  if (!coupon) return
  if (coupon._count.orders > 0) await prisma.coupon.update({ where: { id }, data: { active: false } })
  else await prisma.coupon.delete({ where: { id } })
  revalidatePath("/admin/campanhas")
}

export async function updatePromotionAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const type = String(formData.get("type")) as DiscountType
  const productId = String(formData.get("productId") ?? "")
  const startsAt = parseDate(formData.get("startsAt"))
  const endsAt = parseDate(formData.get("endsAt"), true)
  const value =
    type === "PERCENTAGE" ? parsePercentage(formData.get("value")) : parseMoneyToCents(formData.get("value"))
  if (!id || !name || !productId || !startsAt || !endsAt || value <= 0) return
  await prisma.promotion.update({
    where: { id },
    data: {
      name,
      type,
      value,
      productId,
      startsAt,
      endsAt,
      minimumQuantity: Number(formData.get("minimumQuantity")) || null,
      active: formData.get("active") === "on",
    },
  })
  revalidatePath("/admin/campanhas")
  revalidatePath("/marketplace")
}

export async function deletePromotionAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await prisma.promotion.delete({ where: { id } })
  revalidatePath("/admin/campanhas")
  revalidatePath("/marketplace")
}
