"use client"

import { ArrowRight, Heart, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { useCartStore } from "@/lib/cart-store"

const products = [
  {
    name: "Carne Barbacoa 1,5kg",
    description: "Carne desfiada temperada lentamente no estilo mexicano.",
    price: 71.00,
    category: "CONGELADO",
    image: "/placeholder.svg?height=280&width=280",
    tag: "BEST SELLER",
    tagColor: "bg-lime text-background",
  },
  {
    name: "Carne Chili Beans 1,5kg",
    description: "Mistura de carne com feijão e temperos mexicanos.",
    price: 49.00,
    category: "CONGELADO",
    image: "/placeholder.svg?height=280&width=280",
    tag: null,
    tagColor: "",
  },
  {
    name: "Carne Costelinha 1,5kg",
    description: "Costelinha suína desfiada e extremamente suculenta.",
    price: 57.00,
    category: "CONGELADO",
    image: "/placeholder.svg?height=280&width=280",
    tag: "NOVO",
    tagColor: "bg-purple-medium text-white",
  },
]

export function FeaturedProducts() {
  return (
    <section id="produtos" className="py-16 bg-background">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-[10px] font-black tracking-[0.3em] text-lime">
              DROPS
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-1">
              EM DESTAQUE
            </h2>
          </div>
          <a
            href="#"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-black tracking-wider text-foreground/70 hover:text-lime transition-colors group"
          >
            VER CATÁLOGO
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <ProductCard key={i} product={product} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden flex justify-center mt-8">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-black text-lime tracking-wider"
          >
            VER CATÁLOGO COMPLETO
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: typeof products[0] }) {
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const formattedPrice = product.price.toFixed(2).replace(".", ",")

  function handleAddToCart() {
    addItem({
      name: product.name,
      price: product.price,
      image: product.image,
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="group relative bg-graphite rounded-2xl border border-border/30 overflow-hidden transition-all duration-500 hover:border-lime/30 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(198,255,0,0.1)]">
      {/* Tag */}
      {product.tag && (
        <span className={`absolute top-4 left-4 z-10 text-[9px] font-black tracking-wider px-3 py-1 rounded-full ${product.tagColor}`}>
          {product.tag}
        </span>
      )}

      {/* Wishlist button */}
      <button
        onClick={() => setLiked(!liked)}
        className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-lime hover:bg-background transition-all"
        aria-label="Adicionar aos favoritos"
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-lime text-lime" : ""}`} />
      </button>

      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-purple-dark/10 via-transparent to-lime/5 p-8 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Category */}
        <span className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground">
          {product.category}
        </span>

        {/* Name */}
        <h3 className="text-base font-black text-foreground leading-tight">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {product.description}
        </p>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xl font-black text-lime">
              R$ {formattedPrice}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              ou 3x de R$ {(product.price / 3).toFixed(2).replace(".", ",")}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              added
                ? "bg-green-500 scale-110"
                : "bg-lime hover:scale-110"
            } text-background`}
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
