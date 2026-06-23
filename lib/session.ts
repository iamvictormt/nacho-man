import "server-only"

import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

const SESSION_COOKIE = "nacho-factory-session"
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

export type SessionPayload = {
  userId: string
  role: "ADMIN" | "FRANCHISEE"
  franchiseId?: string
  expiresAt: string
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET

  if (!secret) {
    throw new Error("SESSION_SECRET não está configurado.")
  }

  return new TextEncoder().encode(secret)
}

export async function encryptSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret())
}

export async function decryptSession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    })

    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(input: Omit<SessionPayload, "expiresAt">) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)
  const token = await encryptSession({
    ...input,
    expiresAt: expiresAt.toISOString(),
  })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession() {
  const cookieStore = await cookies()
  return decryptSession(cookieStore.get(SESSION_COOKIE)?.value)
}

export { SESSION_COOKIE }
