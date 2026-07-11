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

async function ensureUniqueFranchiseDocument(document: string | null, currentFranchiseId?: string) {
  if (!document) return

  const franchise = await prisma.franchise.findFirst({
    where: {
      document,
      ...(currentFranchiseId ? { id: { not: currentFranchiseId } } : {}),
    },
    select: { tradeName: true },
  })

  if (franchise) {
    throw new Error(`Já existe uma franquia cadastrada com este CNPJ: ${franchise.tradeName}.`)
  }
}

async function ensureUniqueUserEmail(email: string, currentUserId?: string) {
  const user = await prisma.user.findFirst({
    where: {
      email,
      ...(currentUserId ? { id: { not: currentUserId } } : {}),
    },
    select: { name: true },
  })

  if (user) {
    throw new Error(`Já existe um usuário cadastrado com este e-mail: ${user.name}.`)
  }
}

function getUniqueConstraintMessage(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return null

  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "")

  if (target.includes("document")) return "Já existe uma franquia cadastrada com este CNPJ."
  if (target.includes("email")) return "Já existe um usuário cadastrado com este e-mail."
  if (target.includes("franchiseId")) return "Já existe um usuário vinculado a esta franquia."

  return "Já existe um cadastro com estes dados."
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

  if (!tradeName) throw new Error("Informe o nome da unidade.")
  if (!userName) throw new Error("Informe o responsável pela unidade.")
  if (!email) throw new Error("Informe o e-mail de acesso.")
  if (password.length < 8) throw new Error("A senha inicial deve ter pelo menos 8 caracteres.")

  const passwordHash = await hash(password, 12)

  await Promise.all([ensureUniqueFranchiseDocument(document), ensureUniqueUserEmail(email)])

  try {
    await prisma.franchise.create({
      data: {
        tradeName,
        document,
        whatsapp: String(formData.get("whatsapp") ?? "").replace(/\D/g, "") || null,
        user: {
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
  } catch (error) {
    throw new Error(getUniqueConstraintMessage(error) ?? "Não foi possível cadastrar a unidade.", { cause: error })
  }

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
  const document = String(formData.get("document") ?? "").replace(/\D/g, "") || null
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "") || null

  if (!id) throw new Error("Unidade não encontrada.")
  if (!tradeName) throw new Error("Informe o nome da unidade.")
  if (!email) throw new Error("Informe o e-mail de acesso.")
  if (!userName) throw new Error("Informe o responsável pela unidade.")

  await Promise.all([ensureUniqueFranchiseDocument(document, id), ensureUniqueUserEmail(email, userId)])

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.franchise.update({
      where: { id },
      data: {
        tradeName,
        document,
        whatsapp,
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

  try {
    await prisma.$transaction(operations)
  } catch (error) {
    throw new Error(getUniqueConstraintMessage(error) ?? "Não foi possível atualizar a unidade.", { cause: error })
  }
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
