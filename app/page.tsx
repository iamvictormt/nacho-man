import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChefHat,
  Factory,
  MessageCircle,
  PackageCheck,
  Pizza,
  Store,
} from "lucide-react"
import { ProductDetailCard } from "@/components/product-detail-card"
import { HomeAboutSection } from "@/components/home-about-section"
import { HomeContactSection } from "@/components/home-contact-section"
import { catalogProductsBySlug } from "@/lib/products"
import { absoluteUrl } from "@/lib/seo"
import { buildWhatsAppUrl, STORE_WHATSAPP_NUMBER } from "@/lib/whatsapp"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Alimentos Prontos para sua Operação",
  description:
    "Carnes congeladas, molhos, temperos e kits prontos para restaurantes, hamburguerias, eventos e revendedores.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Alimentos Prontos para sua Operação | Nacho Factory",
    description:
      "Produzimos carnes congeladas, molhos, temperos e kits prontos para operações de food service.",
    url: "/",
    images: [
      {
        url: absoluteUrl("/embalagens-3.webp"),
        width: 1200,
        height: 630,
        alt: "Produtos prontos Nacho Factory",
      },
    ],
  },
}

const heroStats = [
  { value: "30+", label: "Produtos" },
  { value: "700m²", label: "Estrutura Industrial" },
  { value: "-18°C", label: "Armazenagem Congelada e Seca" },
  { value: "100%", label: "Pronto para uso" },
]

const audiences = [
  {
    title: "Restaurantes",
    description: "Reduza tempo de preparo, padronize receitas e economize com mão de obra.",
    icon: ChefHat,
  },
  {
    title: "Hamburguerias e Pizzarias",
    description: "Molhos, carnes e acompanhamentos prontos.",
    icon: Pizza,
  },
  {
    title: "Franquias",
    description: "Produtos prontos para aquecer e vender.",
    icon: Building2,
  },
  {
    title: "Revendedores",
    description: "Produtos congelados e molhos para revenda.",
    icon: Store,
  },
]

const categories = [
  {
    title: "Carnes Prontas",
    image: "/product-images/carne barbacoa.webp",
    href: "/produtos?category=Carnes",
    items: [
      "Carne de Panela - Barbacoa",
      "Carne Chili Beans",
      "Carne Costelinha ao barbecue",
      "Carne Chili Veg",
      "Frango Desfiado ao molho",
      "Frango Empanado Hot",
    ],
  },
  {
    title: "Molhos e Salsas",
    image: "/product-images/salsa ghost pepper.webp",
    href: "/produtos?category=Molhos",
    items: ["Sweet Chili", "Habanero", "Jalapeño", "Salsa Verde", "Salsa Roja", "Hot Picles", "Ghost Pepper"],
  },
  {
    title: "Bases e Insumos",
    image: "/product-images/kit bacon mayo.webp",
    href: "/produtos?category=Kits",
    items: [
      "Açúcar para Churros",
      "Kit Maionese de Bacon",
      "Kit Maionese de Chipotle defumada",
      "Base de Arroz Mexicano",
      "Feijão Cozido - Frijoles",
    ],
  },
]

const homeBestSellerSlugs = [
  "carne-bovina-desfiada-artesanal",
  "chili-de-carne-com-feijao",
  "carne-suina-desfiada-com-barbecue",
  "feijao-cremoso-temperado",
  "jalapeno-2l",
  "sweet-chili-2l",
]

const homeBestSellerProducts = homeBestSellerSlugs
  .map((slug) => catalogProductsBySlug.get(slug))
  .filter((product) => product !== undefined)

const factoryFeatures = [
  { value: "700m²", label: "Estrutura" },
  { value: "-18°C", label: "Câmara fria" },
  { value: "Ultra", label: "Túnel de ultracongelamento" },
  { value: "Própria", label: "Produção própria" },
  { value: "Estoque", label: "Congelado e seco" },
]

const trustStats = [
  "Mais de 15 toneladas produzidas por mês",
  "Mais de 30 clientes recorrentes",
  "Mais de 30 unidades da Rede Nacho Man abastecidas",
]

const qualityItems = ["Câmara fria", "Ultracongelamento", "Equipamentos de ponta", "Controle de qualidade"]

const processSteps = [
  { title: "Escolha os produtos", description: "Monte seu carrinho com os itens desejados." },
  { title: "Receba orçamento", description: "Nosso time valida estoque e frete." },
  { title: "Confirme condições", description: "Alinhe pedido mínimo, pagamento e prazo com o comercial." },
  { title: "Receba no seu negócio", description: "Produtos congelados entregues prontos para uso." },
]

export default function Home() {
  const whatsappUrl = buildWhatsAppUrl(
    STORE_WHATSAPP_NUMBER,
    "Olá! Vim pelo site da Nacho Factory e gostaria de solicitar um orçamento."
  )

  return (
    <>
      <HeroSection whatsappUrl={whatsappUrl} />
      <AudienceProcessSection />
      <CatalogSection />
      <HomeAboutSection />
      <OperationProofSection />
      <FinalCta whatsappUrl={whatsappUrl} />
      <HomeContactSection />
    </>
  )
}

