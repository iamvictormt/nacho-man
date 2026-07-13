type OrderItemCategory = {
  name: string
  sortOrder: number
} | null

type OrderItemWithCategory = {
  name: string
  product?: {
    category?: OrderItemCategory
  } | null
}

function getOrderItemCategory(item: OrderItemWithCategory) {
  return item.product?.category ?? null
}

export function sortOrderItemsByCategory<T extends OrderItemWithCategory>(items: T[]) {
  return [...items].sort((a, b) => {
    const categoryA = getOrderItemCategory(a)
    const categoryB = getOrderItemCategory(b)
    const sortA = categoryA?.sortOrder ?? Number.MAX_SAFE_INTEGER
    const sortB = categoryB?.sortOrder ?? Number.MAX_SAFE_INTEGER

    if (sortA !== sortB) return sortA - sortB

    const categoryName = (categoryA?.name ?? "ZZZ").localeCompare(categoryB?.name ?? "ZZZ", "pt-BR")
    if (categoryName !== 0) return categoryName

    return a.name.localeCompare(b.name, "pt-BR")
  })
}

export function getOrderItemCategoryName(item: OrderItemWithCategory) {
  return getOrderItemCategory(item)?.name ?? null
}
