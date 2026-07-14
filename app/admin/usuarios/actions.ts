"use server"

import { revalidatePath } from "next/cache"
import { randomInt } from "crypto"
import { hash } from "bcryptjs"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

function getUniqueConstraintMessage(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return null

  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "")

  if (target.includes("document")) return "Já existe uma franquia cadastrada com este CNPJ."
  if (target.includes("email")) return "Já existe um usuário cadastrado com este e-mail."
  if (target.includes("franchiseId")) return "Já existe um usuário vinculado a esta franquia."

  return "Já existe um cadastro com estes dados."
}

export type TemporaryPasswordResetState = {
  temporaryPassword?: string
  error?: string
}

const TEMPORARY_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*"

function generateTemporaryPassword(length = 12) {
  return Array.from({ length }, () => TEMPORARY_PASSWORD_ALPHABET[randomInt(TEMPORARY_PASSWORD_ALPHABET.length)]).join(
    ""
  )
}

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
  const legalName = String(formData.get("legalName") ?? "").trim()
  const tradeName = String(formData.get("tradeName") ?? "").trim()
  const document = String(formData.get("document") ?? "").replace(/\D/g, "") || null
  const businessEmail = String(formData.get("businessEmail") ?? "")
    .trim()
    .toLowerCase()
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "") || null
  const state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()
  const city = String(formData.get("city") ?? "").trim()

  if (!id) throw new Error("Usuário não encontrado.")
  if (!name) throw new Error("Informe o nome do usuário.")
  if (!email) throw new Error("Informe o e-mail do usuário.")

  if (!legalName) throw new Error("Informe a razão social.")
  if (!tradeName) throw new Error("Informe o nome fantasia.")
  if (!document) throw new Error("Informe o CNPJ.")
  if (!businessEmail) throw new Error("Informe o e-mail comercial.")
  if (!state || !city) throw new Error("Informe UF e cidade.")

  const existingUser = await prisma.user.findFirst({
    where: { email, id: { not: id } },
    select: { id: true },
  })
  if (existingUser) throw new Error("E-mail já cadastrado.")

  const [existingFranchise, existingBusinessProfile] = await Promise.all([
    prisma.franchise.findUnique({ where: { document }, select: { tradeName: true } }),
    prisma.businessProfile.findFirst({
      where: { document, userId: { not: id } },
      select: { id: true },
    }),
  ])
  if (existingFranchise) {
    throw new Error(`Já existe uma franquia cadastrada com este CNPJ: ${existingFranchise.tradeName}.`)
  }
  if (existingBusinessProfile) throw new Error("CNPJ já cadastrado em outro cliente.")

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        businessProfile: {
          upsert: {
            create: { legalName, tradeName, document, email: businessEmail, phone, state, city },
            update: { legalName, tradeName, document, email: businessEmail, phone, state, city },
          },
        },
      },
    })
  } catch (error) {
    throw new Error(getUniqueConstraintMessage(error) ?? "Não foi possível atualizar o cliente.", { cause: error })
  }

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
          select: { tradeName: true },
        })
      : null,
  ])
  if (existingUser) throw new Error("E-mail já cadastrado.")
  if (existingFranchise) {
    throw new Error(`Já existe uma franquia cadastrada com este CNPJ: ${existingFranchise.tradeName}.`)
  }

  try {
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
  } catch (error) {
    throw new Error(getUniqueConstraintMessage(error) ?? "Não foi possível atualizar o franqueado.", { cause: error })
  }

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
  revalidatePath("/admin/franqueados")
}

export async function resetUserTemporaryPasswordAction(
  _state: TemporaryPasswordResetState,
  formData: FormData
): Promise<TemporaryPasswordResetState> {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")

  if (!id) return { error: "Usuário não encontrado." }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  })
  if (!user || user.role === "ADMIN") return { error: "Não é possível resetar a senha deste usuário." }

  const temporaryPassword = generateTemporaryPassword()

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hash(temporaryPassword, 12),
      mustChangePassword: true,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")

  return { temporaryPassword }
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
      select: { _count: { select: { orders: true } } },
    })

    if ((franchise?._count.orders ?? 0) > 0 || user._count.orders > 0) {
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

export async function deleteUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  if (!id) throw new Error("Usuário não encontrado.")

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      role: true,
      franchiseId: true,
      _count: { select: { orders: true } },
    },
  })
  if (!user || user.role === "ADMIN") throw new Error("Usuário não encontrado.")

  if (user.role === "USER") {
    if (user._count.orders > 0) {
      await prisma.user.update({ where: { id }, data: { active: false } })
    } else {
      await prisma.user.delete({ where: { id } })
    }

    revalidateUserPaths()
    return
  }

  if (!user.franchiseId) {
    if (user._count.orders > 0) {
      await prisma.user.update({ where: { id }, data: { active: false } })
    } else {
      await prisma.user.delete({ where: { id } })
    }

    revalidateUserPaths()
    return
  }

  const franchise = await prisma.franchise.findUnique({
    where: { id: user.franchiseId },
    select: { _count: { select: { orders: true } } },
  })

  if ((franchise?._count.orders ?? 0) > 0 || user._count.orders > 0) {
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

  revalidateUserPaths()
}

function revalidateUserPaths() {
  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
  revalidatePath("/admin/franqueados")
}
