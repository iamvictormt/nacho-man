"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ShoppingBag, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ProductDetailCard } from "@/components/product-detail-card"
import { FilterSidebar } from "@/components/filter-sidebar"
import { SearchBar } from "@/components/search-bar"
import { SortSelect, type SortOption } from "@/components/sort-select"
import { catalogProducts } from "@/lib/products"
import { filterProducts, sortProducts, type FilterState } from "@/lib/filters"

export default function ProdutosPage() {
  const resultsTopRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    subcategory: null,
    tags: [],
    search: "",
    sort: "name-asc",
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const category = params.get("category")

    if (category === "CONGELADO" || category === "SECO") {
      setFilters((prev) => ({ ...prev, category }))
    } else if (category) {
      setFilters((prev) => ({ ...prev, subcategory: category }))
    }
  }, [])

  const filteredAndSorted = useMemo(() => {
    const filtered = filterProducts(catalogProducts, filters)
    return sortProducts(filtered, filters.sort)
  }, [filters])

  function scrollToResultsTop() {
    requestAnimationFrame(() => {
      resultsTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  function handleCategoryChange(category: string | null) {
    setFilters((prev) => ({ ...prev, category }))
    scrollToResultsTop()
  }

  function handleSubcategoryChange(subcategory: string | null) {
    setFilters((prev) => ({ ...prev, subcategory }))
    scrollToResultsTop()
  }

  function handleTagsChange(tags: string[]) {
    setFilters((prev) => ({ ...prev, tags }))
    scrollToResultsTop()
  }

  function handleSearchChange(search: string) {
    setFilters((prev) => ({ ...prev, search }))
    scrollToResultsTop()
  }

  function handleSortChange(sort: SortOption) {
    setFilters((prev) => ({ ...prev, sort }))
    scrollToResultsTop()
  }

  function handleClearAll() {
    setFilters({
      category: null,
      subcategory: null,
      tags: [],
      search: "",
      sort: "name-asc",
    })
    scrollToResultsTop()
  }

  const hasActiveFilters =
    filters.category !== null ||
    filters.subcategory !== null ||
    filters.tags.length > 0 ||
    filters.search.length >= 2

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        label="Catálogo Completo"
        title="NOSSOS PRODUTOS"
        description="Produtos prontos para food service com preço por KG/UND, embalagem e aplicações para sua operação decidir rápido."
        icon={ShoppingBag}
      />

      {/* Content area with sidebar + grid */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - desktop only */}
            <div className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-28">
                <FilterSidebar
                  category={filters.category}
                  subcategory={filters.subcategory}
                  tags={filters.tags}
                  onCategoryChange={handleCategoryChange}
                  onSubcategoryChange={handleSubcategoryChange}
                  onTagsChange={handleTagsChange}
                  onClearAll={handleClearAll}
                />
              </div>
            </div>

            {/* Main content */}
            <div ref={resultsTopRef} className="flex-1 min-w-0 scroll-mt-28">
              {/* Top bar: search + sort + count */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="flex-1 w-full sm:w-auto">
                  <SearchBar value={filters.search} onChange={handleSearchChange} />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[11px] font-bold text-muted-foreground tracking-wider whitespace-nowrap">
                    {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "produto encontrado" : "produtos encontrados"}
                  </span>
                  <SortSelect value={filters.sort} onChange={handleSortChange} />
                </div>
              </div>

              {/* Mobile filters */}
              <div className="lg:hidden mb-6">
                <FilterSidebar
                  category={filters.category}
                  subcategory={filters.subcategory}
                  tags={filters.tags}
                  onCategoryChange={handleCategoryChange}
                  onSubcategoryChange={handleSubcategoryChange}
                  onTagsChange={handleTagsChange}
                  onClearAll={handleClearAll}
                />
              </div>

              {/* Product grid or empty state */}
              {filteredAndSorted.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {filteredAndSorted.map((product) => (
                    <ProductDetailCard key={product.slug} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative h-32 w-32 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center">
                    <img
                      src="/garrafa-pimenta-fundo-amarelo.svg"
                      alt=""
                      width={88}
                      height={88}
                  loading="eager"
                  decoding="sync"
                  className="h-24 w-24 object-contain p-2 opacity-50"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg font-black text-foreground mb-2 mt-1">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Tente ajustar os filtros ou buscar por outro termo.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAll}
                      className="px-6 py-3 rounded-full bg-lime text-background text-sm font-black tracking-wider hover:shadow-[0_0_20px_rgba(239,255,13,0.3)] transition-all duration-300"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-graphite border-t border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
        <div className="relative mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            PRECISA DE UM PRODUTO <span className="text-purple-medium neon-glow-purple">PERSONALIZADO?</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Desenvolvemos produtos, bases e receitas sob medida para padronizar a sua operação.
          </p>
          <Link
            href="/#contato"
            className="group inline-flex items-center gap-3 bg-lime text-background px-8 py-4 rounded-full font-black text-sm tracking-wider hover:shadow-[0_0_30px_rgba(200,255,0,0.3)] transition-all duration-300"
          >
            FALE COM O COMERCIAL
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

    </main>
  )
}
