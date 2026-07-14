"use server"

import { compare, hash } from "bcryptjs"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/session"
import { sendMail } from "@/lib/email"

export type LoginState = {
  error?: string
}

export type RegisterState = {
  error?: string
  success?: string
}

export type ForgotPasswordState = {
  email?: string
  error?: string
  success?: string
}

const RESET_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const RESET_CODE_EXPIRATION_MINUTES = 10

function generateResetCode() {
  let code = ""
  const array = new Uint32Array(4)
  crypto.getRandomValues(array)

  for (const value of array) {
    code += RESET_CODE_ALPHABET[value % RESET_CODE_ALPHABET.length]
  }

  return code
}

function buildPasswordResetEmail(code: string) {
  return {
    subject: "Código para redefinir sua senha - Nacho Factory",
    text: `Seu código para redefinir a senha é ${code}. Ele expira em ${RESET_CODE_EXPIRATION_MINUTES} minutos.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0f0f0f;color:#fff;padding:28px;">
        <div style="max-width:520px;margin:0 auto;background:#171717;border:1px solid #2a2a2a;border-radius:16px;padding:26px;">
          <p style="margin:0 0 8px;color:#d6ff2f;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Nacho Factory</p>
          <h1 style="margin:0 0 16px;font-size:24px;text-transform:uppercase;">Redefinição de senha</h1>
          <p style="margin:0 0 20px;color:#d1d5db;line-height:1.6;">Use o código abaixo para criar uma nova senha. Ele expira em ${RESET_CODE_EXPIRATION_MINUTES} minutos.</p>
          <p style="margin:0;padding:18px;border-radius:12px;background:#d6ff2f;color:#101010;text-align:center;font-size:32px;font-weight:900;letter-spacing:.3em;">${code}</p>
          <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">Se você não solicitou essa alteração, ignore este e-mail.</p>
        </div>
      </div>
    `,
  }
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

  if (!user || !(await compare(password, user.passwordHash))) {
    return { error: "E-mail ou senha inválidos." }
  }

  if (user.role === "FRANCHISEE" && (!user.active || !user.franchise?.active)) {
    return { error: "Seu cadastro ainda está pendente de aprovação." }
  }

  if (!user.active) {
    return { error: "Seu acesso está inativo. Fale com a Nacho Factory." }
  }

  await createSession(
    {
      userId: user.id,
      role: user.role,
      franchiseId: user.franchiseId ?? undefined,
    },
    rememberMe
  )

  redirect(user.mustChangePassword ? "/alterar-senha" : user.role === "ADMIN" ? "/admin" : "/marketplace")
}

export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("registerEmail") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("registerPassword") ?? "")
  const isFranchisee = formData.get("isFranchisee") === "on"
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "") || null
  const legalName = String(formData.get("legalName") ?? "").trim()
  const tradeName = String(formData.get("tradeName") ?? "").trim()
  const document = String(formData.get("document") ?? "").replace(/\D/g, "") || null
  const businessEmail = String(formData.get("businessEmail") ?? "")
    .trim()
    .toLowerCase()
  const city = String(formData.get("city") ?? "").trim()
  const state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()

  if (!name || !email || password.length < 8) {
    return { error: "Informe seu nome, e-mail e uma senha com pelo menos 8 caracteres." }
  }

  const passwordHash = await hash(password, 12)

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existingUser) {
      return { error: "Já existe um cadastro com este e-mail." }
    }

    if (!legalName || !tradeName || !document || !businessEmail || !city || !state) {
      return { error: "Preencha o CNPJ, a razão social, o nome fantasia, o endereço e o e-mail comercial." }
    }

    const [existingFranchise, existingBusinessProfile] = await Promise.all([
      prisma.franchise.findUnique({ where: { document }, select: { id: true } }),
      prisma.businessProfile.findUnique({ where: { document }, select: { id: true } }),
    ])
    if (existingFranchise || existingBusinessProfile) {
      return { error: "Já existe um cadastro com este CNPJ." }
    }

    if (!isFranchisee) {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "USER",
          businessProfile: {
            create: {
              legalName,
              tradeName,
              document,
              email: businessEmail,
              phone,
              city,
              state,
            },
          },
        },
      })

      await createSession({ userId: user.id, role: "USER" })
    } else {
      if (!tradeName || !document || !phone || !city || !state) {
        return { error: "Preencha os dados da unidade para solicitar aprovação como franqueado." }
      }

      const existingFranchise = await prisma.franchise.findUnique({
        where: { document },
        select: { id: true },
      })
      if (existingFranchise) {
        return { error: "Já existe uma unidade cadastrada com este CNPJ." }
      }

      await prisma.franchise.create({
        data: {
          tradeName,
          legalName,
          document,
          whatsapp: phone,
          active: false,
          user: {
            create: {
              name,
              email,
              passwordHash,
              role: "FRANCHISEE",
              active: false,
            },
          },
          addresses: {
            create: {
              label: "Principal",
              street: "Não informado",
              number: "S/N",
              complement: null,
              district: "Não informado",
              city,
              state,
              postalCode: "00000000",
            },
          },
        },
      })

      return { success: "Solicitação enviada. Seu acesso ficará liberado após aprovação do admin." }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Já existe um cadastro com este e-mail ou CNPJ." }
    }

    return { error: "Não foi possível concluir o cadastro no momento." }
  }

  if (!isFranchisee) redirect("/marketplace")
  return {}
}

export async function requestPasswordResetAction(
  _state: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("resetEmail") ?? "")
    .trim()
    .toLowerCase()

  if (!email) {
    return { error: "Informe o e-mail cadastrado." }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, active: true, email: true },
  })

  if (!user) {
    return { email, error: "Não encontramos um cadastro com este e-mail." }
  }

  if (!user.active) {
    return { email, error: "Este acesso está inativo. Fale com a Nacho Factory." }
  }

  const code = generateResetCode()
  const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRATION_MINUTES * 60 * 1000)
  const emailContent = buildPasswordResetEmail(code)

  await prisma.$transaction([
    prisma.passwordResetCode.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    }),
  ])

  await sendMail({
    to: user.email,
    ...emailContent,
  })

  return { email, success: "Enviamos um código de 4 caracteres para o seu e-mail." }
}

export async function resetPasswordAction(
  _state: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("resetEmail") ?? "")
    .trim()
    .toLowerCase()
  const code = String(formData.get("resetCode") ?? "")
    .trim()
    .toUpperCase()
  const password = String(formData.get("newPassword") ?? "")

  if (!email || !code || password.length < 8) {
    return { email, error: "Informe e-mail, código e uma nova senha com pelo menos 8 caracteres." }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, active: true },
  })

  if (!user || !user.active) {
    return { email, error: "Não foi possível redefinir a senha para este e-mail." }
  }

  const resetCode = await prisma.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      code,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  })

  if (!resetCode || resetCode.expiresAt < new Date()) {
    return { email, error: "Código inválido ou expirado." }
  }

  if (resetCode.attempts >= 5) {
    return { email, error: "Muitas tentativas com este código. Solicite um novo." }
  }

  const passwordHash = await hash(password, 12)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { usedAt: new Date(), attempts: { increment: 1 } },
    }),
  ])

  return { email, success: "Senha alterada com sucesso. Agora você já pode entrar com a nova senha." }
}

export async function logoutAction() {
  await deleteSession()
  redirect("/login")
}
