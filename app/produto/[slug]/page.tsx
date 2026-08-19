import { notFound } from "next/navigation"
import { PublicProductDetail } from "@/components/public-product-detail"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const productDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  features: true,
  applications: true,
  storageInfo: true,
  usageInfo: true,
  yieldInfo: true,
  image: true,
  priceInCents: true,
  unit: true,
  packageLabel: true,
  minimumQuantity: true,
  categoryId: true,
  category: { select: { name: true } },
} satisfies Prisma.ProductSelect

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await prisma.product.findFirst({
    where: { slug, audience: "PUBLIC", active: true, category: { active: true } },
    select: productDetailSelect,
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
    select: productDetailSelect,
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
