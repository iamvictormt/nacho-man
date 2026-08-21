"use server"

import { compare, hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function updateAdminProfileAction(formData: FormData) {
  const user = await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const currentPassword = String(formData.get("currentPassword") ?? "")
  const newPassword = String(formData.get("newPassword") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")

  if (!name) throw new Error("Informe seu nome.")
  if (!email) throw new Error("Informe seu e-mail.")
  if (!currentPassword) throw new Error("Informe sua senha atual.")

  const changingPassword = Boolean(newPassword || confirmPassword)
  if (changingPassword) {
    if (!newPassword) throw new Error("Informe a nova senha.")
    if (!confirmPassword) throw new Error("Confirme a nova senha.")
    if (newPassword.length < 8) throw new Error("A nova senha precisa ter pelo menos 8 caracteres.")
    if (newPassword !== confirmPassword) throw new Error("A confirmação da senha não confere.")
    if (newPassword === currentPassword) throw new Error("A nova senha precisa ser diferente da senha atual.")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, passwordHash: true },
  })
  if (!dbUser || !(await compare(currentPassword, dbUser.passwordHash))) {
    throw new Error("Senha atual inválida.")
  }

  if (email !== dbUser.email) {
    const existingUser = await prisma.user.findFirst({
      where: { email, id: { not: user.id } },
      select: { id: true },
    })
    if (existingUser) throw new Error("E-mail já cadastrado.")
  }

  if (name === dbUser.name && email === dbUser.email && !changingPassword) {
    throw new Error("Altere o nome, o e-mail ou informe uma nova senha para salvar.")
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email,
      ...(changingPassword ? { passwordHash: await hash(newPassword, 12), mustChangePassword: false } : {}),
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
  revalidatePath("/indicadores")
}
