"use client"

import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"
import { ArrowLeft, ShoppingCart, Check, Minus, Plus } from "lucide-react"
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

const allProducts: Product[] = [
  { name: "Carne Barbacoa 1,5kg", slug: "carne-barbacoa-1-5kg", category: "congelados", type: "PROTEÍNA PRONTA", description: "Carne desfiada temperada lentamente no estilo mexicano. Ideal para tacos, burritos e bowls. Produto congelado pronto para aquecer e servir.", image: "/carne.webp", price: 71.0, sizes: ["1,5kg", "5kg", "10kg"], tag: null },
  { name: "Costelinha Desfiada 1,5kg", slug: "costelinha-desfiada-1-5kg", category: "congelados", type: "PROTEÍNA PRONTA", description: "Costelinha suína desfiada e extremamente suculenta. Temperada com especiarias mexicanas e cozida lentamente.", image: "/costelinha.webp", price: 57.0, sizes: ["1,5kg", "5kg"], tag: null },
  { name: "Frango Desfiado ao Molho 1,5kg", slug: "frango-desfiado-ao-molho-1-5kg", category: "congelados", type: "PROTEÍNA PRONTA", description: "Frango desfiado macio ao molho de tomate e mostarda. Versátil para diversas preparações no food service.", image: "/carne-embalada.webp", price: 59.0, sizes: ["1,5kg", "5kg"], tag: null },
  { name: "Frango Empanado Hot c/10", slug: "frango-empanado-hot-c-10", category: "congelados", type: "EMPANADO", description: "Frango empanado crocante e picante. Perfeito para porções, wraps e sanduíches. Basta fritar ou assar.", image: "/produtos-congelados.webp", price: 44.0, sizes: ["Cx 10un", "Cx 50un"], tag: null },
  { name: "Carne Chili Beans 1,5kg", slug: "carne-chili-beans-1-5kg", category: "congelados", type: "PROTEÍNA PRONTA", description: "Mistura de carne com feijão e temperos mexicanos. Receita autêntica pronta para servir.", image: "/carne.webp", price: 49.0, sizes: ["1,5kg", "5kg"], tag: null },
  { name: "Frijoles Refritos 1kg", slug: "frijoles-refritos-1kg", category: "congelados", type: "ACOMPANHAMENTO", description: "Feijão refrito mexicano cremoso e pronto para uso. Acompanhamento clássico para qualquer prato mexicano.", image: "/produtos-congelados.webp", price: 14.0, sizes: ["1kg", "5kg"], tag: null },
  { name: "Chili Veg 1kg", slug: "chili-veg-1kg", category: "congelados", type: "VEGETARIANO", description: "Versão vegetariana do chili com proteína de soja e milho. Levemente apimentado e muito saboroso.", image: "/embalagens.webp", price: 22.0, sizes: ["1kg", "5kg"], tag: null },
  { name: "Churros Palito 1kg", slug: "churros-palito-1kg", category: "congelados", type: "SOBREMESA", description: "Churros em formato palito para fritura rápida. Crocante por fora, macio por dentro.", image: "/embalagens-2.webp", price: 12.0, sizes: ["1kg", "5kg"], tag: null },
  { name: "Salsa Jalapeño 200ml", slug: "salsa-jalapeno-200ml", category: "molhos", type: "MOLHO", description: "Sabor intenso e levemente defumado. Versátil para diversas aplicações como tacos, nachos, hambúrgueres e porções.", image: "/molhos.webp", price: 12.0, sizes: ["200ml", "1L", "2L"], tag: "BEST SELLER" },
  { name: "Salsa Ghost Pepper 200ml", slug: "salsa-ghost-pepper-200ml", category: "molhos", type: "MOLHO", description: "Extremamente picante. Produzido com pimenta Ghost Pepper autêntica. Para os verdadeiros amantes de pimenta.", image: "/molhos.webp", price: 16.5, sizes: ["200ml"], tag: "🔥 EXTREME" },
  { name: "Salsa Sweet Chili 200ml", slug: "salsa-sweet-chili-200ml", category: "molhos", type: "MOLHO", description: "Agridoce levemente picante. Versátil para food service. Combina com frango, camarão e spring rolls.", image: "/molhos.webp", price: 7.0, sizes: ["200ml", "2L"], tag: null },
  { name: "Salsa Verde 300ml", slug: "salsa-verde-300ml", category: "molhos", type: "MOLHO", description: "Molho verde mexicano refrescante e levemente ácido. Feito com tomatillo e coentro fresco.", image: "/molhos.webp", price: 14.9, sizes: ["300ml", "600ml"], tag: null },
  { name: "Salsa Negra 200ml", slug: "salsa-negra-200ml", category: "molhos", type: "MOLHO", description: "Perfil defumado e sabor intenso. Diferencial para o cardápio. Ideal para carnes grelhadas.", image: "/molhos.webp", price: 12.0, sizes: ["200ml"], tag: null },
  { name: "Salsa Hot Pickles 200ml", slug: "salsa-hot-pickles-200ml", category: "molhos", type: "MOLHO", description: "Agridoce e picante com sabor marcante de picles. Perfeito para hambúrgueres e sanduíches.", image: "/molhos.webp", price: 12.0, sizes: ["200ml", "1L"], tag: null },
  { name: "Salsa Habanero Piña 200ml", slug: "salsa-habanero-pina-200ml", category: "molhos", type: "MOLHO", description: "Combinação tropical de abacaxi com pimenta habanero. Doce, ácido e picante em equilíbrio.", image: "/molhos.webp", price: 9.0, sizes: ["200ml"], tag: null },
  { name: "Salsa Roja 1L", slug: "salsa-roja-1l", category: "molhos", type: "MOLHO", description: "Molho vermelho tradicional mexicano. Versão food service com excelente rendimento.", image: "/molhos.webp", price: 32.0, sizes: ["1L"], tag: "FOOD SERVICE" },
  { name: "Chamoy 500g", slug: "chamoy-500g", category: "molhos", type: "MOLHO", description: "Molho mexicano agridoce com toque picante. Ideal para drinks, sobremesas e frutas.", image: "/molhos.webp", price: 21.0, sizes: ["500g"], tag: "NOVIDADE" },
  { name: "Kit Base Chipotle", slug: "kit-base-chipotle", category: "molhos", type: "KIT", description: "Kit para produção de maionese chipotle. Emulsifique em 1,8L de óleo. Rendimento aproximado 2L.", image: "/molhos.webp", price: 19.0, sizes: ["1 un"], tag: "RENDE 2L" },
  { name: "Kit Base Bacon Mayo", slug: "kit-base-bacon-mayo", category: "molhos", type: "KIT", description: "Kit para produção de maionese de bacon. Emulsifique em 1,8L de óleo. Rendimento aproximado 2L.", image: "/molhos.webp", price: 25.0, sizes: ["1 un"], tag: "RENDE 2L" },
]

