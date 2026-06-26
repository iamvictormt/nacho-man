import { Fragment } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { SearchParams } from "@/lib/pagination"

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
}

function pageHref(searchParams: SearchParams | undefined, page: number) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "page" || value === undefined) continue
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
    } else {
      params.set(key, value)
    }
  }

  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `?${query}` : "?"
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  searchParams,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  searchParams?: SearchParams
}) {
  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages(currentPage, totalPages)

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
        Página {currentPage} de {totalPages} · {totalItems} registros
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={pageHref(searchParams, Math.max(1, currentPage - 1))}
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-45" : undefined}
            />
          </PaginationItem>
          {visiblePages.map((page, index) => {
            const previousPage = visiblePages[index - 1]
            const showGap = previousPage !== undefined && page - previousPage > 1

            return (
              <Fragment key={page}>
                {showGap && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink href={pageHref(searchParams, page)} isActive={page === currentPage}>
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </Fragment>
            )
          })}
          <PaginationItem>
            <PaginationNext
              href={pageHref(searchParams, Math.min(totalPages, currentPage + 1))}
              aria-disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-45" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
