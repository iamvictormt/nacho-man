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

export function PublicProductsCatalog({ products }: { products: CatalogProduct[] }) {
  const [search, setSearch] = useState("")

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search.trim())

    if (!normalizedSearch) {
      return products
    }

    return products.filter((product) => {
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
  }, [products, search])

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        label="Catálogo completo"
        title="NOSSOS PRODUTOS"
        description="Produtos prontos para food service com preço por KG/UND, embalagem e aplicações para sua operação decidir rápido."
        icon={ShoppingBag}
      />

      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6">
            <SearchBar value={search} onChange={setSearch} />
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
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">Tente buscar por outro nome.</p>
              <button
                onClick={() => setSearch("")}
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
