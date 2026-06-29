import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session?.userId) return null

  return prisma.user.findFirst({
    where: {
      id: session.userId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      franchiseId: true,
      franchise: {
        select: {
          id: true,
          tradeName: true,
          active: true,
          priceDiscount: true,
        },
      },
    },
  })
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== "ADMIN") redirect("/marketplace")
  return user
}

export async function requireFranchisee() {
  const user = await requireUser()
  if (user.role !== "FRANCHISEE" || !user.franchiseId || !user.franchise?.active) {
    redirect(user.role === "ADMIN" ? "/admin" : "/login")
  }
  return user
}

export async function requireMarketplaceUser() {
  const user = await requireUser()
  if (user.role === "ADMIN") redirect("/admin")
  if (user.role === "FRANCHISEE" && (!user.franchiseId || !user.franchise?.active)) {
    redirect("/login")
  }
  return user
}
