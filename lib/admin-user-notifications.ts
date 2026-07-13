import { prisma } from "@/lib/prisma"

export async function getPendingFranchiseeUsersCount() {
  return prisma.user.count({
    where: {
      role: "FRANCHISEE",
      active: false,
    },
  })
}
