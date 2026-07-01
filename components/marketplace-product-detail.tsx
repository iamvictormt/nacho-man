"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChefHat, Clock3, Minus, Plus, ShieldCheck, Snowflake } from "lucide-react"
import type { CatalogProduct } from "@/lib/products"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"
import { ProductDetailCard } from "@/components/product-detail-card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type MarketplaceCommerce = {
  id: string
  unit: string
  packageLabel: string
  minimumQuantity: number
}

type RelatedMarketplaceProduct = {
  product: CatalogProduct
  commerce: MarketplaceCommerce
}

export function MarketplaceProductDetail({
  product,
  commerce,
  relatedProducts,
}: {
  product: CatalogProduct
  commerce: MarketplaceCommerce
  relatedProducts: RelatedMarketplaceProduct[]
}) {
  const [quantity, setQuantity] = useState(commerce.minimumQuantity)
  const [added, setAdded] = useState(false)
  const add = useMarketplaceCart((state) => state.add)
  const setCartQuantity = useMarketplaceCart((state) => state.setQuantity)
  const items = useMarketplaceCart((state) => state.items)
  const visibleFeatures = product.features.map((feature) => feature.trim()).filter(Boolean)

  const careInfo =
    product.category === "CONGELADO"
      ? [
          { icon: Snowflake, title: "Conservação", text: "Mantenha congelado a -18°C até o preparo." },
          { icon: ChefHat, title: "Preparo", text: "Aqueça ou finalize conforme sua operação." },
          { icon: Clock3, title: "Praticidade", text: "Reduz tempo de cozinha e padroniza os pedidos." },
        ]
      : [
          { icon: ShieldCheck, title: "Armazenamento", text: "Guarde em local seco, fresco e protegido da luz." },
          { icon: ChefHat, title: "Uso", text: "Produto pronto para aplicação na operação." },
          { icon: Clock3, title: "Rendimento", text: "Ideal para reposição rápida e uso recorrente." },
        ]

  function handleAdd() {
    const existing = items.find((item) => item.id === commerce.id && item.type === "PRODUCT")

    if (existing) {
      setCartQuantity(commerce.id, "PRODUCT", existing.quantity + quantity)
    } else {
      add({
        id: commerce.id,
        type: "PRODUCT",
        name: product.displayName,
        image: product.image,
        unit: commerce.unit,
        packageLabel: commerce.packageLabel,
        unitPriceInCents: Math.round(product.price * 100),
        minimumQuantity: commerce.minimumQuantity,
      })
      if (quantity !== commerce.minimumQuantity) {
        setCartQuantity(commerce.id, "PRODUCT", quantity)
      }
    }

    setAdded(true)
    setTimeout(() => setAdded(false), 1000)
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/marketplace">Nacho Factory</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/marketplace/produtos">Produtos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="relative aspect-[4/5] max-h-[calc(100vh-9rem)] overflow-hidden rounded-lg border border-border/90 bg-white lg:sticky lg:top-36">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-contain p-4"
              />
              <div className="absolute inset-[-1px] bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
                <span className="rounded-full border border-lime/25 bg-background/78 px-3 py-1 text-lime backdrop-blur">
                  {product.subcategory}
                </span>
                <span className="rounded-full border border-border bg-background/78 px-3 py-1 text-muted-foreground backdrop-blur">
                  Exclusivo franqueados
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-lime/25 bg-lime/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-lime">
                  {product.category}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-medium">
                  {product.subcategory}
                </span>
              </div>

              <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
                {product.displayName}
              </h1>
              {product.subtitle && <p className="text-sm font-bold text-lime">{product.subtitle}</p>}
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{product.description}</p>

              <div className="grid grid-cols-1 gap-6 border-t border-border/70 py-5 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
                    Características
                  </p>
                  <ul className="space-y-2">
                    {visibleFeatures.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
                    Aplicações
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.applications.map((application) => (
                      <span
                        key={application}
                        className="border border-border bg-graphite px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
                      >
                        {application}
                      </span>
                    ))}
                    {product.applications.length === 0 && (
                      <span className="text-sm text-muted-foreground">Consulte a Factory para recomendações.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[1.1fr_0.9fr] gap-5 border-y border-border/70 py-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
                    Preço exclusivo
                  </span>
                  <p className="mt-2 text-4xl font-black leading-none text-lime">{product.priceLabel}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
                    Embalagem
                  </span>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">{product.weight}</p>
                  {commerce.minimumQuantity > 1 && (
                    <p className="mt-1 text-xs font-bold text-purple-medium">
                      Pedido mínimo: {commerce.minimumQuantity}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 border border-border bg-graphite p-3 sm:flex-row sm:items-center">
                <div className="flex self-start items-center justify-center gap-2 rounded-full border border-border bg-background px-2 py-1">
                  <button
                    onClick={() => setQuantity((current) => Math.max(commerce.minimumQuantity, current - 1))}
                    disabled={quantity <= commerce.minimumQuantity}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/10 disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-black">{quantity}</span>
                  <button
                    onClick={() => setQuantity((current) => Math.min(999, current + 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className={`flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full px-6 py-4 text-xs font-black tracking-wider transition sm:text-sm ${
                    added
                      ? "bg-purple-medium text-white"
                      : "bg-lime text-background hover:shadow-[0_0_30px_rgba(239,255,13,0.4)]"
                  }`}
                >
                  {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {added ? "ADICIONADO" : "ADICIONAR AO CARRINHO"}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-border/50 pt-6 sm:grid-cols-3">
                {careInfo.map((item) => (
                  <div key={item.title} className="rounded-lg border border-border bg-graphite p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-lime/25 bg-lime/10">
                      <item.icon className="h-4 w-4 text-lime" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-wider">{item.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-8 text-xl font-black tracking-tight md:text-2xl">
              PRODUTOS <span className="text-lime">RELACIONADOS</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {relatedProducts.map(({ product: related, commerce: relatedCommerce }) => (
                <ProductDetailCard
                  key={relatedCommerce.id}
                  product={related}
                  commerce={{ context: "marketplace", ...relatedCommerce }}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
