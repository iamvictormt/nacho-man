"use client"

import { ArrowRight, ShoppingCart, Check } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCartStore } from "@/lib/cart-store"
import { allProducts } from "@/lib/products"
import { formatPrice } from "@/lib/format"

// Get featured products: filter by "BEST SELLER" tag, fallback to first 4
const featuredProducts = (() => {
  const bestSellers = allProducts.filter((p) => p.tag === "BEST SELLER")
  if (bestSellers.length >= 4) return bestSellers.slice(0, 4)
  // If not enough best sellers, fill with other products
  const others = allProducts.filter((p) => p.tag !== "BEST SELLER")
  return [...bestSellers, ...others].slice(0, 4)
})()

export function FeaturedProducts() {
  return (
    <section className="py-16 bg-background relative overflow-hidden">
      {/* Decorative SVG elements */}
      <svg
        className="absolute top-8 left-6 w-16 h-16 text-lime/10 animate-[float_8s_ease-in-out_infinite]"
        viewBox="0 0 64 64"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M32 4c-2 0-4 2-4 4v8c-6 2-10 8-10 14 0 8 6 14 14 14s14-6 14-14c0-6-4-12-10-14V8c0-2-2-4-4-4zm0 8c1 0 2 .5 2 1.5S33 15 32 15s-2-.5-2-1.5S31 12 32 12zm-8 16c0-4 4-8 8-8s8 4 8 8-4 8-8 8-8-4-8-8z" />
        <path d="M20 44c-2 2-2 4 0 6l4 4c2 2 4 2 6 0l2-2-10-10-2 2zm18 0l2 2-10 10-2-2c-2-2-2-4 0-6l4-4c2-2 4-2 6 0z" />
      </svg>

      <svg
        className="absolute bottom-12 right-10 w-20 h-20 text-purple-medium/10 animate-[float_10s_ease-in-out_infinite_1s]"
        viewBox="0 0 64 64"
        fill="currentColor"
        aria-hidden="true"
      >
        <ellipse cx="32" cy="48" rx="20" ry="8" />
        <path d="M16 44c0-12 7-32 16-32s16 20 16 32" />
        <path d="M24 20c2-4 5-6 8-6s6 2 8 6" opacity="0.5" />
      </svg>

      <svg
        className="absolute top-1/2 right-1/4 w-12 h-12 text-lime/5 animate-[float_7s_ease-in-out_infinite_2s]"
        viewBox="0 0 48 48"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M24 4l4 8 8 2-6 6 2 8-8-4-8 4 2-8-6-6 8-2z" />
      </svg>

      <svg
        className="absolute bottom-1/3 left-1/4 w-14 h-14 text-purple-medium/8 animate-[float_9s_ease-in-out_infinite_3s]"
        viewBox="0 0 56 56"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="28" cy="28" r="12" />
        <path d="M28 8v8M28 40v8M8 28h8M40 28h8M14 14l6 6M36 36l6 6M14 42l6-6M36 20l6-6" strokeWidth="2" stroke="currentColor" fill="none" />
      </svg>

      <div className="mx-auto max-w-7xl px-4 relative z-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-[10px] font-bold text-lime tracking-[0.3em] uppercase">Catálogo</span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1">
              NOSSOS PRODUTOS
            </h2>
          </div>
          <Link
            href="/produtos"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-black tracking-wider text-lime hover:gap-3 transition-all"
          >
            VER TODOS <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden flex justify-center mt-8">
          <Link href="/produtos" className="inline-flex items-center gap-2 text-sm font-black text-lime tracking-wider">
            VER CATÁLOGO COMPLETO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: typeof featuredProducts[0] }) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAdd() {
    addItem({ name: product.name, price: product.price, image: product.image })
    setAdded(true)
    setTimeout(() => {
      openCart()
      setAdded(false)
    }, 1000)
  }

  return (
    <div className="group rounded-2xl overflow-hidden border border-border bg-graphite hover:border-purple-medium/40 hover:shadow-[0_0_25px_rgba(91,45,130,0.12)] transition-all duration-500">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
          loading="lazy"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent" />
        {product.tag && (
          <span className={`absolute top-3 left-3 px-2 py-0.5 text-[9px] font-bold rounded-full ${product.tagColor}`}>
            {product.tag}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-black text-foreground leading-tight group-hover:text-lime transition-colors">
          {product.name}
        </h3>
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm font-black text-lime">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={handleAdd}
            className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              added
                ? "bg-purple-medium scale-125 shadow-[0_0_20px_rgba(91,45,130,0.5)]"
                : "bg-lime hover:scale-110 hover:shadow-[0_0_15px_rgba(230,230,59,0.4)]"
            } text-background`}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
