"use server"

import { hash } from "bcryptjs"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

function getAddressData(formData: FormData) {
  const city = String(formData.get("city") ?? "").trim()
  const state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()

  if (!city || !state) return null

  return {
    label: "Principal",
    street: "Não informado",
    number: "S/N",
    complement: null,
    district: "Não informado",
    city,
    state,
    postalCode: "00000000",
  }
}

export async function createFranchiseAction(formData: FormData) {
  await requireAdmin()

  const tradeName = String(formData.get("tradeName") ?? "").trim()
  const document = String(formData.get("document") ?? "").replace(/\D/g, "") || null
  const userName = String(formData.get("userName") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const address = getAddressData(formData)

  if (!tradeName || !userName || !email || password.length < 8) return

  const passwordHash = await hash(password, 12)

  await prisma.franchise.create({
    data: {
      tradeName,
      document,
      whatsapp: String(formData.get("whatsapp") ?? "").replace(/\D/g, "") || null,
      users: {
        create: {
          name: userName,
          email,
          passwordHash,
          role: "FRANCHISEE",
        },
      },
      ...(address ? { addresses: { create: address } } : {}),
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/franqueados")
}

export async function toggleFranchiseAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active")) === "true"
  if (!id) return

  await prisma.$transaction([
    prisma.franchise.update({ where: { id }, data: { active: !active } }),
    prisma.user.updateMany({ where: { franchiseId: id, role: "FRANCHISEE" }, data: { active: !active } }),
  ])
  revalidatePath("/admin/franqueados")
}

export async function updateFranchiseAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const userId = String(formData.get("userId") ?? "")
  const tradeName = String(formData.get("tradeName") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const userName = String(formData.get("userName") ?? "").trim()
  const addressId = String(formData.get("addressId") ?? "")
  const address = getAddressData(formData)
  if (!id || !tradeName || !email || !userName) return

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.franchise.update({
      where: { id },
      data: {
        tradeName,
        document: String(formData.get("document") ?? "").replace(/\D/g, "") || null,
        whatsapp: String(formData.get("whatsapp") ?? "").replace(/\D/g, "") || null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { name: userName, email },
    }),
  ]

  if (address) {
    operations.push(
      addressId
        ? prisma.address.update({ where: { id: addressId }, data: address })
        : prisma.address.create({ data: { ...address, franchiseId: id } })
    )
  }

  await prisma.$transaction(operations)
  revalidatePath("/admin/franqueados")
}

export async function deleteFranchiseAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const franchise = await prisma.franchise.findUnique({
    where: { id },
    select: { _count: { select: { orders: true } } },
  })
  if (!franchise) return
  if (franchise._count.orders > 0) {
    await prisma.franchise.update({ where: { id }, data: { active: false } })
  } else {
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { franchiseId: id } }),
      prisma.address.deleteMany({ where: { franchiseId: id } }),
      prisma.franchise.delete({ where: { id } }),
    ])
  }
  revalidatePath("/admin")
  revalidatePath("/admin/franqueados")
}