function HeroSection({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <section id="inicio" className="relative overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-0">
        <Image src="/embalagens-3.webp" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-background/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/55" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="max-w-3xl space-y-7">
          <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-4 text-[10px] font-black uppercase tracking-[0.22em] text-lime">
            <Factory className="h-4 w-4" aria-hidden="true" />
            Nacho Factory
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.95] text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              ALIMENTOS PRONTOS
              <br />
              PARA SUA
              <br />
              <span className="text-lime neon-glow">OPERAÇÃO.</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Produzimos carnes congeladas, molhos, temperos e kits prontos para restaurantes, hamburguerias, eventos e
              revendedores.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/produtos"
              className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-lime px-7 py-3.5 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,255,13,0.35)]"
            >
              VER CATÁLOGO
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border-2 border-purple-medium/50 px-7 py-3.5 text-sm font-bold tracking-wider text-foreground transition-all duration-300 hover:border-purple-medium hover:text-purple-medium"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              SOLICITAR ORÇAMENTO
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:ml-auto lg:max-w-[500px]">
          {heroStats.map((stat) => (
            <div key={stat.label} className="border border-border bg-graphite/85 p-5 backdrop-blur">
              <p className="text-3xl font-black text-lime md:text-4xl">{stat.value}</p>
              <p className="mt-2 text-[10px] font-bold uppercase leading-relaxed tracking-wider text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AudienceProcessSection() {
  return (
    <section className="relative border-b border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeader eyebrow="Para cozinhas que precisam vender com padrão e velocidade" title="PARA QUEM É" />
            <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {audiences.map((audience) => (
                <div key={audience.title} className="border border-border bg-graphite p-5 transition-colors hover:border-lime/30">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center border border-lime/25 bg-lime/10">
                    <audience.icon className="h-5 w-5 text-lime" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-black uppercase leading-tight text-foreground">{audience.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{audience.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-graphite p-6 md:p-7">
            <SectionHeader eyebrow="Do carrinho à entrega no seu negócio" title="COMO FUNCIONA" />
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {processSteps.map((step, index) => (
                <div key={step.title} className="border border-border bg-background/55 p-5 transition-colors hover:border-lime/25">
                  <p className="text-4xl font-black text-lime">{index + 1}</p>
                  <h3 className="mt-5 text-base font-black uppercase text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CatalogSection() {
  return (
    <section className="relative border-b border-border bg-graphite py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeader eyebrow="Organize seu pedido por linha de produção" title="CATÁLOGO PARA FOOD SERVICE" />
          <Link
            href="/produtos"
            className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-lime/40 px-6 py-3 text-sm font-black tracking-wider text-lime transition-all duration-300 hover:bg-lime hover:text-background"
          >
            VER TODOS
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group relative isolate block overflow-hidden border border-border bg-background transition-[border-color,box-shadow] duration-300 hover:border-lime/40 hover:shadow-[0_0_24px_rgba(239,255,13,0.1)]"
            >
              <div className="relative h-64 overflow-hidden bg-graphite sm:h-72">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(max-width: 1023px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              </div>
              <div className="relative bg-background p-5">
                <h3 className="text-xl font-black uppercase text-foreground">{category.title}</h3>
                <ul className="mt-5 space-y-2">
                  {category.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-foreground/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 border-t border-border pt-14">
          <SectionHeader eyebrow="Itens com maior saída para operações de food service" title="PRODUTOS MAIS VENDIDOS" />
          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {homeBestSellerProducts.map((product) => (
              <ProductDetailCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function OperationProofSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-graphite py-16 md:py-24">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-purple-medium/40 via-lime/25 to-purple-medium/40" />
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeader eyebrow="Volume, recorrência e estrutura industrial" title="PROVA SOCIAL" />
        </div>

        <div className="mt-10 grid grid-cols-2 border border-border bg-background/35 sm:grid-cols-3 lg:grid-cols-5">
          {factoryFeatures.map((feature) => (
            <div key={feature.label} className="min-h-32 border-b border-r border-border p-5 last:border-r-0 sm:[&:nth-child(3)]:border-r-0 lg:border-b-0 lg:[&:nth-child(3)]:border-r lg:[&:nth-child(5)]:border-r-0">
              <p className="text-3xl font-black leading-none text-lime md:text-4xl">{feature.value}</p>
              <p className="mt-3 max-w-[12rem] text-[10px] font-black uppercase leading-snug tracking-[0.1em] text-muted-foreground">
                {feature.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border border-border bg-background/45 p-6 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-lime/25 bg-lime/10">
                <BadgeCheck className="h-5 w-5 text-lime" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black uppercase text-foreground">Números da operação</h3>
            </div>

            <div className="space-y-3">
              {trustStats.map((stat) => (
                <div key={stat} className="flex items-center gap-3 border border-border bg-graphite p-4">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-lime" aria-hidden="true" />
                  <span className="text-sm font-bold text-foreground">{stat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-background/45 p-6 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-lime/25 bg-lime/10">
                <PackageCheck className="h-5 w-5 text-lime" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black uppercase text-foreground">Estrutura industrial com</h3>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {qualityItems.map((item) => (
                <div key={item} className="flex items-center gap-3 border border-border bg-graphite p-4 text-sm font-bold text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-l-2 border-lime pl-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Controle de processo, armazenagem e congelamento em uma operação pensada para food service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
function FinalCta({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <section className="bg-lime py-14 text-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase leading-relaxed tracking-[0.14em] text-background/70 sm:text-[13px]">
            Fale com nosso time comercial
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase leading-tight md:text-4xl">
            SOLICITE UM ORÇAMENTO PELO WHATSAPP
          </h2>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-background px-7 py-3.5 text-sm font-black tracking-wider text-lime transition-all hover:shadow-[0_0_24px_rgba(10,10,10,0.18)]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          CHAMAR NO WHATSAPP
        </a>
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <span className="inline-flex max-w-full items-center gap-3 text-xs font-black uppercase leading-relaxed tracking-[0.16em] text-lime sm:text-[13px]">
        <span className="h-px w-8 shrink-0 bg-lime/70" aria-hidden="true" />
        <span className="max-w-3xl">{eyebrow}</span>
      </span>
      <h2 className="mt-2 max-w-3xl text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
    </div>
  )
}
