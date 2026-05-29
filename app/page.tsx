import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Flame,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { allProducts } from "@/lib/products"
import { allCombos, calculateSavings, getComboOriginalPrice } from "@/lib/combos"
import { formatPrice } from "@/lib/format"
import { buildWhatsAppUrl, STORE_WHATSAPP_NUMBER } from "@/lib/whatsapp"

const featuredProducts = [
  ...allProducts.filter((product) => product.tag === "BEST SELLER"),
  ...allProducts.filter((product) => product.tag !== "BEST SELLER"),
].slice(0, 4)

const categoryCards = [
  {
    title: "Congelados",
    description: "Carnes, acompanhamentos e sobremesas prontas para finalizar.",
    href: "/produtos?category=CONGELADO",
    image: "/produtos-congelados.webp",
    brandIcon: "/cacto-roxo.svg",
    icon: Snowflake,
    accent: "text-lime",
  },
  {
    title: "Molhos e temperos",
    description: "Salsas, bases, kits e temperos para dar assinatura mexicana ao pedido.",
    href: "/produtos?category=SECO",
    image: "/molhos.webp",
    brandIcon: "/molho-roxo.svg",
    icon: Flame,
    accent: "text-purple-medium",
  },
  {
    title: "Combos",
    description: "Seleções prontas com economia para montar estoque ou abastecer eventos.",
    href: "/combos",
    image: "/embalagens-3.webp",
    brandIcon: "/burrito-pegando-fogo-roxo.svg",
    icon: PackageCheck,
    accent: "text-lime",
  },
]

const steps = [
  "Escolha produtos ou combos",
  "Adicione ao carrinho",
  "Finalize pelo WhatsApp",
]

