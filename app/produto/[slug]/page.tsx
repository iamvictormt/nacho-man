"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Check,
  ChefHat,
  Clock3,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
} from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { getProductBySlug, getRelatedProducts, allProducts } from "@/lib/products"
import { formatPrice } from "@/lib/format"
import { ProductCard } from "@/components/product-card"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const product = getProductBySlug(slug)

  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <p className="text-lg font-bold text-muted-foreground">Produto não encontrado</p>
        <Link
          href="/produtos"
          className="text-sm font-black text-lime tracking-wider hover:underline"
        >
          ← VOLTAR AO CATÁLOGO
        </Link>
      </div>
    )
  }

  const relatedProducts = getRelatedProducts(product, allProducts, 4)
  const careInfo =
    product.category === "CONGELADO"
      ? [
          { icon: Snowflake, title: "Conservacao", text: "Mantenha congelado a -18°C ate o preparo." },
          { icon: ChefHat, title: "Preparo", text: "Aqueça ou finalize conforme sua operacao e porcione ainda quente." },
          { icon: Clock3, title: "Praticidade", text: "Produto pensado para reduzir tempo de cozinha e padronizar pedidos." },
        ]
      : [
          { icon: ShieldCheck, title: "Armazenamento", text: "Guarde em local seco, fresco e protegido da luz direta." },
          { icon: ChefHat, title: "Uso", text: "Aplique em finalizacoes, molhos, porcoes, tacos, bowls e sanduiches." },
          { icon: Clock3, title: "Rendimento", text: "Ideal para reposicao rapida e uso recorrente no atendimento." },
        ]

  function handleAdd() {
    for (let i = 0; i < quantity; i++) {
      addItem({ name: product!.name, price: product!.price, image: product!.image })
    }
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 1000)
  }

  function decreaseQuantity() {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  function increaseQuantity() {
    setQuantity((prev) => Math.min(99, prev + 1))
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/produtos">Produtos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Product detail */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden border border-border bg-graphite aspect-square">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-graphite/30 via-transparent to-transparent" />
              {product.tag && (
                <span
                  className={`absolute top-4 left-4 text-[10px] font-black tracking-wider px-3 py-1 rounded-full ${product.tagColor}`}
                >
                  {product.tag}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* Category / Subcategory badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-black tracking-[0.2em] text-purple-medium bg-purple-medium/10 border border-purple-medium/30 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  {product.subcategory}
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

              {/* Weight */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-foreground tracking-wider">
                  PESO / VOLUME
                </span>
                <p className="text-sm font-bold text-lime">{product.weight}</p>
              </div>

              {/* Price */}
              <div className="pt-4 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider">
                  PREÇO
                </span>
                <p className="text-4xl font-black text-lime mt-1">
                  {formatPrice(product.price)}
                </p>
              </div>

              {/* Quantity + Add to cart */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="flex items-center justify-center gap-2 bg-graphite border border-border rounded-full px-2 py-1 self-start">
                  <button
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="h-11 w-11 rounded-full flex items-center justify-center text-foreground/70 hover:bg-foreground/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    disabled={quantity >= 99}
                    className="h-11 w-11 rounded-full flex items-center justify-center text-foreground/70 hover:bg-foreground/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Aumentar quantidade"
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
                  aria-label={
                    added
                      ? "Adicionado ao carrinho"
                      : `Adicionar ${product.name} ao carrinho`
                  }
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

              <div className="grid grid-cols-1 gap-3 border-t border-border/50 pt-6 sm:grid-cols-3">
                {careInfo.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border bg-graphite p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-lime/25 bg-lime/10">
                      <item.icon className="h-4 w-4 text-lime" aria-hidden="true" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 border-t border-border">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight mb-8">
              PRODUTOS <span className="text-lime">RELACIONADOS</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.slug} product={relatedProduct} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
