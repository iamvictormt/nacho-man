"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { parseMoneyToCents } from "@/lib/money"
import { createSlug } from "@/lib/slug"

export async function createComboAction(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  const priceInCents = parseMoneyToCents(formData.get("price"))
  const rawItems = String(formData.get("items") ?? "")
  const itemPairs = rawItems
    .split(",")
    .map((entry) => entry.trim().split(":"))
    .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }))
    .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0)

  if (!name || priceInCents <= 0 || itemPairs.length === 0) return

  let slug = createSlug(name)
  if (await prisma.combo.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`

  await prisma.combo.create({
    data: {
      name,
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      image: null,
      priceInCents,
      items: { create: itemPairs },
    },
  })

  revalidatePath("/admin/combos")
  revalidatePath("/marketplace")
}

export async function toggleComboAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active")) === "true"
  if (!id) return
  await prisma.combo.update({ where: { id }, data: { active: !active } })
  revalidatePath("/admin/combos")
  revalidatePath("/marketplace")
}

function parseComboItems(formData: FormData) {
  return String(formData.get("items") ?? "")
    .split(",")
    .map((entry) => entry.trim().split(":"))
    .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }))
    .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0)
}

export async function updateComboAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const priceInCents = parseMoneyToCents(formData.get("price"))
  const items = parseComboItems(formData)
  if (!id || !name || priceInCents <= 0 || items.length === 0) return

  await prisma.combo.update({
    where: { id },
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      image: null,
      priceInCents,
      items: { deleteMany: {}, create: items },
    },
  })
  revalidateComboPaths()
}

export async function deleteComboAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const combo = await prisma.combo.findUnique({
    where: { id },
    select: { _count: { select: { orderItems: true } } },
  })
  if (!combo) return
  if (combo._count.orderItems > 0) {
    await prisma.combo.update({ where: { id }, data: { active: false } })
  } else {
    await prisma.combo.delete({ where: { id } })
  }
  revalidateComboPaths()
}

function revalidateComboPaths() {
  revalidatePath("/admin/combos")
  revalidatePath("/marketplace")
}
