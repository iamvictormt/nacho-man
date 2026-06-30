"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function toggleCommonUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active")) === "true"
  if (!id) throw new Error("Usuário não encontrado.")

  const result = await prisma.user.updateMany({
    where: { id, role: "USER" },
    data: { active: !active },
  })
  if (result.count === 0) throw new Error("Cliente não encontrado.")

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
}

export async function updateCommonUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()

  if (!id) throw new Error("Usuário não encontrado.")
  if (!name) throw new Error("Informe o nome do usuário.")
  if (!email) throw new Error("Informe o e-mail do usuário.")

  const existingUser = await prisma.user.findFirst({
    where: { email, id: { not: id } },
    select: { id: true },
  })
  if (existingUser) throw new Error("E-mail já cadastrado.")

  await prisma.user.updateMany({
    where: { id, role: "USER" },
    data: { name, email },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
}

export async function toggleFranchiseeUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active")) === "true"
  if (!id) throw new Error("Usuário não encontrado.")

  const user = await prisma.user.findFirst({
    where: { id, role: "FRANCHISEE" },
    select: { franchiseId: true },
  })
  if (!user) throw new Error("Franqueado não encontrado.")

  const nextActive = !active
  const operations = [
    prisma.user.updateMany({
      where: { id, role: "FRANCHISEE" },
      data: { active: nextActive },
    }),
  ]

  if (user.franchiseId) {
    operations.push(
      prisma.franchise.updateMany({
        where: { id: user.franchiseId },
        data: { active: nextActive },
      })
    )
  }

  await prisma.$transaction(operations)

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
  revalidatePath("/admin/franqueados")
}

export async function updateFranchiseeUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const tradeName = String(formData.get("tradeName") ?? "").trim()
  const document = String(formData.get("document") ?? "").replace(/\D/g, "") || null
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "") || null
  const state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()
  const city = String(formData.get("city") ?? "").trim()

  if (!id) throw new Error("Usuário não encontrado.")
  if (!name) throw new Error("Informe o nome do franqueado.")
  if (!email) throw new Error("Informe o e-mail do franqueado.")
  if (!tradeName) throw new Error("Informe o nome da unidade.")

  const user = await prisma.user.findFirst({
    where: { id, role: "FRANCHISEE" },
    select: { franchiseId: true },
  })
  if (!user?.franchiseId) throw new Error("Este franqueado não está vinculado a uma unidade.")
  const franchiseId = user.franchiseId

  const [existingUser, existingFranchise] = await Promise.all([
    prisma.user.findFirst({
      where: { email, id: { not: id } },
      select: { id: true },
    }),
    document
      ? prisma.franchise.findFirst({
          where: { document, id: { not: user.franchiseId } },
          select: { id: true },
        })
      : null,
  ])
  if (existingUser) throw new Error("E-mail já cadastrado.")
  if (existingFranchise) throw new Error("CNPJ já cadastrado.")

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { name, email },
    })
    await tx.franchise.update({
      where: { id: franchiseId },
      data: { tradeName, document, whatsapp },
    })

    if (state && city) {
      const address = await tx.address.findFirst({
        where: { franchiseId },
        select: { id: true },
      })
      const addressData = {
        label: "Principal",
        street: "Não informado",
        number: "S/N",
        complement: null,
        district: "Não informado",
        city,
        state,
        postalCode: "00000000",
      }

      if (address) {
        await tx.address.update({ where: { id: address.id }, data: addressData })
      } else {
        await tx.address.create({ data: { ...addressData, franchiseId } })
      }
    }
  })

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
  revalidatePath("/admin/franqueados")
}

export async function rejectFranchiseeUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  if (!id) throw new Error("Usuário não encontrado.")

  const user = await prisma.user.findFirst({
    where: { id, role: "FRANCHISEE", active: false },
    select: {
      franchiseId: true,
      _count: { select: { orders: true } },
    },
  })
  if (!user) throw new Error("Cadastro pendente não encontrado.")

  if (!user.franchiseId) {
    await prisma.user.delete({ where: { id } })
  } else {
    const franchise = await prisma.franchise.findUnique({
      where: { id: user.franchiseId },
      select: { _count: { select: { orders: true, users: true } } },
    })

    if ((franchise?._count.orders ?? 0) > 0 || user._count.orders > 0 || (franchise?._count.users ?? 0) > 1) {
      await prisma.$transaction([
        prisma.user.update({ where: { id }, data: { active: false } }),
        prisma.franchise.update({ where: { id: user.franchiseId }, data: { active: false } }),
      ])
    } else {
      await prisma.$transaction([
        prisma.address.deleteMany({ where: { franchiseId: user.franchiseId } }),
        prisma.user.delete({ where: { id } }),
        prisma.franchise.delete({ where: { id: user.franchiseId } }),
      ])
    }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
  revalidatePath("/admin/franqueados")
}
