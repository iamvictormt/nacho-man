"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Eye, Plus } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import type { CatalogProduct } from "@/lib/products"

export function ProductDetailCard({ product }: { product: CatalogProduct }) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAddToCart() {
    addItem({
      name: product.displayName,
      price: product.price,
      priceUnit: product.priceUnit,
      image: product.image,
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1000)
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border/90 bg-background transition-all duration-300 hover:border-lime/35 hover:shadow-[0_0_28px_rgba(239,255,13,0.12)]">
      <div className="relative h-72 overflow-hidden bg-graphite [transform:translateZ(0)] sm:h-102">
        <Image
          src={product.image}
          alt={product.displayName}
          fill
          sizes="(max-width: 767px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out [backface-visibility:hidden] group-hover:scale-[1.05]"
        />
         <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
          <span className="rounded-full border border-lime/25 bg-background/78 px-3 py-1 text-lime backdrop-blur">
            {product.subcategory}
          </span>
          <span className="rounded-full border border-border bg-background/78 px-3 py-1 text-muted-foreground backdrop-blur">
            {product.category}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-5 p-5">
        <div>
          <h3 className="text-lg font-black uppercase leading-tight text-foreground transition-colors group-hover:text-lime sm:text-xl">
            {product.displayName}
          </h3>
          {product.subtitle && (
            <p className="mt-1 text-xs font-bold text-muted-foreground">{product.subtitle}</p>
          )}
        </div>
        <ul className="space-y-2">
          {product.features.slice(0, 4).map((feature) => (
            <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-4 border-y border-border/70 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-medium">
              Preço
            </p>
            <p className="mt-1 text-2xl font-black leading-none text-lime">{product.priceLabel}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-medium">
              Embalagem
            </p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-foreground">
              {product.weight}
            </p>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
            Aplicações
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.applications.map((application) => (
              <span
                key={application}
                className="border border-border bg-graphite px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition-colors group-hover:border-lime/20"
              >
                {application}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-auto grid grid-cols-[1.08fr_0.92fr] gap-2 border-t border-border/70 pt-4">
          <button
            onClick={handleAddToCart}
            className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full px-3 py-3 text-[11px] font-black tracking-wide transition-all duration-300 sm:text-xs ${
              added
                ? "bg-purple-medium text-white shadow-[0_0_20px_rgba(91,45,130,0.35)]"
                : "bg-lime text-background hover:shadow-[0_0_20px_rgba(239,255,13,0.3)]"
            }`}
            aria-label={`Adicionar ${product.displayName} ao carrinho`}
          >
            {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {added ? "ADICIONADO" : "ADICIONAR"}
          </button>
          <Link
            href={`/produto/${product.slug}`}
            className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full border border-purple-medium/45 px-3 py-3 text-[11px] font-black tracking-wide text-foreground transition-colors hover:border-purple-medium hover:text-purple-medium sm:text-xs"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            DETALHES
          </Link>
        </div>
      </div>
    </article>
  )
}
