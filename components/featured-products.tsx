"use client"

import { ArrowRight, ShoppingCart, Check } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useCartStore } from "@/lib/cart-store"

const products = [
  {
    name: "Carne Bovina Mérida",
    description: "Carne bovina ao molho especial, pronta para servir.",
    image: "/carne.webp",
    sizes: "1,5kg / 5kg / 10kg",
    price: 71.0,
  },
  {
    name: "Frango Empanado Hot",
    description: "Empanado crocante e picante com sabor marcante.",
    image: "/costelinha.webp",
    sizes: "Caixa 10un / 50un",
    price: 44.0,
  },
  {
    name: "Molho Sweet Chili",
    description: "Molho agridoce levemente picante. Versátil.",
    image: "/molhos.webp",
    sizes: "200ml / 1L / 2L",
    price: 7.0,
  },
  {
    name: "Nuggets Empanados",
    description: "Proteína pronta frita ou no forno.",
    image: "/produtos-congelados.webp",
    sizes: "1,5kg / 2,5kg / 5,0kg",
    price: 49.0,
  },
]

export function FeaturedProducts() {
  return (
    <section className="py-16 bg-background">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-[10px] font-bold text-lime tracking-[0.3em] uppercase">Catálogo</span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1">
              NOSSOS PRODUTOS
            </h2>
          </div>
          <Link
            href="/produtos"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-black tracking-wider text-lime hover:gap-3 transition-all"
          >
            VER TODOS <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <ProductCard key={i} product={product} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden flex justify-center mt-8">
          <Link href="/produtos" className="inline-flex items-center gap-2 text-sm font-black text-lime tracking-wider">
            VER CATÁLOGO COMPLETO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: typeof products[0] }) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAdd() {
    addItem({ name: product.name, price: product.price, image: product.image })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="group rounded-2xl overflow-hidden border border-border bg-graphite hover:border-purple-medium/40 hover:shadow-[0_0_25px_rgba(91,45,130,0.12)] transition-all duration-500">
      {/* Image */}
      <div className="relative h-62 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-black text-foreground leading-tight group-hover:text-lime transition-colors">
          {product.name}
        </h3>
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <p className="text-[9px] font-medium text-muted-foreground">{product.sizes}</p>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm font-black text-lime">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          <button
            onClick={handleAdd}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              added ? "bg-purple-medium scale-125 shadow-[0_0_20px_rgba(91,45,130,0.5)] animate-bounce-once" : "bg-lime hover:scale-110"
            } text-background`}
            aria-label="Adicionar ao carrinho"
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
