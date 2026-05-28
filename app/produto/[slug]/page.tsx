"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Truck, Snowflake, Shield } from "lucide-react"
import { getProductBySlug, allProducts } from "@/lib/products"
import { useCartStore } from "@/lib/cart-store"
import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string
  const product = getProductBySlug(slug)
  const [quantity, setQuantity] = useState(1)
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-2xl font-black text-foreground">Produto não encontrado</h1>
          <a href="/shop" className="text-lime text-sm font-bold mt-4 inline-block hover:underline">
            ← Voltar ao catálogo
          </a>
        </div>
        <SiteFooter />
        <CartDrawerWrapper />
      </main>
    )
  }

  const formattedPrice = product.price.toFixed(2).replace(".", ",")
  const totalPrice = (product.price * quantity).toFixed(2).replace(".", ",")

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) {
      addItem({ name: product!.name, price: product!.price, image: product!.image })
    }
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 2000)
  }

  // Related products
  const related = allProducts
    .filter((p) => p.subcategory === product.subcategory && p.slug !== product.slug)
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <a href="/" className="hover:text-lime transition-colors">Home</a>
          <span>/</span>
          <a href="/shop" className="hover:text-lime transition-colors">Shop</a>
          <span>/</span>
          <span className="text-foreground font-semibold">{product.name}</span>
        </div>
      </div>

      {/* Product section */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Image */}
            <div className="relative">
              <div className="sticky top-24 aspect-square rounded-3xl bg-graphite border border-border/30 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-dark/10 via-transparent to-lime/5" />
                {product.tag && (
                  <span className={`absolute top-5 left-5 z-10 text-[9px] font-black tracking-wider px-3 py-1 rounded-full ${product.tagColor}`}>
                    {product.tag}
                  </span>
                )}
                <button
                  onClick={() => setLiked(!liked)}
                  className="absolute top-5 right-5 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-lime transition-all"
                  aria-label="Favoritar"
                >
                  <Heart className={`h-5 w-5 ${liked ? "fill-lime text-lime" : ""}`} />
                </button>
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-3/4 w-3/4 object-contain relative z-10"
                />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6 lg:py-4">
              <div>
                <span className="text-[10px] font-black tracking-[0.3em] text-lime">
                  {product.subcategory.toUpperCase()}
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mt-2">
                  {product.name}
                </h1>
              </div>

              <p className="text-muted-foreground text-base leading-relaxed">
                {product.description}
              </p>

              {/* Details */}
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-full bg-graphite border border-border/30 text-xs font-bold text-foreground/80">
                  {product.category}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-graphite border border-border/30 text-xs font-bold text-foreground/80">
                  {product.weight}
                </span>
              </div>

              {/* Price */}
              <div className="space-y-1 pt-2">
                <p className="text-4xl font-black text-lime">R$ {formattedPrice}</p>
                <p className="text-sm text-muted-foreground">
                  ou 3x de R$ {(product.price / 3).toFixed(2).replace(".", ",")} sem juros
                </p>
                <p className="text-xs text-lime/80 font-semibold">
                  R$ {(product.price * 0.9).toFixed(2).replace(".", ",")} no PIX (10% off)
                </p>
              </div>

              {/* Quantity + Add to cart */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {/* Quantity */}
                <div className="flex items-center gap-1 bg-graphite border border-border/30 rounded-full px-2 py-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-foreground/70 hover:text-lime transition-colors"
                    aria-label="Diminuir"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-black text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-foreground/70 hover:text-lime transition-colors"
                    aria-label="Aumentar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to cart button */}
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-full font-black text-sm tracking-wider transition-all duration-300 ${
                    added
                      ? "bg-green-500 text-white scale-[1.02]"
                      : "bg-lime text-background hover:scale-[1.02]"
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {added ? "ADICIONADO ✓" : `ADICIONAR — R$ ${totalPrice}`}
                </button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/20">
                <div className="flex items-center gap-3">
                  <Snowflake className="h-5 w-5 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-foreground">GELO SECO</p>
                    <p className="text-[9px] text-muted-foreground">Envio refrigerado</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-foreground">ENVIO 24H</p>
                    <p className="text-[9px] text-muted-foreground">Pedidos até 14h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-foreground">GARANTIA</p>
                    <p className="text-[9px] text-muted-foreground">Satisfação total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-black text-foreground tracking-tight mb-8">
                VOCÊ TAMBÉM VAI CURTIR
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map((p) => (
                  <a
                    key={p.slug}
                    href={`/produto/${p.slug}`}
                    className="group bg-graphite rounded-2xl border border-border/30 overflow-hidden hover:border-lime/30 transition-all duration-300"
                  >
                    <div className="aspect-square bg-gradient-to-br from-purple-dark/10 to-lime/5 p-6 flex items-center justify-center">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                      <p className="text-lg font-black text-lime mt-1">
                        R$ {p.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}
