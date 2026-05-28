"use client"

import { useState } from "react"
import { Heart, ShoppingCart, Snowflake } from "lucide-react"
import { allProducts, Product } from "@/lib/products"
import { useCartStore } from "@/lib/cart-store"
import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"

const congelados = allProducts.filter((p) => p.category === "CONGELADO")

export default function CongeladosPage() {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Header */}
      <section className="relative py-16 bg-graphite border-b border-border/20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-blue-500/5 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 mb-4">
            <Snowflake className="h-6 w-6 text-lime" />
            <span className="text-[10px] font-black tracking-[0.3em] text-lime">CATEGORIA</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
            CONGELADOS
          </h1>
          <p className="text-muted-foreground mt-3 max-w-lg">
            Carnes, acompanhamentos e doces congelados no ponto. Prontos para aquecer e servir como se fossem feitos na hora.
          </p>
          <p className="text-xs text-lime font-bold mt-4">
            {congelados.length} produtos
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {congelados.map((product) => (
              <CategoryProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}

function CategoryProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAdd() {
    addItem({ name: product.name, price: product.price, image: product.image })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="group relative bg-graphite rounded-2xl border border-border/30 overflow-hidden hover:border-lime/30 transition-all duration-300">
      {product.tag && (
        <span className={`absolute top-3 left-3 z-10 text-[8px] font-black tracking-wider px-2.5 py-0.5 rounded-full ${product.tagColor}`}>
          {product.tag}
        </span>
      )}

      <a href={`/produto/${product.slug}`} className="block">
        <div className="aspect-square bg-gradient-to-br from-purple-dark/10 to-lime/5 p-6 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </a>

      <div className="p-4 space-y-2">
        <span className="text-[8px] font-bold tracking-[0.2em] text-muted-foreground">
          {product.weight}
        </span>
        <a href={`/produto/${product.slug}`}>
          <h3 className="text-sm font-black text-foreground leading-tight hover:text-lime transition-colors">
            {product.name}
          </h3>
        </a>
        <p className="text-[11px] text-muted-foreground line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-1">
          <p className="text-lg font-black text-lime">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </p>
          <button
            onClick={handleAdd}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
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
