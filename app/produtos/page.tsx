import { PublicProductsCatalog } from "@/components/public-products-catalog"
import { prisma } from "@/lib/prisma"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"

export const dynamic = "force-dynamic"

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    where: { audience: "PUBLIC", active: true, category: { active: true } },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { category: { name: "asc" } }, { featured: "desc" }, { name: "asc" }],
  })
  const sortedProducts = products.map(adaptMarketplaceProduct).sort((first, second) => {
    const lineComparison = (first.category === "CONGELADO" ? 0 : 1) - (second.category === "CONGELADO" ? 0 : 1)
    if (lineComparison !== 0) return lineComparison

    const subcategoryComparison = first.subcategory.localeCompare(second.subcategory, "pt-BR")
    if (subcategoryComparison !== 0) return subcategoryComparison

    return first.name.localeCompare(second.name, "pt-BR")
  })

  return <PublicProductsCatalog products={sortedProducts} />
}
