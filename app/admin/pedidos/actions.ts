"use server"

import { OrderStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  const status = String(formData.get("status") ?? "") as OrderStatus

  if (!orderId || !Object.values(OrderStatus).includes(status)) return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      statusHistory: {
        create: { status, note: "Status atualizado pela Nacho Factory." },
      },
    },
  })

  revalidatePath("/admin/pedidos")
  revalidatePath("/marketplace/pedidos")
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  if (!orderId) return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      statusHistory: {
        create: { status: "CANCELLED", note: "Pedido cancelado pelo admin." },
      },
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/pedidos")
  revalidatePath("/marketplace/pedidos")
}

export async function deleteOrderAction(formData: FormData) {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")
  if (!orderId) return
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } })
  if (!order || order.status !== "CANCELLED") return
  await prisma.order.delete({ where: { id: orderId } })
  revalidatePath("/admin")
  revalidatePath("/admin/pedidos")
}
