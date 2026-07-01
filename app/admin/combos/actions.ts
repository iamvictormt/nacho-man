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
  const totalUnits = Number(String(formData.get("totalUnits") ?? "").replace(/\D/g, ""))
  const rawOptions = String(formData.get("options") ?? "")
  const options = [...new Set(rawOptions.split(",").map((productId) => productId.trim()).filter(Boolean))].map(
    (productId) => ({ productId })
  )

  if (!name || priceInCents <= 0 || !Number.isInteger(totalUnits) || totalUnits <= 0 || options.length === 0) return

  let slug = createSlug(name)
  if (await prisma.combo.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`

  await prisma.combo.create({
    data: {
      name,
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      image: null,
      priceInCents,
      totalUnits,
      options: { create: options },
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

function parseComboOptions(formData: FormData) {
  return String(formData.get("options") ?? "")
    .split(",")
    .map((productId) => productId.trim())
    .filter(Boolean)
    .filter((productId, index, productIds) => productIds.indexOf(productId) === index)
    .map((productId) => ({ productId }))
}

export async function updateComboAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const priceInCents = parseMoneyToCents(formData.get("price"))
  const totalUnits = Number(String(formData.get("totalUnits") ?? "").replace(/\D/g, ""))
  const options = parseComboOptions(formData)
  if (!id || !name || priceInCents <= 0 || !Number.isInteger(totalUnits) || totalUnits <= 0 || options.length === 0) return

  await prisma.combo.update({
    where: { id },
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      image: null,
      priceInCents,
      totalUnits,
      options: { deleteMany: {}, create: options },
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
