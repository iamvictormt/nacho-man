export const DEFAULT_PAGE_SIZE = 12

export type SearchParams = Record<string, string | string[] | undefined>

export function getCurrentPage(searchParams?: SearchParams) {
  const rawPage = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page
  const page = Number(rawPage ?? 1)

  return Number.isInteger(page) && page > 0 ? page : 1
}

export function getSearchQuery(searchParams?: SearchParams, key = "q") {
  const rawQuery = Array.isArray(searchParams?.[key]) ? searchParams?.[key]?.[0] : searchParams?.[key]
  return String(rawQuery ?? "").trim()
}

export function getPagination(page: number, totalItems: number, pageSize = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, totalPages)

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  }
}
