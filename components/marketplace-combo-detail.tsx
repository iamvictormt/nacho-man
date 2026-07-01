"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Check, Gift, Minus, Package, Plus, SlidersHorizontal } from "lucide-react"
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
  totalUnits: number
  options: {
    id: string
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
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})
  const [added, setAdded] = useState(false)
  const add = useMarketplaceCart((state) => state.add)
  const setCartQuantity = useMarketplaceCart((state) => state.setQuantity)
  const items = useMarketplaceCart((state) => state.items)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const images = useMemo(
    () =>
      combo.options
        .map((option) => ({ src: option.product.image, alt: option.product.name }))
        .filter((image): image is { src: string; alt: string } => Boolean(image.src)),
    [combo.options]
  )
  const heroImage = images[activeImageIndex]
  const selectedTotal = Object.values(selectedQuantities).reduce((total, current) => total + current, 0)
  const remaining = combo.totalUnits - selectedTotal
  const selectedOptions = combo.options
    .map((option) => ({
      productId: option.product.id,
      name: option.product.name,
      quantity: selectedQuantities[option.product.id] ?? 0,
    }))
    .filter((option) => option.quantity > 0)
  const selectionKey = selectedOptions.map((option) => `${option.productId}:${option.quantity}`).join("|")
  const canAdd = selectedTotal === combo.totalUnits && selectedOptions.length > 0

  useEffect(() => {
    if (images.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % images.length)
    }, 2600)

    return () => window.clearInterval(interval)
  }, [images.length])

  function changeOptionQuantity(productId: string, nextQuantity: number) {
    setSelectedQuantities((current) => {
      const currentValue = current[productId] ?? 0
      const selectedWithoutCurrent = selectedTotal - currentValue
      const clamped = Math.max(0, Math.min(combo.totalUnits - selectedWithoutCurrent, nextQuantity))

      return { ...current, [productId]: clamped }
    })
  }

  function handleAdd() {
    if (!canAdd) return

    const packageLabel = selectedOptions.map((option) => `${option.quantity}x ${option.name}`).join(" | ")
    const existing = items.find(
      (item) => item.id === combo.id && item.type === "COMBO" && item.selectionKey === selectionKey
    )

    if (existing) {
      setCartQuantity(combo.id, "COMBO", existing.quantity + quantity, selectionKey)
    } else {
      add({
        id: combo.id,
        type: "COMBO",
        selectionKey,
        name: combo.name,
        image: heroImage?.src ?? null,
        unit: "COMBO",
        packageLabel,
        unitPriceInCents: combo.priceInCents,
        minimumQuantity: 1,
        selectedOptions,
      })
      if (quantity !== 1) setCartQuantity(combo.id, "COMBO", quantity, selectionKey)
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
          <div className="relative aspect-[4/5] max-h-[calc(100vh-9rem)] overflow-hidden rounded-lg border border-border/90 bg-white lg:sticky lg:top-36">
            {heroImage ? (
              <Image
                key={heroImage.src}
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="animate-in fade-in object-contain p-4 duration-500"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Gift className="h-20 w-20 text-purple-medium" />
              </div>
            )}
            <div className="absolute inset-[-1px] bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
              <span className="rounded-full border border-lime/25 bg-background/78 px-3 py-1 text-lime backdrop-blur">
                {combo.totalUnits} unidades
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
                Combo montável
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
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">Montagem</span>
                <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">
                  Escolha {combo.totalUnits} unidades entre {combo.options.length} opções
                </p>
                <p className="mt-1 text-xs font-bold text-purple-medium">Pedido mínimo: 1 combo</p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-purple-medium">
                Escolha os sabores
              </p>
              <div className="mb-4 overflow-hidden rounded-xl border border-border bg-graphite">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime">
                    <SlidersHorizontal className="h-4 w-4" />
                    {selectedTotal} de {combo.totalUnits}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase ${
                      remaining === 0 ? "text-lime" : "text-muted-foreground"
                    }`}
                  >
                    {remaining === 0 ? "Combo completo" : `Faltam ${remaining}`}
                  </span>
                </div>
                <div className="h-1.5 bg-background">
                  <div
                    className="h-full bg-lime transition-all"
                    style={{ width: `${Math.min(100, (selectedTotal / combo.totalUnits) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                {combo.options.map((option) => {
                  const optionQuantity = selectedQuantities[option.product.id] ?? 0

                  return (
                    <div
                      key={option.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-graphite p-3 transition hover:border-lime/30"
                    >
                      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                        {option.product.image ? (
                          <Image src={option.product.image} alt={option.product.name} fill className="object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-purple-medium" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/marketplace/produto/${option.product.id}`}
                          className="block truncate text-sm font-black uppercase transition hover:text-lime"
                        >
                          {option.product.name}
                        </Link>
                        <span className="mt-1 block truncate text-[10px] font-bold text-muted-foreground">
                          {option.product.packageLabel}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
                        <button
                          type="button"
                          onClick={() => changeOptionQuantity(option.product.id, optionQuantity - 1)}
                          disabled={optionQuantity <= 0}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/10 disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-black">{optionQuantity}</span>
                        <button
                          type="button"
                          onClick={() => changeOptionQuantity(option.product.id, optionQuantity + 1)}
                          disabled={selectedTotal >= combo.totalUnits}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/10 disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                  )
                })}
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
                disabled={!canAdd}
                className={`flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full px-6 py-4 text-xs font-black tracking-wider transition sm:text-sm ${
                  added
                    ? "bg-purple-medium text-white"
                    : canAdd
                      ? "bg-lime text-background hover:shadow-[0_0_30px_rgba(239,255,13,0.4)]"
                      : "cursor-not-allowed border border-border bg-background text-muted-foreground"
                }`}
              >
                {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {added ? "ADICIONADO" : canAdd ? "ADICIONAR AO PEDIDO" : `ESCOLHA ${combo.totalUnits} UNIDADES`}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
