"use server"

import { compare, hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireMarketplaceUser } from "@/lib/auth"

export async function updateMyAccountAction(formData: FormData) {
  const user = await requireMarketplaceUser()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()

  if (!name) throw new Error("Informe seu nome.")
  if (!email) throw new Error("Informe seu e-mail.")

  const existingUser = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
    select: { id: true },
  })
  if (existingUser) throw new Error("E-mail já cadastrado.")

  const legalName = String(formData.get("legalName") ?? "").trim()
  const tradeName = String(formData.get("tradeName") ?? "").trim()
  const document = String(formData.get("document") ?? "").replace(/\D/g, "") || null
  const businessEmail = String(formData.get("businessEmail") ?? "")
    .trim()
    .toLowerCase()
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "") || null
  const state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()
  const city = String(formData.get("city") ?? "").trim()

  if (!legalName) throw new Error("Informe a razão social.")
  if (!tradeName) throw new Error("Informe o nome fantasia.")
  if (!document) throw new Error("Informe o CNPJ.")
  if (!businessEmail) throw new Error("Informe o e-mail comercial.")
  if (!state || !city) throw new Error("Informe UF e cidade.")

  if (user.role !== "FRANCHISEE") {
    const [existingFranchise, existingBusinessProfile] = await Promise.all([
      prisma.franchise.findUnique({ where: { document }, select: { id: true } }),
      prisma.businessProfile.findFirst({
        where: { document, userId: { not: user.id } },
        select: { id: true },
      }),
    ])
    if (existingFranchise || existingBusinessProfile) throw new Error("CNPJ já cadastrado.")

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        businessProfile: {
          upsert: {
            create: { legalName, tradeName, document, email: businessEmail, phone: whatsapp, state, city },
            update: { legalName, tradeName, document, email: businessEmail, phone: whatsapp, state, city },
          },
        },
      },
    })
    revalidateMarketplaceAccount()
    return
  }

  if (!user.franchiseId) throw new Error("Sua conta não está vinculada a uma unidade.")

  if (!tradeName) throw new Error("Informe o nome da unidade.")

  const existingFranchise = document
    ? await prisma.franchise.findFirst({
        where: { document, id: { not: user.franchiseId } },
        select: { id: true },
      })
    : null
  if (existingFranchise) throw new Error("CNPJ já cadastrado.")

  const existingBusinessProfileForFranchise = await prisma.businessProfile.findUnique({
    where: { document },
    select: { id: true },
  })
  if (existingBusinessProfileForFranchise) throw new Error("CNPJ já cadastrado.")

  const franchiseId = user.franchiseId
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { name, email },
    })
    await tx.franchise.update({
      where: { id: franchiseId },
      data: { legalName, tradeName, document, whatsapp },
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

  revalidateMarketplaceAccount()
}

export async function updateMyPasswordAction(formData: FormData) {
  const user = await requireMarketplaceUser()

  const currentPassword = String(formData.get("currentPassword") ?? "")
  const newPassword = String(formData.get("newPassword") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")

  if (!currentPassword) throw new Error("Informe sua senha atual.")
  if (!newPassword) throw new Error("Informe a nova senha.")
  if (!confirmPassword) throw new Error("Confirme a nova senha.")
  if (newPassword.length < 8) throw new Error("A nova senha precisa ter pelo menos 8 caracteres.")
  if (newPassword !== confirmPassword) throw new Error("A confirmação da senha não confere.")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  })
  if (!dbUser || !(await compare(currentPassword, dbUser.passwordHash))) {
    throw new Error("Senha atual inválida.")
  }

  const passwordHash = await hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })
}

function revalidateMarketplaceAccount() {
  revalidatePath("/marketplace")
  revalidatePath("/marketplace/conta")
}
