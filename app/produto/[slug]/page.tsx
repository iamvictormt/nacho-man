import { notFound } from "next/navigation"
import { PublicProductDetail } from "@/components/public-product-detail"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await prisma.product.findFirst({
    where: { slug, audience: "PUBLIC", active: true, category: { active: true } },
    include: { category: true },
  })

  if (!product) {
    notFound()
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      audience: "PUBLIC",
      active: true,
      category: { active: true },
      categoryId: product.categoryId,
    },
    include: { category: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    take: 4,
  })

  return (
    <PublicProductDetail
      product={adaptMarketplaceProduct(product)}
      relatedProducts={relatedProducts.map(adaptMarketplaceProduct)}
    />
  )
}
