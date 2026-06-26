import type { CatalogProduct } from "@/lib/products"
import { catalogProductsBySlug } from "@/lib/products"
import { formatMoneyFromCents } from "@/lib/money"

export type MarketplaceProductRecord = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  priceInCents: number
  unit: "KG" | "UND" | "CX"
  packageLabel: string | null
  minimumQuantity: number
  category: {
    name: string
  }
}

function getCatalogCategory(product: MarketplaceProductRecord): CatalogProduct["category"] {
  const publicDetails = catalogProductsBySlug.get(product.slug)

  if (publicDetails) {
    return publicDetails.category
  }

  const categoryName = product.category.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")

  return categoryName.includes("congel") ? "CONGELADO" : "SECO"
}

export function adaptMarketplaceProduct(product: MarketplaceProductRecord): CatalogProduct {
  const publicDetails = catalogProductsBySlug.get(product.slug)
  const description = product.description || publicDetails?.description || ""

  return {
    slug: product.slug,
    name: product.name,
    displayName: product.name,
    description,
    price: product.priceInCents / 100,
    priceUnit: product.unit,
    priceLabel: `${formatMoneyFromCents(product.priceInCents)} / ${product.unit}`,
    category: getCatalogCategory(product),
    subcategory: product.category.name,
    weight: product.packageLabel || "Consulte a embalagem",
    image: product.image || publicDetails?.image || "/placeholder.svg",
    tag: publicDetails?.tag ?? null,
    tagColor: publicDetails?.tagColor ?? "",
    subtitle: publicDetails?.subtitle,
    features: publicDetails?.features ?? [description, product.packageLabel || "Embalagem sob consulta"],
    applications: publicDetails?.applications ?? [],
  }
}
