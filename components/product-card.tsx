"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Check } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { formatPrice } from "@/lib/format"

interface ProductCardProps {
  product: {
    slug: string
    name: string
    description: string
    price: number
    image: string
    tag: string | null
    tagColor: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({ name: product.name, price: product.price, image: product.image })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1000)
  }

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group block rounded-2xl overflow-hidden border border-border bg-graphite hover:border-lime/40 hover:shadow-[0_0_20px_rgba(230,230,59,0.15)] transition-all duration-500"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
          loading="lazy"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent" />

        {/* Tag badge */}
        {product.tag && (
          <span
            className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${product.tagColor}`}
          >
            {product.tag}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-black text-foreground leading-tight group-hover:text-lime transition-colors">
          {product.name}
        </h3>
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm font-black text-lime">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={handleAddToCart}
            className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              added
                ? "bg-purple-medium scale-125 shadow-[0_0_20px_rgba(91,45,130,0.5)]"
                : "bg-lime hover:scale-110 hover:shadow-[0_0_15px_rgba(230,230,59,0.4)]"
            } text-background`}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            {added ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
