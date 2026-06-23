"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Check, Gift, Minus, Package, Plus } from "lucide-react"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"
import { formatMoneyFromCents } from "@/lib/money"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type ComboDetail = {
  id: string
  name: string
  description: string | null
  priceInCents: number
  items: {
    id: string
    quantity: number
    product: {
      id: string
      name: string
      image: string | null
      packageLabel: string
    }
  }[]
}

export function MarketplaceComboDetail({ combo }: { combo: ComboDetail }) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const add = useMarketplaceCart((state) => state.add)
  const setCartQuantity = useMarketplaceCart((state) => state.setQuantity)
  const items = useMarketplaceCart((state) => state.items)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const images = useMemo(
    () =>
      combo.items
        .map((item) => ({ src: item.product.image, alt: item.product.name }))
        .filter((image): image is { src: string; alt: string } => Boolean(image.src)),
    [combo.items]
  )
  const heroImage = images[activeImageIndex]

  useEffect(() => {
    if (images.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % images.length)
    }, 2600)

    return () => window.clearInterval(interval)
  }, [images.length])

  function handleAdd() {
    const existing = items.find((item) => item.id === combo.id && item.type === "COMBO")

    if (existing) {
      setCartQuantity(combo.id, "COMBO", existing.quantity + quantity)
    } else {
      add({
        id: combo.id,
        type: "COMBO",
        name: combo.name,
        image: heroImage?.src ?? null,
        unit: "COMBO",
        packageLabel: `${combo.items.length} produtos`,
        unitPriceInCents: combo.priceInCents,
        minimumQuantity: 1,
      })
      if (quantity !== 1) setCartQuantity(combo.id, "COMBO", quantity)
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
                <Link href="/marketplace/combos">Combos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{combo.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <section className="py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border/90 bg-graphite lg:sticky lg:top-36">
            {heroImage ? (
              <Image
                key={heroImage.src}
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="animate-in fade-in duration-500 object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Gift className="h-20 w-20 text-purple-medium" />
              </div>
            )}
            <div className="absolute inset-[-1px] bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
              <span className="rounded-full border border-lime/25 bg-background/78 px-3 py-1 text-lime backdrop-blur">
                {combo.items.length} produtos
              </span>
            </div>
            {images.length > 1 && (
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-full border border-white/10 bg-background/80 px-3 py-2 backdrop-blur-md">
                <span className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-foreground">
                  {heroImage.alt}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {images.map((image, index) => (
                    <button
                      key={`${image.src}-${index}`}
                      type="button"
                      className={`h-2 rounded-full transition-all ${
                        index === activeImageIndex ? "w-6 bg-lime" : "w-2 bg-foreground/35 hover:bg-foreground/60"
                      }`}
                      aria-label={`Ver imagem de ${image.alt}`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-lime/25 bg-lime/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-lime">
                Oferta montada
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-medium">
                Nacho Factory
              </span>
            </div>

            <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
              {combo.name}
            </h1>
            {combo.description && (
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{combo.description}</p>
            )}

            <div className="grid grid-cols-[1.1fr_0.9fr] gap-5 border-y border-border/70 py-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
                  Preço do combo
                </span>
                <p className="mt-2 text-4xl font-black leading-none text-lime">
                  {formatMoneyFromCents(combo.priceInCents)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
                  Composição
                </span>
                <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">
                  {combo.items.length} produtos selecionados
                </p>
                <p className="mt-1 text-xs font-bold text-purple-medium">Pedido mínimo: 1 combo</p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
                Itens do combo
              </p>
              <div className="grid gap-3">
                {combo.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/marketplace/produto/${item.product.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-graphite p-3 transition hover:border-lime/30"
                  >
                    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                      {item.product.image ? (
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-purple-medium" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black uppercase">{item.product.name}</span>
                      <span className="mt-1 block truncate text-[10px] font-bold text-muted-foreground">
                        {item.product.packageLabel}
                      </span>
                    </span>
                    <span className="rounded-full border border-lime/25 bg-lime/10 px-3 py-1 text-xs font-black text-lime">
                      {item.quantity}x
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 border border-border bg-graphite p-3 sm:flex-row sm:items-center">
              <div className="flex self-start items-center justify-center gap-2 rounded-full border border-border bg-background px-2 py-1">
                <button
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1}
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
                className={`flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full px-6 py-4 text-xs font-black tracking-wider transition sm:text-sm ${added ? "bg-purple-medium text-white" : "bg-lime text-background hover:shadow-[0_0_30px_rgba(239,255,13,0.4)]"}`}
              >
                {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {added ? "ADICIONADO" : "ADICIONAR AO PEDIDO"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
