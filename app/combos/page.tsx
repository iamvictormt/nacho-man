"use client"

import { useState } from "react"
import Image from "next/image"
import { ShoppingCart, Check, Package, Flame } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { allCombos, getComboOriginalPrice, calculateSavings, getComboProducts } from "@/lib/combos"
import { formatPrice } from "@/lib/format"
import { useCartStore } from "@/lib/cart-store"

export default function CombosPage() {
  const [addedCombo, setAddedCombo] = useState<string | null>(null)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAddCombo(combo: typeof allCombos[number]) {
    if (!combo.inStock) return
    addItem({ name: combo.name, price: combo.promoPrice, image: combo.image })
    setAddedCombo(combo.slug)
    openCart()
    setTimeout(() => setAddedCombo(null), 1000)
  }

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        label="Promoções"
        title="COMBOS"
        description="Aproveite nossos combos especiais com preços promocionais e economize na sua compra."
        icon={Flame}
      />

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          {allCombos.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                Não há combos disponíveis no momento
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allCombos.map((combo) => {
                const originalPrice = getComboOriginalPrice(combo)
                const savings = calculateSavings(originalPrice, combo.promoPrice)
                const comboProducts = getComboProducts(combo)
                const isAdded = addedCombo === combo.slug

                return (
                  <div
                    key={combo.slug}
                    className={`rounded-2xl border overflow-hidden transition-all duration-500 ${
                      combo.inStock
                        ? "border-border bg-graphite hover:border-lime/40 hover:shadow-[0_0_20px_rgba(230,230,59,0.1)]"
                        : "border-border/50 bg-graphite/60 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0">
                        <Image
                          src={combo.image}
                          alt={combo.name}
                          fill
                          sizes="(max-width: 639px) 100vw, 192px"
                          loading="lazy"
                          className="object-cover"
                        />
                        {combo.inStock && savings.percentage > 0 && (
                          <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-purple-medium text-white text-xs font-bold">
                            -{savings.percentage}%
                          </span>
                        )}
                        {!combo.inStock && (
                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Indisponível
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h3 className="text-base font-black text-foreground tracking-tight">
                            {combo.name}
                          </h3>

                          {/* Items list */}
                          <ul className="space-y-1">
                            {comboProducts.map(({ product, quantity }) => (
                              <li
                                key={product.slug}
                                className="text-xs text-muted-foreground flex items-center gap-2"
                              >
                                <span className="h-1 w-1 rounded-full bg-lime/60 shrink-0" />
                                <span>
                                  {quantity}x {product.name}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {/* Pricing */}
                          <div className="space-y-1 pt-2">
                            <div className="flex items-baseline gap-3">
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(originalPrice)}
                              </span>
                              <span className="text-xl font-black text-lime">
                                {formatPrice(combo.promoPrice)}
                              </span>
                            </div>
                            {savings.absolute > 0 && (
                              <p className="text-xs text-purple-medium font-bold">
                                Economia de {formatPrice(savings.absolute)} ({savings.percentage}%)
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Add to cart button */}
                        <div className="mt-4">
                          <button
                            onClick={() => handleAddCombo(combo)}
                            disabled={!combo.inStock}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 ${
                              !combo.inStock
                                ? "bg-border text-muted-foreground cursor-not-allowed"
                                : isAdded
                                ? "bg-purple-medium text-white shadow-[0_0_20px_rgba(91,45,130,0.5)] scale-[1.02]"
                                : "bg-lime text-background hover:shadow-[0_0_20px_rgba(230,230,59,0.3)] hover:scale-[1.02]"
                            }`}
                            aria-label={
                              combo.inStock
                                ? `Adicionar ${combo.name} ao carrinho`
                                : `${combo.name} indisponível`
                            }
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-4 w-4" />
                                ADICIONADO
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4" />
                                {combo.inStock ? "ADICIONAR AO CARRINHO" : "INDISPONÍVEL"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
