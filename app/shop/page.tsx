"use client"

import { useState } from "react"
import { Heart, ShoppingCart, SlidersHorizontal, X } from "lucide-react"
import { allProducts, Product } from "@/lib/products"
import { useCartStore } from "@/lib/cart-store"
import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"

const subcategories = ["Todos", "Carnes", "Molhos", "Temperos", "Kits", "Doces", "Acompanhamentos", "Vegetariano", "Food Service"]

export default function ShopPage() {
  const [activeFilter, setActiveFilter] = useState("Todos")
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">("name")

  const filtered = allProducts
    .filter((p) => activeFilter === "Todos" || p.subcategory === activeFilter)
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price
      if (sortBy === "price-desc") return b.price - a.price
      return a.name.localeCompare(b.name)
    })

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Page header */}
      <section className="py-12 bg-graphite border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4">
          <span className="text-[10px] font-black tracking-[0.3em] text-lime">CATÁLOGO</span>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mt-2">
            TODOS OS PRODUTOS
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {allProducts.length} produtos disponíveis
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4">
          {/* Filter bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
              {subcategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${
                    activeFilter === cat
                      ? "bg-lime text-background"
                      : "bg-graphite text-foreground/70 border border-border/30 hover:border-lime/30"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-graphite border border-border/30 rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-lime/50"
              >
                <option value="name">Nome A-Z</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
              </select>
            </div>
          </div>

          {/* Active filter indicator */}
          {activeFilter !== "Todos" && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-muted-foreground">Filtrando por:</span>
              <button
                onClick={() => setActiveFilter("Todos")}
                className="inline-flex items-center gap-1 bg-lime/10 text-lime text-xs font-bold px-3 py-1 rounded-full"
              >
                {activeFilter}
                <X className="h-3 w-3" />
              </button>
              <span className="text-xs text-muted-foreground">
                ({filtered.length} {filtered.length === 1 ? "produto" : "produtos"})
              </span>
            </div>
          )}

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((product) => (
              <ShopProductCard key={product.slug} product={product} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm">Nenhum produto encontrado nessa categoria.</p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}

function ShopProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const formattedPrice = product.price.toFixed(2).replace(".", ",")

  function handleAdd() {
    addItem({ name: product.name, price: product.price, image: product.image })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="group relative bg-graphite rounded-2xl border border-border/30 overflow-hidden transition-all duration-500 hover:border-lime/30 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(198,255,0,0.1)]">
      {product.tag && (
        <span className={`absolute top-3 left-3 z-10 text-[8px] font-black tracking-wider px-2.5 py-0.5 rounded-full ${product.tagColor}`}>
          {product.tag}
        </span>
      )}

      <button
        onClick={() => setLiked(!liked)}
        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-lime transition-all"
        aria-label="Favoritar"
      >
        <Heart className={`h-3.5 w-3.5 ${liked ? "fill-lime text-lime" : ""}`} />
      </button>

      <a href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-square bg-gradient-to-br from-purple-dark/10 via-transparent to-lime/5 p-6 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      </a>

      <div className="p-4 space-y-2">
        <span className="text-[8px] font-bold tracking-[0.2em] text-muted-foreground">
          {product.subcategory.toUpperCase()}
        </span>
        <a href={`/produto/${product.slug}`}>
          <h3 className="text-sm font-black text-foreground leading-tight line-clamp-2 hover:text-lime transition-colors">
            {product.name}
          </h3>
        </a>
        <div className="flex items-center justify-between pt-1">
          <p className="text-lg font-black text-lime">R$ {formattedPrice}</p>
          <button
            onClick={handleAdd}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
              added ? "bg-green-500 scale-110" : "bg-lime hover:scale-110"
            } text-background`}
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
