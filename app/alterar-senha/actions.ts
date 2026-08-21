"use server"

import { hash } from "bcryptjs"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { isAdminRole, requirePasswordChangeUser } from "@/lib/auth"

export type ForcedPasswordChangeState = {
  error?: string
}

export async function changeForcedPasswordAction(
  _state: ForcedPasswordChangeState,
  formData: FormData
): Promise<ForcedPasswordChangeState> {
  const user = await requirePasswordChangeUser()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")

  if (password.length < 8) {
    return { error: "A nova senha precisa ter pelo menos 8 caracteres." }
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não conferem." }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hash(password, 12),
      mustChangePassword: false,
    },
  })

  redirect(isAdminRole(user.role) ? "/admin" : "/marketplace")
}
