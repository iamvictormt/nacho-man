"use client"

import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"
import { PageHeader } from "@/components/page-header"
import { ArrowRight, ShoppingCart, Check, ShoppingBag, ChevronDown } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useCartStore } from "@/lib/cart-store"

type Product = {
  name: string
  slug: string
  category: string
  type: string
  description: string
  image: string
  price: number
  sizes: string[]
  tag: string | null
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const allProducts: Product[] = [
  // Congelados
  { name: "Carne Barbacoa 1,5kg", slug: "carne-barbacoa-1-5kg", category: "congelados", type: "PROTEÍNA PRONTA", description: "Carne desfiada temperada lentamente no estilo mexicano.", image: "/carne.webp", price: 71.0, sizes: ["1,5kg", "5kg", "10kg"], tag: null },
  { name: "Costelinha Desfiada 1,5kg", slug: "costelinha-desfiada-1-5kg", category: "congelados", type: "PROTEÍNA PRONTA", description: "Costelinha suína desfiada e extremamente suculenta.", image: "/costelinha.webp", price: 57.0, sizes: ["1,5kg", "5kg"], tag: null },
  { name: "Frango Desfiado ao Molho 1,5kg", slug: "frango-desfiado-ao-molho-1-5kg", category: "congelados", type: "PROTEÍNA PRONTA", description: "Frango desfiado macio ao molho de tomate e mostarda.", image: "/carne-embalada.webp", price: 59.0, sizes: ["1,5kg", "5kg"], tag: null },
  { name: "Frango Empanado Hot c/10", slug: "frango-empanado-hot-c-10", category: "congelados", type: "EMPANADO", description: "Frango empanado crocante e picante. Perfeito para porções e wraps.", image: "/produtos-congelados.webp", price: 44.0, sizes: ["Cx 10un", "Cx 50un"], tag: null },
  { name: "Carne Chili Beans 1,5kg", slug: "carne-chili-beans-1-5kg", category: "congelados", type: "PROTEÍNA PRONTA", description: "Mistura de carne com feijão e temperos mexicanos.", image: "/carne.webp", price: 49.0, sizes: ["1,5kg", "5kg"], tag: null },
  { name: "Frijoles Refritos 1kg", slug: "frijoles-refritos-1kg", category: "congelados", type: "ACOMPANHAMENTO", description: "Feijão refrito mexicano cremoso e pronto para uso.", image: "/produtos-congelados.webp", price: 14.0, sizes: ["1kg", "5kg"], tag: null },
  { name: "Chili Veg 1kg", slug: "chili-veg-1kg", category: "congelados", type: "VEGETARIANO", description: "Versão vegetariana do chili com proteína de soja e milho.", image: "/embalagens.webp", price: 22.0, sizes: ["1kg", "5kg"], tag: null },
  { name: "Churros Palito 1kg", slug: "churros-palito-1kg", category: "congelados", type: "SOBREMESA", description: "Churros em formato palito para fritura rápida.", image: "/embalagens-2.webp", price: 12.0, sizes: ["1kg", "5kg"], tag: null },
  // Molhos
  { name: "Salsa Jalapeño 200ml", slug: "salsa-jalapeno-200ml", category: "molhos", type: "MOLHO", description: "Sabor intenso e levemente defumado. Versátil para diversas aplicações.", image: "/molhos.webp", price: 12.0, sizes: ["200ml", "1L", "2L"], tag: "BEST SELLER" },
  { name: "Salsa Ghost Pepper 200ml", slug: "salsa-ghost-pepper-200ml", category: "molhos", type: "MOLHO", description: "Extremamente picante. Produzido com pimenta Ghost Pepper.", image: "/molhos.webp", price: 16.5, sizes: ["200ml"], tag: "🔥 EXTREME" },
  { name: "Salsa Sweet Chili 200ml", slug: "salsa-sweet-chili-200ml", category: "molhos", type: "MOLHO", description: "Agridoce levemente picante. Versátil para food service.", image: "/molhos.webp", price: 7.0, sizes: ["200ml", "2L"], tag: null },
  { name: "Salsa Verde 300ml", slug: "salsa-verde-300ml", category: "molhos", type: "MOLHO", description: "Molho verde mexicano refrescante e levemente ácido.", image: "/molhos.webp", price: 14.9, sizes: ["300ml", "600ml"], tag: null },
  { name: "Salsa Negra 200ml", slug: "salsa-negra-200ml", category: "molhos", type: "MOLHO", description: "Perfil defumado e sabor intenso. Diferencial para o cardápio.", image: "/molhos.webp", price: 12.0, sizes: ["200ml"], tag: null },
  { name: "Salsa Hot Pickles 200ml", slug: "salsa-hot-pickles-200ml", category: "molhos", type: "MOLHO", description: "Agridoce e picante com sabor marcante de picles.", image: "/molhos.webp", price: 12.0, sizes: ["200ml", "1L"], tag: null },
  { name: "Salsa Habanero Piña 200ml", slug: "salsa-habanero-pina-200ml", category: "molhos", type: "MOLHO", description: "Combinação tropical de abacaxi com pimenta habanero.", image: "/molhos.webp", price: 9.0, sizes: ["200ml"], tag: null },
  { name: "Salsa Roja 1L", slug: "salsa-roja-1l", category: "molhos", type: "MOLHO", description: "Molho vermelho tradicional mexicano.", image: "/molhos.webp", price: 32.0, sizes: ["1L"], tag: "FOOD SERVICE" },
  { name: "Chamoy 500g", slug: "chamoy-500g", category: "molhos", type: "MOLHO", description: "Molho mexicano agridoce com toque picante. Ideal para drinks.", image: "/molhos.webp", price: 21.0, sizes: ["500g"], tag: "NOVIDADE" },
  { name: "Kit Base Chipotle", slug: "kit-base-chipotle", category: "molhos", type: "KIT", description: "Kit para produção de maionese chipotle. Rendimento 2L.", image: "/molhos.webp", price: 19.0, sizes: ["1 un"], tag: "RENDE 2L" },
  { name: "Kit Base Bacon Mayo", slug: "kit-base-bacon-mayo", category: "molhos", type: "KIT", description: "Kit para produção de maionese de bacon. Rendimento 2L.", image: "/molhos.webp", price: 25.0, sizes: ["1 un"], tag: "RENDE 2L" },
]

const categories = [
  { id: "todos", label: "TODOS" },
  { id: "congelados", label: "CONGELADOS" },
  { id: "molhos", label: "MOLHOS & SALSAS" },
]

export default function ProdutosPage() {
  const [activeFilter, setActiveFilter] = useState("todos")
  const [sortBy, setSortBy] = useState("az")

  const filtered = activeFilter === "todos"
    ? allProducts
    : allProducts.filter((p) => p.category === activeFilter)

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-asc": return a.price - b.price
      case "price-desc": return b.price - a.price
      case "az": return a.name.localeCompare(b.name)
      default: return 0
    }
  })

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      <PageHeader
        label="Catálogo Completo"
        title="NOSSOS PRODUTOS"
        description="Congelados, molhos e salsas prontos para o seu food service. Filtre por categoria e encontre o que precisa."
        icon={ShoppingBag}
      />

      {/* Filters */}
      <section className="sticky top-[88px] z-40 bg-background/95 backdrop-blur-md border-b border-border py-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`shrink-0 px-5 py-2 rounded-full text-[11px] font-black tracking-wider transition-all duration-300 ${
                  activeFilter === cat.id
                    ? "bg-lime text-background shadow-[0_0_15px_rgba(230,230,59,0.3)]"
                    : "bg-graphite border border-border text-muted-foreground hover:border-lime/40 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Product count */}
            <span className="ml-auto shrink-0 text-[10px] font-bold text-muted-foreground tracking-wider">
              {sorted.length} {sorted.length === 1 ? "PRODUTO" : "PRODUTOS"}
            </span>

            {/* Sort */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-graphite border border-border text-[10px] font-bold text-muted-foreground tracking-wider pl-4 pr-8 py-2 rounded-full appearance-none cursor-pointer hover:border-lime/40 transition-colors focus:outline-none focus:border-lime/50"
              >
                <option value="az">A-Z</option>
                <option value="price-asc">MENOR PREÇO</option>
                <option value="price-desc">MAIOR PREÇO</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map((product, i) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-graphite border-t border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-[20%] h-40 w-40 rounded-full bg-purple-medium/15 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            PRECISA DE UM PRODUTO <span className="text-purple-medium neon-glow-purple">PERSONALIZADO?</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">Desenvolvemos produtos e receitas sob medida para a sua operação.</p>
          <Link href="/contato" className="group inline-flex items-center gap-3 bg-lime text-background px-8 py-4 rounded-full font-black text-sm tracking-wider hover:shadow-[0_0_30px_rgba(200,255,0,0.3)] transition-all duration-300">
            FALE COM O COMERCIAL <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}

function ProductCard({ product }: { product: Product }) {
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
    <div className="group rounded-2xl overflow-hidden border border-border bg-graphite hover:border-lime/30 hover:shadow-[0_0_20px_rgba(200,255,0,0.06)] transition-all duration-500">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative h-44 sm:h-82 overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent" />
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <Link href={`/produto/${product.slug}`}>
          <h3 className="text-xs sm:text-sm font-black text-foreground leading-tight group-hover:text-lime transition-colors">{product.name}</h3>
        </Link>
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed hidden sm:block">{product.description}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {product.sizes.map((size, j) => (
            <span key={j} className="text-[8px] font-bold text-lime/60 bg-lime/5 border border-lime/15 px-2 py-0.5 rounded-full">{size}</span>
          ))}
        </div>
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
