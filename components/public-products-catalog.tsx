"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ProductDetailCard } from "@/components/product-detail-card"
import { SearchBar } from "@/components/search-bar"
import type { CatalogProduct } from "@/lib/products"

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
}

export function PublicProductsCatalog({
  products,
  initialCategory = null,
}: {
  products: CatalogProduct[]
  initialCategory?: string | null
}) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory)
  const categoryFilters = useMemo(() => {
    const totals = products.reduce<Record<string, number>>((acc, product) => {
      acc[product.subcategory] = (acc[product.subcategory] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(totals)
      .map(([name, count]) => ({ name, count }))
      .sort((first, second) => {
        const countComparison = second.count - first.count
        if (countComparison !== 0) return countComparison
        return first.name.localeCompare(second.name, "pt-BR")
      })
  }, [products])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search.trim())

    return products.filter((product) => {
      const matchesCategory =
        !selectedCategory || product.subcategory === selectedCategory || product.category === selectedCategory
      if (!matchesCategory) return false
      if (!normalizedSearch) return true

      const searchableContent = [
        product.name,
        product.displayName,
        product.subtitle,
        product.subcategory,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")

      return normalizeSearchText(searchableContent).includes(normalizedSearch)
    })
  }, [products, search, selectedCategory])

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        label="Catálogo completo"
        title="NOSSOS PRODUTOS"
        description="Produtos prontos para food service, com preço por kg/und, embalagem e aplicações para sua operação decidir com agilidade."
        icon={ShoppingBag}
      />

      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <CategoryChip
              active={!selectedCategory}
              label="Todas"
              count={products.length}
              onClick={() => setSelectedCategory(null)}
            />
            {categoryFilters.map((category) => (
              <CategoryChip
                key={category.name}
                active={selectedCategory === category.name}
                label={category.name}
                count={category.count}
                onClick={() => setSelectedCategory(category.name)}
              />
            ))}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductDetailCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-lime/20 bg-lime/10">
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
              <h3 className="mb-2 mt-1 text-lg font-black text-foreground">Nenhum produto encontrado</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">Tente buscar por outro termo ou nome.</p>
              <button
                onClick={() => {
                  setSearch("")
                  setSelectedCategory(null)
                }}
                className="rounded-full bg-lime px-6 py-3 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,255,13,0.3)]"
              >
                LIMPAR BUSCA
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border bg-graphite py-20">
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
        <div className="relative mx-auto max-w-3xl space-y-6 px-4 text-center">
          <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            PRECISA DE UM PRODUTO <span className="text-purple-medium neon-glow-purple">PERSONALIZADO?</span>
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Desenvolvemos produtos, bases e receitas sob medida para padronizar a sua operação.
          </p>
          <Link
            href="/#contato"
            className="group inline-flex items-center gap-3 rounded-full bg-lime px-8 py-4 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(200,255,0,0.3)]"
          >
            FALE COM O COMERCIAL
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  )
}

function CategoryChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-wider transition ${
        active
          ? "border-lime bg-lime text-background"
          : "border-border bg-graphite text-muted-foreground hover:border-lime/40 hover:text-lime"
      }`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[9px] ${active ? "bg-background/15" : "bg-background"}`}>
        {count}
      </span>
    </button>
  )
}
