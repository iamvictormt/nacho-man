"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Check, Plus } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { formatPrice } from "@/lib/format"

interface ProductCardProps {
  product: {
    slug: string
    name: string
    description: string
    price: number
    priceUnit: "KG" | "UND"
    subcategory: string
    weight: string
    image: string
    tag: string | null
    tagColor: string
    applications?: string[]
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      name: product.name,
      price: product.price,
      priceUnit: product.priceUnit,
      image: product.image,
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1000)
  }

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-border/90 bg-background transition-all duration-500 hover:border-lime/40 hover:shadow-[0_0_24px_rgba(239,255,13,0.12)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-graphite [transform:translateZ(0)]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
          loading="lazy"
          className="object-cover transition-transform duration-500 ease-out [backface-visibility:hidden] group-hover:scale-[1.05]"
        />
        <div className="absolute inset-[-1px] bg-gradient-to-t from-background via-background/35 to-transparent" />

        {product.tag && (
          <span
            className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${product.tagColor}`}
          >
            {product.tag}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">
            {product.subcategory}
          </span>
          <span className="shrink-0 rounded-full border border-border bg-graphite px-2 py-0.5 text-[10px] font-black text-muted-foreground">
            {product.priceUnit}
          </span>
        </div>
        <h3 className="text-sm font-black text-foreground leading-tight group-hover:text-lime transition-colors">
          {product.name}
        </h3>
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="grid grid-cols-[1.08fr_0.92fr] gap-3 border-y border-border/70 py-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Preço
            </p>
            <p className="mt-1 text-base font-black leading-tight text-lime">
              {formatPrice(product.price)} / {product.priceUnit}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Embalagem
            </p>
            <p className="mt-1 line-clamp-1 text-[11px] font-bold text-foreground">
              {product.weight}
            </p>
          </div>
        </div>
        {product.applications && product.applications.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.applications.slice(0, 3).map((application) => (
              <span
                key={application}
                className="border border-border bg-graphite px-2 py-1 text-[10px] font-bold text-muted-foreground transition-colors group-hover:border-lime/20"
              >
                {application}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleAddToCart}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 text-[11px] font-black tracking-wide transition-all duration-300 ${
              added
                ? "bg-purple-medium text-white shadow-[0_0_20px_rgba(91,45,130,0.5)]"
                : "bg-lime text-background hover:shadow-[0_0_15px_rgba(239,255,13,0.4)]"
            }`}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                ADICIONADO
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                ADICIONAR
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
