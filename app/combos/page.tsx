"use client"

import { useState } from "react"
import { ShoppingCart, ArrowRight } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"

const combos = [
  {
    name: "COMBO TACO NIGHT",
    description: "Tudo pra montar uma noite de tacos épica em casa.",
    items: [
      { name: "Carne Barbacoa 1,5kg", price: 71.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Frijoles Refritos 1kg", price: 14.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Salsa Jalapeño 200ml", price: 12.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Salsa Verde 300ml", price: 14.9, image: "/placeholder.svg?height=100&width=100" },
    ],
    originalPrice: 111.9,
    comboPrice: 99.90,
    tag: "MAIS PEDIDO",
  },
  {
    name: "COMBO CHURRASCO MEX",
    description: "Carnes premium pra um churrasco com sabor mexicano.",
    items: [
      { name: "Carne Barbacoa 1,5kg", price: 71.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Carne Costelinha 1,5kg", price: 57.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Carne Chili Beans 1,5kg", price: 49.0, image: "/placeholder.svg?height=100&width=100" },
    ],
    originalPrice: 177.0,
    comboPrice: 159.90,
    tag: "ECONÔMICO",
  },
  {
    name: "COMBO MOLHOS COLLECTION",
    description: "Coleção completa de salsas pra ter sempre à mão.",
    items: [
      { name: "Salsa Jalapeño 200ml", price: 12.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Salsa Ghost Pepper 200ml", price: 16.5, image: "/placeholder.svg?height=100&width=100" },
      { name: "Salsa Negra 200ml", price: 12.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Salsa Hot Pickles 200ml", price: 12.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Salsa Habanero Piña 200ml", price: 9.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Salsa Sweet Chili 200ml", price: 7.0, image: "/placeholder.svg?height=100&width=100" },
    ],
    originalPrice: 68.5,
    comboPrice: 59.90,
    tag: "6 SALSAS",
  },
  {
    name: "COMBO FOOD SERVICE STARTER",
    description: "Kit inicial para operações food service.",
    items: [
      { name: "Salsa Jalapeño 2L", price: 74.9, image: "/placeholder.svg?height=100&width=100" },
      { name: "Salsa Sweet Chili 2L", price: 39.5, image: "/placeholder.svg?height=100&width=100" },
      { name: "Kit Base Molho Chipotle (1UN)", price: 19.0, image: "/placeholder.svg?height=100&width=100" },
      { name: "Kit Base Bacon Mayo (1UN)", price: 25.0, image: "/placeholder.svg?height=100&width=100" },
    ],
    originalPrice: 158.4,
    comboPrice: 139.90,
    tag: "PROFISSIONAL",
  },
]

export default function CombosPage() {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Header */}
      <section className="py-16 bg-graphite border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4">
          <span className="text-[10px] font-black tracking-[0.3em] text-lime">ECONOMIZE</span>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mt-2">
            COMBOS
          </h1>
          <p className="text-muted-foreground mt-3 max-w-lg">
            Combinações selecionadas com desconto. Monte sua experiência mexicana completa.
          </p>
        </div>
      </section>

      {/* Combos */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 space-y-8">
          {combos.map((combo, i) => (
            <ComboCard key={i} combo={combo} />
          ))}
        </div>
      </section>

      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}

function ComboCard({ combo }: { combo: typeof combos[0] }) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAddCombo() {
    combo.items.forEach((item) => {
      addItem({ name: item.name, price: item.price, image: item.image })
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 2000)
  }

  const discount = Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100)

  return (
    <div className="bg-graphite rounded-2xl border border-border/30 overflow-hidden hover:border-lime/20 transition-all duration-300">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Info */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black tracking-wider px-3 py-1 rounded-full bg-lime text-background">
                {combo.tag}
              </span>
              <span className="text-[9px] font-black tracking-wider px-3 py-1 rounded-full bg-purple-medium text-white">
                -{discount}% OFF
              </span>
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {combo.name}
            </h3>
            <p className="text-sm text-muted-foreground">{combo.description}</p>

            {/* Items list */}
            <div className="space-y-2 pt-2">
              {combo.items.map((item, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                    <img src={item.image} alt="" className="h-6 w-6 object-contain" />
                  </div>
                  <span className="text-xs text-foreground/80 font-medium">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    R$ {item.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex flex-col items-end gap-4 shrink-0">
            <div className="text-right">
              <p className="text-sm text-muted-foreground line-through">
                R$ {combo.originalPrice.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-3xl font-black text-lime">
                R$ {combo.comboPrice.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ou 3x de R$ {(combo.comboPrice / 3).toFixed(2).replace(".", ",")}
              </p>
            </div>
            <button
              onClick={handleAddCombo}
              className={`flex items-center gap-3 px-6 py-3 rounded-full font-black text-sm tracking-wider transition-all duration-300 ${
                added
                  ? "bg-green-500 text-white scale-105"
                  : "bg-lime text-background hover:scale-105"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              {added ? "ADICIONADO ✓" : "QUERO ESSE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
