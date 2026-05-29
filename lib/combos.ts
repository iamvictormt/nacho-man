import { type Product, allProducts, getProductBySlug } from "./products"

export interface Combo {
  slug: string
  name: string
  items: { productSlug: string; quantity: number }[]
  promoPrice: number
  image: string
  inStock: boolean
}

export const allCombos: Combo[] = [
  {
    slug: "combo-carnes-mexicanas",
    name: "Combo Carnes Mexicanas",
    items: [
      { productSlug: "carne-barbacoa-1-5kg", quantity: 1 },
      { productSlug: "carne-chili-beans-1-5kg", quantity: 1 },
      { productSlug: "carne-costelinha-1-5kg", quantity: 1 },
    ],
    promoPrice: 149.9,
    image: "/carne.webp",
    inStock: true,
  },
  {
    slug: "combo-molhos-essenciais",
    name: "Combo Molhos Essenciais",
    items: [
      { productSlug: "salsa-jalapeno-200ml", quantity: 1 },
      { productSlug: "salsa-ghost-pepper-200ml", quantity: 1 },
      { productSlug: "salsa-negra-200ml", quantity: 1 },
      { productSlug: "salsa-habanero-pina-200ml", quantity: 1 },
    ],
    promoPrice: 39.9,
    image: "/molhos.webp",
    inStock: true,
  },
  {
    slug: "combo-festa-mexicana",
    name: "Combo Festa Mexicana",
    items: [
      { productSlug: "carne-barbacoa-1-5kg", quantity: 2 },
      { productSlug: "frijoles-refritos-1kg", quantity: 2 },
      { productSlug: "base-arroz-mexicano-100g", quantity: 3 },
      { productSlug: "salsa-jalapeno-200ml", quantity: 2 },
    ],
    promoPrice: 199.9,
    image: "/embalagens.webp",
    inStock: true,
  },
  {
    slug: "combo-churros-completo",
    name: "Combo Churros Completo",
    items: [
      { productSlug: "churros-palito-1kg", quantity: 2 },
      { productSlug: "mini-churros-sem-recheio-1kg", quantity: 1 },
      { productSlug: "acucar-especial-churros-500g", quantity: 1 },
    ],
    promoPrice: 34.9,
    image: "/embalagens-2.webp",
    inStock: true,
  },
]

/**
 * Calculates the original price of a combo by summing up individual product prices × quantities.
 */
export function getComboOriginalPrice(combo: Combo): number {
  return combo.items.reduce((total, item) => {
    const product = getProductBySlug(item.productSlug)
    if (!product) return total
    return total + product.price * item.quantity
  }, 0)
}

/**
 * Calculates savings between original price and promotional price.
 * Returns absolute savings in R$ and percentage (rounded to integer).
 */
export function calculateSavings(
  originalPrice: number,
  promoPrice: number
): { absolute: number; percentage: number } {
  const absolute = originalPrice - promoPrice
  const percentage = Math.round(((originalPrice - promoPrice) / originalPrice) * 100)
  return { absolute, percentage }
}

/**
 * Returns combo items resolved with their full Product data.
 */
export function getComboProducts(combo: Combo): { product: Product; quantity: number }[] {
  return combo.items
    .map((item) => {
      const product = getProductBySlug(item.productSlug)
      if (!product) return null
      return { product, quantity: item.quantity }
    })
    .filter((item): item is { product: Product; quantity: number } => item !== null)
}

export function getComboBySlug(slug: string): Combo | undefined {
  return allCombos.find((c) => c.slug === slug)
}
