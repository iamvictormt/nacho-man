"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Eye, ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"

export interface ProductDetail {
  slug: string
  name: string
  subtitle?: string
  price: string
  image: string
  features: string[]
  applications: string[]
}

export function ProductDetailCard({ product }: { product: ProductDetail }) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAddToCart() {
    addItem({
      name: product.name,
      price: parsePrice(product.price),
      image: product.image,
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1000)
  }

  return (
    <article className="flex h-full flex-col overflow-hidden border border-border bg-graphite">
      <div className="relative h-44 overflow-hidden sm:h-48">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 767px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div>
          <h3 className="text-base font-black uppercase leading-tight text-foreground sm:text-lg">
            {product.name}
          </h3>
          {product.subtitle && (
            <p className="mt-1 text-xs font-bold text-muted-foreground">{product.subtitle}</p>
          )}
        </div>
        <ul className="space-y-2">
          {product.features.map((feature) => (
            <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
            Preço
          </p>
          <p className="mt-1 text-3xl font-black text-lime">{product.price}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
            Aplicações
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.applications.map((application) => (
              <span
                key={application}
                className="border border-border bg-background/45 px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
              >
                {application}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-4">
          <button
            onClick={handleAddToCart}
            className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full px-3 py-3 text-[11px] font-black tracking-wide transition-all duration-300 sm:text-xs ${
              added
                ? "bg-purple-medium text-white shadow-[0_0_20px_rgba(91,45,130,0.35)]"
                : "bg-lime text-background hover:shadow-[0_0_20px_rgba(230,230,59,0.3)]"
            }`}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
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

function parsePrice(price: string): number {
  const numeric = price.replace(/[^\d,]/g, "").replace(",", ".")
  return Number(numeric)
}
