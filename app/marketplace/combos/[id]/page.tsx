import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireMarketplaceUser } from "@/lib/auth"
import { MarketplaceComboDetail } from "@/components/marketplace-combo-detail"

export default async function MarketplaceComboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireMarketplaceUser()
  if (user.role !== "FRANCHISEE") redirect("/marketplace/produtos")

  const { id } = await params
  const now = new Date()
  const combo = await prisma.combo.findFirst({
    where: {
      id,
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              packageLabel: true,
            },
          },
        },
      },
    },
  })

  if (!combo) notFound()

  return <MarketplaceComboDetail combo={combo} />
}
