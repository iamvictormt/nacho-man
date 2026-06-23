import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"
import { MarketplaceProductDetail } from "@/components/marketplace-product-detail"

export default async function MarketplaceProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findFirst({
    where: { id, active: true, category: { active: true } },
    include: { category: true },
  })

  if (!product) notFound()

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      active: true,
      category: { active: true },
      OR: [{ categoryId: product.categoryId }, { featured: true }],
    },
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { featured: "desc" }],
    take: 3,
  })

  return (
    <MarketplaceProductDetail
      product={adaptMarketplaceProduct(product)}
      commerce={{
        id: product.id,
        unit: product.unit,
        packageLabel: product.packageLabel,
        minimumQuantity: product.minimumQuantity,
      }}
      relatedProducts={related.map((item) => ({
        product: adaptMarketplaceProduct(item),
        commerce: {
          id: item.id,
          unit: item.unit,
          packageLabel: item.packageLabel,
          minimumQuantity: item.minimumQuantity,
        },
      }))}
    />
  )
}
