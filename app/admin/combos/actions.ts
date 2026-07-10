"use server"

import { ProductAudience } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { parseMoneyToCents } from "@/lib/money"
import { createSlug } from "@/lib/slug"

const validAudiences = new Set<ProductAudience>(["FRANCHISEE", "PUBLIC"])

function getComboAudience(formData: FormData) {
  const audience = String(formData.get("audience") ?? "FRANCHISEE") as ProductAudience
  return validAudiences.has(audience) ? audience : "FRANCHISEE"
}

export async function createComboAction(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  const priceInCents = parseMoneyToCents(formData.get("price"))
  const totalUnits = Number(String(formData.get("totalUnits") ?? "").replace(/\D/g, ""))
  const options = parseComboOptions(formData)

  assertValidComboInput({ name, priceInCents, totalUnits, options })

  let slug = createSlug(name)
  if (await prisma.combo.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`

  await prisma.combo.create({
    data: {
      name,
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      image: null,
      priceInCents,
      audience: getComboAudience(formData),
      totalUnits,
      options: { create: options },
    },
  })

  revalidatePath("/admin/combos")
  revalidateComboMarketplacePaths()
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

function assertValidComboInput({
  name,
  priceInCents,
  totalUnits,
  options,
}: {
  name: string
  priceInCents: number
  totalUnits: number
  options: { productId: string }[]
}) {
  if (!name) throw new Error("Informe o nome do combo.")
  if (priceInCents <= 0) throw new Error("Informe um preco valido para o combo.")
  if (!Number.isInteger(totalUnits) || totalUnits <= 0) {
    throw new Error("Informe a quantidade de unidades do combo.")
  }
  if (options.length === 0) throw new Error("Selecione pelo menos um produto para o combo.")
  if (totalUnits < options.length) {
    throw new Error("As unidades do combo precisam ser iguais ou maiores que a quantidade de produtos selecionados.")
  }
}

export async function updateComboAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const priceInCents = parseMoneyToCents(formData.get("price"))
  const totalUnits = Number(String(formData.get("totalUnits") ?? "").replace(/\D/g, ""))
  const options = parseComboOptions(formData)
  if (!id) throw new Error("Combo nao encontrado.")

  assertValidComboInput({ name, priceInCents, totalUnits, options })

  await prisma.combo.update({
    where: { id },
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      image: null,
      priceInCents,
      audience: getComboAudience(formData),
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
  revalidateComboMarketplacePaths()
}

function revalidateComboMarketplacePaths() {
  revalidatePath("/marketplace")
  revalidatePath("/marketplace/combos")
}
