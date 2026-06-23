"use server"

import { compare } from "bcryptjs"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/session"

export type LoginState = {
  error?: string
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const rememberMe = formData.get("rememberMe") === "on"

  if (!email || !password) {
    return { error: "Informe seu e-mail e sua senha." }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { franchise: true },
  })

  if (
    !user ||
    !user.active ||
    (user.role === "FRANCHISEE" && !user.franchise?.active) ||
    !(await compare(password, user.passwordHash))
  ) {
    return { error: "E-mail ou senha inválidos." }
  }

  await createSession(
    {
      userId: user.id,
      role: user.role,
      franchiseId: user.franchiseId ?? undefined,
    },
    rememberMe
  )

  redirect(user.role === "ADMIN" ? "/admin" : "/marketplace")
}

export async function logoutAction() {
  await deleteSession()
  redirect("/login")
}