export default function Home() {
  const highlightCombo = allCombos[0]
  const comboOriginalPrice = getComboOriginalPrice(highlightCombo)
  const comboSavings = calculateSavings(comboOriginalPrice, highlightCombo.promoPrice)
  const whatsappUrl = buildWhatsAppUrl(
    STORE_WHATSAPP_NUMBER,
    "Olá! Vim pelo site da Nacho Man e gostaria de ajuda para montar meu pedido."
  )

  return (
    <>
      <section className="relative min-h-[calc(100vh-128px)] overflow-hidden bg-background border-b border-border">
        <div className="absolute inset-0">
          <Image
            src="/embalagens-3.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        </div>

        {/* <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/lutador-roxo.svg"
            alt=""
            width={102}
            height={102}
            className="absolute left-[6%] bottom-[72%] opacity-12 hero-twinkle-delayed"
            aria-hidden="true"
          />
          <Image
            src="/caveira-roxo.svg"
            alt=""
            width={102}
            height={102}
            className="absolute left-[6%] bottom-[52%] opacity-12 hero-twinkle-delayed"
            aria-hidden="true"
          />
          <Image
            src="/pimenta-roxo.svg"
            alt=""
            width={102}
            height={102}
            className="absolute left-[6%] bottom-[32%] opacity-12 hero-twinkle-delayed"
            aria-hidden="true"
          />
          <Image
            src="/cacto-roxo.svg"
            alt=""
            width={102}
            height={102}
            className="absolute left-[6%] bottom-[12%] opacity-12 hero-twinkle-delayed"
            aria-hidden="true"
          />
        </div> */}

        <div className="relative mx-auto grid min-h-[calc(100vh-128px)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-3xl space-y-7">
            <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-lime">
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
              Para vender, servir e repetir
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black uppercase leading-[0.92] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                Nacho Man
                <span className="block text-lime neon-glow">no seu pedido.</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Congelados, molhos, temperos e combos mexicanos prontos para abastecer sua cozinha com sabor forte, preço claro e compra direto pelo WhatsApp.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/produtos"
                className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-lime px-7 py-3.5 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,230,59,0.35)]"
              >
                VER PRODUTOS
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border-2 border-purple-medium/50 px-7 py-3.5 text-sm font-bold tracking-wider text-foreground transition-all duration-300 hover:border-purple-medium hover:text-purple-medium"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                MONTAR PEDIDO
              </a>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3 pt-3">
              {[
                ["30+", "produtos"],
                ["4", "combos"],
                ["99", "limite por item"],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-lime/30 pl-3">
                  <p className="text-2xl font-black text-foreground">{value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative ml-auto aspect-[4/5] max-w-[440px] overflow-hidden rounded-2xl border border-border bg-graphite shadow-2xl">
              <Image
                src="/molhos.webp"
                alt="Molhos Nacho Man prontos para pedido"
                fill
                priority
                sizes="440px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-lime">Destaque</p>
                <h2 className="mt-2 text-2xl font-black text-foreground">Molhos, bases e salsas</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Produtos secos para finalizar pratos, porções, tacos e hambúrgueres.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {categoryCards.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group relative min-h-[250px] overflow-hidden rounded-2xl border border-border bg-graphite transition-all duration-500 hover:-translate-y-1 hover:border-lime/40 hover:shadow-[0_0_24px_rgba(230,230,59,0.12)]"
              >
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                <Image
                  src={category.brandIcon}
                  alt=""
                  width={96}
                  height={96}
                  className="absolute right-4 top-4 h-20 w-20 object-contain opacity-20 transition-transform duration-500 group-hover:scale-110"
                  aria-hidden="true"
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/80 backdrop-blur">
                    <category.icon className={`h-5 w-5 ${category.accent}`} aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{category.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-lime transition-all group-hover:gap-3">
                    Explorar <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-graphite py-16 md:py-20 border-y border-border">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-lime">Mais pedidos</span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                COMEÇE POR AQUI
              </h2>
            </div>
            <Link
              href="/produtos"
              className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-wider text-lime transition-all hover:gap-3"
            >
              Ver catálogo completo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-border bg-graphite p-6 md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-lime/30 bg-lime/10">
              <ShoppingBag className="h-5 w-5 text-lime" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-lime">Pedido simples</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
              Compra rápida, finalização humana.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              O carrinho organiza os itens e envia tudo para o WhatsApp com quantidades, preços e total. Você confirma com o atendimento antes de fechar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-border bg-graphite p-5">
                <p className="text-3xl font-black text-lime">{index + 1}</p>
                <p className="mt-4 text-sm font-black uppercase tracking-wide text-foreground">{step}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {index === 0 && "Navegue por categorias, busca, filtros ou combos promocionais."}
                  {index === 1 && "Ajuste quantidades entre 1 e 99 e acompanhe o total no carrinho."}
                  {index === 2 && "Receba a mensagem pronta e continue a conversa com o comercial."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-graphite py-16 md:py-20 border-t border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-background">
            <Image
              src="/embalagens.webp"
              alt={highlightCombo.name}
              fill
              sizes="(max-width: 1023px) 100vw, 45vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 rounded-full bg-lime px-3 py-1 text-[10px] font-black uppercase tracking-wider text-background">
              Economize {comboSavings.percentage}%
            </div>
          </div>

          <div className="space-y-5">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-medium">
              Combo em destaque
            </span>
            <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              {highlightCombo.name}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Uma seleção pronta para quem quer abastecer a cozinha com variedade e preço promocional.
            </p>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-sm font-bold text-muted-foreground line-through">
                {formatPrice(comboOriginalPrice)}
              </span>
              <span className="text-4xl font-black text-lime">
                {formatPrice(highlightCombo.promoPrice)}
              </span>
              <span className="text-sm font-bold text-purple-medium">
                economia de {formatPrice(comboSavings.absolute)}
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/combos"
                className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-lime px-7 py-3.5 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,230,59,0.3)]"
              >
                VER COMBOS
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/contato"
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border-2 border-purple-medium/50 px-7 py-3.5 text-sm font-bold tracking-wider text-foreground transition-all duration-300 hover:border-purple-medium hover:text-purple-medium"
              >
                FALAR COMERCIAL
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
