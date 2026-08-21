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
      canAccessIndicators: true,
      mustChangePassword: true,
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

export function isAdminRole(role: string) {
  return role === "ADMIN" || role === "ADMIN_MASTER"
}

export async function requirePasswordChangeUser() {
  const user = await requireUser()
  if (!user.mustChangePassword) redirect(isAdminRole(user.role) ? "/admin" : "/marketplace")
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.mustChangePassword) redirect("/alterar-senha")
  if (!isAdminRole(user.role)) redirect("/marketplace")
  return user
}

export async function requireMasterAdmin() {
  const user = await requireAdmin()
  if (user.role !== "ADMIN_MASTER") redirect("/admin")
  return user
}

export async function requireIndicatorsAccess() {
  const user = await requireAdmin()
  if (user.role !== "ADMIN_MASTER" && !user.canAccessIndicators) redirect("/admin")
  return user
}

export async function requireFranchisee() {
  const user = await requireUser()
  if (user.mustChangePassword) redirect("/alterar-senha")
  if (user.role !== "FRANCHISEE" || !user.franchiseId || !user.franchise?.active) {
    redirect(isAdminRole(user.role) ? "/admin" : "/login")
  }
  return user
}

export async function requireMarketplaceUser() {
  const user = await requireUser()
  if (user.mustChangePassword) redirect("/alterar-senha")
  if (isAdminRole(user.role)) redirect("/admin")
  if (user.role === "FRANCHISEE" && (!user.franchiseId || !user.franchise?.active)) {
    redirect("/login")
  }
  return user
}
