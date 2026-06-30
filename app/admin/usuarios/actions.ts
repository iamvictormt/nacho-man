"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function toggleCommonUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active")) === "true"
  if (!id) return

  await prisma.user.updateMany({
    where: { id, role: "USER" },
    data: { active: !active },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/usuarios")
}

export async function toggleFranchiseeUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active")) === "true"
  if (!id) return

  const user = await prisma.user.findFirst({
    where: { id, role: "FRANCHISEE" },
    select: { franchiseId: true },
  })
  if (!user) return

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

export async function rejectFranchiseeUserAction(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const user = await prisma.user.findFirst({
    where: { id, role: "FRANCHISEE", active: false },
    select: {
      franchiseId: true,
      _count: { select: { orders: true } },
    },
  })
  if (!user) return

  if (!user.franchiseId) {
    await prisma.user.delete({ where: { id } })
  } else {
    const franchise = await prisma.franchise.findUnique({
      where: { id: user.franchiseId },
      select: { _count: { select: { orders: true, users: true } } },
    })

    if ((franchise?._count.orders ?? 0) > 0 || user._count.orders > 0 || (franchise?._count.users ?? 0) > 1) {
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
