"use server"

import { ProductAudience, ProductUnit } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { parseMoneyToCents } from "@/lib/money"
import { createSlug } from "@/lib/slug"

const NEW_CATEGORY_VALUE = "__new__"
const validAudiences = new Set<ProductAudience>(["FRANCHISEE", "PUBLIC"])

function getCategoryName(formData: FormData) {
  const selectedCategory = String(formData.get("category") ?? "").trim()
  const newCategory = String(formData.get("newCategory") ?? "").trim()
  return selectedCategory === NEW_CATEGORY_VALUE ? newCategory : selectedCategory
}

function getProductAudience(formData: FormData) {
  const audience = String(formData.get("audience") ?? "FRANCHISEE") as ProductAudience
  return validAudiences.has(audience) ? audience : "FRANCHISEE"
}

function optionalText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim() || null
}

export async function createProductAction(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const categoryName = getCategoryName(formData)
  const priceInCents = parseMoneyToCents(formData.get("price"))
  const unit = String(formData.get("unit") ?? "UND") as ProductUnit
  const packageLabel = String(formData.get("packageLabel") ?? "").trim()

  if (!name || !categoryName || priceInCents <= 0 || !packageLabel) return

  const categorySlug = createSlug(categoryName)
  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    update: { name: categoryName, active: true },
    create: { name: categoryName, slug: categorySlug },
  })

  let slug = createSlug(name)
  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  await prisma.product.create({
    data: {
      name,
      slug,
      description: optionalText(formData, "description"),
      features: optionalText(formData, "features"),
      applications: optionalText(formData, "applications"),
      storageInfo: optionalText(formData, "storageInfo"),
      usageInfo: optionalText(formData, "usageInfo"),
      yieldInfo: optionalText(formData, "yieldInfo"),
      image: optionalText(formData, "image"),
      sku: optionalText(formData, "sku"),
      priceInCents,
      unit,
      audience: getProductAudience(formData),
      packageLabel,
      minimumQuantity: Math.max(1, Number(formData.get("minimumQuantity") ?? 1)),
      featured: formData.get("featured") === "on",
      categoryId: category.id,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/produtos")
  revalidatePath("/marketplace")
  revalidatePath("/produtos")
}

export async function toggleProductAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active")) === "true"
  if (!id) return

  await prisma.product.update({ where: { id }, data: { active: !active } })
  revalidatePath("/admin/produtos")
  revalidatePath("/marketplace")
  revalidatePath("/produtos")
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const categoryName = getCategoryName(formData)
  const priceInCents = parseMoneyToCents(formData.get("price"))
  const packageLabel = String(formData.get("packageLabel") ?? "").trim()
  if (!id || !name || !categoryName || priceInCents <= 0 || !packageLabel) return

  const category = await prisma.category.upsert({
    where: { slug: createSlug(categoryName) },
    update: { name: categoryName, active: true },
    create: { name: categoryName, slug: createSlug(categoryName) },
  })

  await prisma.product.update({
    where: { id },
    data: {
      name,
      description: optionalText(formData, "description"),
      features: optionalText(formData, "features"),
      applications: optionalText(formData, "applications"),
      storageInfo: optionalText(formData, "storageInfo"),
      usageInfo: optionalText(formData, "usageInfo"),
      yieldInfo: optionalText(formData, "yieldInfo"),
      image: optionalText(formData, "image"),
      sku: optionalText(formData, "sku"),
      priceInCents,
      unit: String(formData.get("unit") ?? "UND") as ProductUnit,
      audience: getProductAudience(formData),
      packageLabel,
      minimumQuantity: Math.max(1, Number(formData.get("minimumQuantity") ?? 1)),
      featured: formData.get("featured") === "on",
      categoryId: category.id,
    },
  })
  revalidateProductPaths()
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return

  const dependencies = await prisma.product.findUnique({
    where: { id },
    select: { _count: { select: { orderItems: true, comboItems: true } } },
  })
  if (!dependencies) return

  if (dependencies._count.orderItems > 0 || dependencies._count.comboItems > 0) {
    await prisma.product.update({ where: { id }, data: { active: false } })
  } else {
    await prisma.product.delete({ where: { id } })
  }
  revalidateProductPaths()
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  if (!id || !name) throw new Error("Informe o nome da categoria.")

  const slug = createSlug(name)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing && existing.id !== id) throw new Error("Já existe uma categoria com esse nome.")

  await prisma.category.update({
    where: { id },
    data: { name, slug, active: true },
  })

  revalidateProductPaths()
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) throw new Error("Categoria inválida.")

  const category = await prisma.category.findUnique({
    where: { id },
    select: { _count: { select: { products: true } } },
  })
  if (!category) throw new Error("Categoria não encontrada.")
  if (category._count.products > 0) throw new Error("Não é possível excluir uma categoria com produtos cadastrados.")

  await prisma.category.delete({ where: { id } })
  revalidateProductPaths()
}

function revalidateProductPaths() {
  revalidatePath("/admin")
  revalidatePath("/admin/produtos")
  revalidatePath("/admin/combos")
  revalidatePath("/marketplace")
  revalidatePath("/marketplace/produtos")
  revalidatePath("/produtos")
}
