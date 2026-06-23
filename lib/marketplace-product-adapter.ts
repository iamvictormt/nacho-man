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
  unit: string
  packageLabel: string | null
  minimumQuantity: number
  category: {
    name: string
  }
}

export function adaptMarketplaceProduct(product: MarketplaceProductRecord): CatalogProduct {
  const publicDetails = catalogProductsBySlug.get(product.slug)
  const unit = product.unit === "KG" ? "KG" : "UND"
  const description = product.description || publicDetails?.description || ""

  return {
    slug: product.slug,
    name: product.name,
    displayName: product.name,
    description,
    price: product.priceInCents / 100,
    priceUnit: unit,
    priceLabel: `${formatMoneyFromCents(product.priceInCents)} / ${product.unit}`,
    category: publicDetails?.category ?? "SECO",
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
