"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Check, Gift, Package, Plus } from "lucide-react"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"
import { formatMoneyFromCents } from "@/lib/money"

type ComboCardProps = {
  combo: {
    id: string
    name: string
    description: string | null
    image: string | null
    priceInCents: number
    items: { id: string; quantity: number; product: { name: string; image: string | null } }[]
  }
}

export function MarketplaceComboCard({ combo }: ComboCardProps) {
  const add = useMarketplaceCart((state) => state.add)
  const [added, setAdded] = useState(false)
  const images = useMemo(
    () =>
      combo.items
        .map((item) => ({ src: item.product.image, alt: item.product.name }))
        .filter((image): image is { src: string; alt: string } => Boolean(image.src)),
    [combo.items]
  )
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % images.length)
    }, 2600)
    return () => window.clearInterval(interval)
  }, [images.length])

  const activeImage = images[activeImageIndex]
  const detailHref = `/marketplace/combos/${combo.id}`

  function handleAdd() {
    add({
      id: combo.id,
      type: "COMBO",
      name: combo.name,
      image: activeImage?.src ?? null,
      unit: "COMBO",
      packageLabel: `${combo.items.length} produtos`,
      unitPriceInCents: combo.priceInCents,
      minimumQuantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1000)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 hover:-translate-y-1.5 hover:border-lime/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35),0_0_28px_rgba(239,255,13,0.08)]">
      <div className="pointer-events-none absolute inset-x-10 top-0 z-20 h-px bg-gradient-to-r from-transparent via-lime/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Link
        href={detailHref}
        className="relative -mb-px block h-80 overflow-hidden bg-background sm:h-96"
        aria-label={`Ver combo ${combo.name}`}
      >
        {activeImage ? (
          <>
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1535px) 50vw, 33vw"
              className="scale-[1.015] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.075]"
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-1.5">
                {images.map((image, index) => (
                  <span
                    key={`${image.src}-${index}`}
                    className={`h-1.5 rounded-full transition-all ${index === activeImageIndex ? "w-5 bg-lime" : "w-1.5 bg-foreground/40"}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gift className="h-16 w-16 text-purple-medium" />
          </div>
        )}
        <div className="absolute -inset-px bg-gradient-to-t from-background via-background/10 to-background/10" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-lime/25 bg-background/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-lime backdrop-blur-md">
            {combo.items.length} produtos
          </span>
        </div>
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
          <div className="rounded-xl border border-white/10 bg-background/85 px-4 py-3 backdrop-blur-md">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Preço do combo</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-lime">
              {formatMoneyFromCents(combo.priceInCents)}
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-background/85 text-foreground backdrop-blur-md transition-all group-hover:border-lime/40 group-hover:bg-lime group-hover:text-background">
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </Link>

      <div className="relative z-10 flex flex-1 flex-col bg-background p-5 md:p-6">
        <Link href={detailHref} className="block">
          <h3 className="mt-3 line-clamp-2 text-xl font-black uppercase leading-[1.1] tracking-[-0.025em] text-foreground transition-colors group-hover:text-lime md:text-2xl">
            {combo.name}
          </h3>
        </Link>
        {combo.description && (
          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-muted-foreground">{combo.description}</p>
        )}

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-graphite px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-medium/25 bg-purple-medium/10">
            <Package className="h-4 w-4 text-purple-medium" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">Composição</p>
            <p className="mt-0.5 truncate text-xs font-bold text-foreground">
              {combo.items.length} produtos selecionados
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2 text-sm text-foreground/75">
          {combo.items.slice(0, 3).map((item) => (
            <li key={item.id} className="line-clamp-1">
              {item.quantity}x {item.product.name}
            </li>
          ))}
          {combo.items.length > 3 && (
            <li className="text-[10px] font-black uppercase text-purple-medium">+{combo.items.length - 3} itens</li>
          )}
        </ul>

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-3 pt-5">
          <button
            onClick={handleAdd}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-xs font-black tracking-wider transition-all duration-300 ${added ? "bg-purple-medium text-white" : "bg-lime text-background hover:shadow-[0_0_24px_rgba(239,255,13,0.25)]"}`}
            aria-label={`Adicionar combo ${combo.name} ao pedido`}
          >
            {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {added ? "ADICIONADO" : "ADICIONAR AO PEDIDO"}
          </button>
        </div>
      </div>
    </article>
  )
}