function getRecommendations(currentSlug: string) {
  const others = allProducts.filter((p) => p.slug !== currentSlug)
  // Deterministic shuffle based on slug to avoid hydration mismatch
  const seed = currentSlug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const shuffled = [...others].sort((a, b) => {
    const hashA = (a.slug.length * 31 + seed) % 100
    const hashB = (b.slug.length * 31 + seed) % 100
    return hashA - hashB
  })
  return shuffled.slice(0, 4)
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const product = allProducts.find((p) => p.slug === slug)

  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <p className="text-lg font-bold text-muted-foreground">Produto não encontrado</p>
          <Link href="/produtos" className="text-sm font-black text-lime tracking-wider hover:underline">
            ← VOLTAR AO CATÁLOGO
          </Link>
        </div>
        <SiteFooter />
      </main>
    )
  }

  function handleAdd() {
    for (let i = 0; i < quantity; i++) {
      addItem({ name: product!.name, price: product!.price, image: product!.image })
    }
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Link href="/produtos" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-lime transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          VOLTAR AO CATÁLOGO
        </Link>
      </div>

      {/* Product detail */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden border border-border bg-graphite">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-[300px] sm:h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-graphite/30 via-transparent to-transparent" />
              {product.tag && (
                <span className="absolute top-4 left-4 text-[10px] font-black tracking-wider px-3 py-1 rounded-full bg-lime/10 border border-lime/30 text-lime backdrop-blur-sm">
                  {product.tag}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* Type badge */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black tracking-[0.2em] text-purple-medium bg-purple-medium/10 border border-purple-medium/30 px-3 py-1 rounded-full">
                  {product.type}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  {product.category === "congelados" ? "CONGELADO" : "MOLHO / SALSA"}
                </span>
              </div>

              {/* Name */}
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Sizes */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-foreground tracking-wider">TAMANHOS DISPONÍVEIS</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, j) => (
                    <span key={j} className="text-xs font-bold text-lime bg-lime/5 border border-lime/20 px-4 py-2 rounded-full">
                      {size}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="pt-4 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider">A PARTIR DE</span>
                <p className="text-4xl font-black text-lime mt-1">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </p>
              </div>

              {/* Quantity + Add to cart */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="flex items-center justify-center gap-2 bg-graphite border border-border rounded-full px-2 py-1 self-start">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-foreground/70 hover:bg-foreground/10 transition-colors"
                    aria-label="Diminuir"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-foreground/70 hover:bg-foreground/10 transition-colors"
                    aria-label="Aumentar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-full font-black text-xs sm:text-sm tracking-wider transition-all duration-300 ${
                    added
                      ? "bg-purple-medium text-white shadow-[0_0_25px_rgba(91,45,130,0.4)]"
                      : "bg-lime text-background hover:shadow-[0_0_30px_rgba(230,230,59,0.4)]"
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="h-4 w-4" />
                      ADICIONADO
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      ADICIONAR AO CARRINHO
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="py-16 border-t border-border">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight mb-8">
            VOCÊ TAMBÉM VAI <span className="text-lime">CURTIR</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {getRecommendations(product.slug).map((rec) => (
              <Link
                key={rec.slug}
                href={`/produto/${rec.slug}`}
                className="group rounded-2xl overflow-hidden border border-border bg-graphite hover:border-lime/30 hover:shadow-[0_0_20px_rgba(200,255,0,0.06)] transition-all duration-500"
              >
                <div className="relative h-36 sm:h-72 overflow-hidden">
                  <img src={rec.image} alt={rec.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent" />
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="text-xs sm:text-sm font-black text-foreground leading-tight group-hover:text-lime transition-colors line-clamp-1">{rec.name}</h3>
                  <p className="text-sm font-black text-lime">R$ {rec.price.toFixed(2).replace(".", ",")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}
