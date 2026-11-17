import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { normalizeSearchText } from "@/lib/search-text"

export async function findMatchingProductIds(
  where: Prisma.ProductWhereInput,
  query: string,
  extraField: "sku" | "description"
) {
  const search = normalizeSearchText(query)
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      packageLabel: true,
      sku: true,
      description: true,
      category: { select: { name: true } },
    },
  })

  return products
    .filter((product) =>
      [product.name, product.packageLabel, product.category.name, product[extraField]].some(
        (value) => value !== null && normalizeSearchText(value).includes(search)
      )
    )
    .map((product) => product.id)
}
