import { PublicProductsCatalog } from "@/components/public-products-catalog"
import { prisma } from "@/lib/prisma"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"

export const dynamic = "force-dynamic"

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    where: { audience: "PUBLIC", active: true, category: { active: true } },
    include: { category: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  })

  return <PublicProductsCatalog products={products.map(adaptMarketplaceProduct)} />
}
