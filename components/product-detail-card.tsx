"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Check, Package, Plus } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"
import type { CatalogProduct } from "@/lib/products"

type MarketplaceCommerce = {
  context: "marketplace"
  id: string
  unit: string
  packageLabel: string
  minimumQuantity: number
}

type ProductDetailCardProps = {
  product: CatalogProduct
  commerce?: MarketplaceCommerce
}

export function ProductDetailCard({ product, commerce }: ProductDetailCardProps) {
  const [added, setAdded] = useState(false)
  const addPublicItem = useCartStore((state) => state.addItem)
  const openPublicCart = useCartStore((state) => state.openCart)
  const addMarketplaceItem = useMarketplaceCart((state) => state.add)
  const visibleApplications = product.applications.slice(0, 3)
  const remainingApplications = product.applications.length - visibleApplications.length
  const detailHref = commerce ? `/marketplace/produto/${commerce.id}` : `/produto/${product.slug}`

  function handleAddToCart() {
    if (commerce) {
      addMarketplaceItem({
        id: commerce.id,
        type: "PRODUCT",
        name: product.displayName,
        image: product.image,
        unit: commerce.unit,
        packageLabel: commerce.packageLabel,
        unitPriceInCents: Math.round(product.price * 100),
        minimumQuantity: commerce.minimumQuantity,
      })
    } else {
      addPublicItem({
        name: product.displayName,
        price: product.price,
        priceUnit: product.priceUnit,
        image: product.image,
      })
      openPublicCart()
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 1000)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 hover:-translate-y-1.5 hover:border-lime/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35),0_0_28px_rgba(239,255,13,0.08)]">
      <div className="pointer-events-none absolute inset-x-10 top-0 z-20 h-px bg-gradient-to-r from-transparent via-lime/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Link
        href={detailHref}
        className="relative -mb-px block h-80 overflow-hidden bg-background sm:h-96"
        aria-label={`Ver detalhes de ${product.displayName}`}
      >
        <Image
          src={product.image}
          alt={product.displayName}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1535px) 50vw, 33vw"
          className="scale-[1.015] object-cover will-change-transform transition-transform duration-700 ease-out group-hover:scale-[1.075]"
        />
        <div className="absolute -inset-px bg-gradient-to-t from-background via-background/10 to-background/10" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-lime/25 bg-background/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-lime backdrop-blur-md">
            {product.subcategory}
          </span>
          {product.tag && (
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${product.tagColor}`}
            >
              {product.tag}
            </span>
          )}
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
          <div className="rounded-xl border border-white/10 bg-background/85 px-4 py-3 backdrop-blur-md">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">A partir de</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-lime">{product.priceLabel}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-background/85 text-foreground backdrop-blur-md transition-all group-hover:border-lime/40 group-hover:bg-lime group-hover:text-background">
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </Link>

      <div className="relative z-10 flex flex-1 flex-col bg-background p-5 md:p-6">
        <div>
          <Link href={detailHref} className="block">
            <h3 className="mt-3 line-clamp-2 text-xl font-black uppercase leading-[1.1] tracking-[-0.025em] text-foreground transition-colors group-hover:text-lime md:text-2xl">
              {product.displayName}
            </h3>
          </Link>
          {product.subtitle && (
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-muted-foreground">
              {product.subtitle}
            </p>
          )}
        </div>

        <ul className="mt-5 grid gap-2.5">
          {product.features.slice(0, 3).map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm leading-5 text-foreground/75">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime/10">
                <Check className="h-3 w-3 text-lime" aria-hidden="true" />
              </span>
              <span className="line-clamp-1">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-graphite px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-medium/25 bg-purple-medium/10">
            <Package className="h-4 w-4 text-purple-medium" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">Embalagem</p>
            <p className="mt-0.5 truncate text-xs font-bold text-foreground">{product.weight}</p>
          </div>
        </div>

        {visibleApplications.length > 0 && (
          <div className="mt-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Ideal para</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {visibleApplications.map((application) => (
                <span
                  key={application}
                  className="rounded-full border border-border bg-graphite px-3 py-1.5 text-[10px] font-bold text-foreground/70 transition-colors group-hover:border-lime/20"
                >
                  {application}
                </span>
              ))}
              {remainingApplications > 0 && (
                <span className="rounded-full border border-purple-medium/25 bg-purple-medium/10 px-3 py-1.5 text-[10px] font-black text-purple-medium">
                  +{remainingApplications}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-3 pt-5">
          <button
            onClick={handleAddToCart}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-xs font-black tracking-wider transition-all duration-300 ${
              added
                ? "bg-purple-medium text-white shadow-[0_0_22px_rgba(91,45,130,0.35)]"
                : "bg-lime text-background hover:shadow-[0_0_24px_rgba(239,255,13,0.25)]"
            }`}
            aria-label={`Adicionar ${product.displayName} ao carrinho`}
          >
            {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {added ? "ADICIONADO" : "ADICIONAR AO PEDIDO"}
          </button>
        </div>
      </div>
    </article>
  )
}
