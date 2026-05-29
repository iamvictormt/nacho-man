import type { Product } from "./products"

export interface FilterState {
  category: string | null
  subcategory: string | null
  tags: string[]
  search: string
  sort: "name-asc" | "price-asc" | "price-desc"
}

/**
 * Filters products using AND logic across all active filter criteria.
 * - category: exact match on product.category
 * - subcategory: exact match on product.subcategory
 * - tags: product.tag must be in the provided tags array
 * - search: case-insensitive partial match on name or description (min 2 chars to activate)
 */
export function filterProducts(
  products: Product[],
  filters: FilterState
): Product[] {
  return products.filter((product) => {
    // Category filter
    if (filters.category !== null && product.category !== filters.category) {
      return false
    }

    // Subcategory filter
    if (
      filters.subcategory !== null &&
      product.subcategory !== filters.subcategory
    ) {
      return false
    }

    // Tags filter
    if (filters.tags.length > 0) {
      if (product.tag === null || !filters.tags.includes(product.tag)) {
        return false
      }
    }

    // Search filter (min 2 chars)
    if (filters.search.length >= 2) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = product.name.toLowerCase().includes(searchLower)
      const descriptionMatch = product.description
        .toLowerCase()
        .includes(searchLower)
      if (!nameMatch && !descriptionMatch) {
        return false
      }
    }

    return true
  })
}

/**
 * Sorts products by the given sort criterion.
 * - "name-asc": alphabetical by name (using localeCompare)
 * - "price-asc": lowest price first
 * - "price-desc": highest price first
 */
export function sortProducts(
  products: Product[],
  sort: FilterState["sort"]
): Product[] {
  const sorted = [...products]

  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price)
      break
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price)
      break
  }

  return sorted
}
