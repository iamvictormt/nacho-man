import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Building2, ChefHat, Factory, MessageCircle, Pizza, Store } from "lucide-react"
import { HomeAboutSection } from "@/components/home-about-section"
import { HomeContactSection } from "@/components/home-contact-section"
import { ProductDetailCard } from "@/components/product-detail-card"
import { SectionHeading } from "@/components/section-heading"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"
import { prisma } from "@/lib/prisma"
import { absoluteUrl } from "@/lib/seo"
import { getStoreWhatsAppNumber } from "@/lib/site-settings"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const featuredProductSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  features: true,
  applications: true,
  storageInfo: true,
  usageInfo: true,
  yieldInfo: true,
  image: true,
  priceInCents: true,
  unit: true,
  packageLabel: true,
  minimumQuantity: true,
  category: { select: { name: true } },
} satisfies Prisma.ProductSelect

export const metadata: Metadata = {
  title: "Alimentos Prontos para sua Operação",
  description:
    "Carnes congeladas, molhos, temperos e kits prontos para restaurantes, hamburguerias, eventos e revendedores.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Alimentos Prontos para sua Operação | Nacho Factory",
    description: "Produzimos carnes congeladas, molhos, temperos e kits prontos para operações de food service.",
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
  { value: "700m²", label: "Estrutura industrial" },
  { value: "−18°C", label: "Armazenagem congelada" },
  { value: "100%", label: "Pronto para uso" },
]

const audiences = [
  {
    title: "Restaurantes",
    description: "Reduza tempo de preparo, padronize receitas e economize com mão de obra.",
    icon: ChefHat,
  },
  {
    title: "Hamburguerias e pizzarias",
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

const processSteps = [
  { title: "Escolha os produtos", description: "Monte seu carrinho com os itens desejados." },
  { title: "Receba um orçamento", description: "Nossa equipe valida estoque, prazo e logística." },
  { title: "Confirme as condições", description: "Alinhe pedido mínimo, pagamento e prazo com o time comercial." },
  { title: "Receba no seu negócio", description: "Produtos entregues prontos para o uso." },
]

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { audience: "PUBLIC", active: true, category: { active: true } },
    select: featuredProductSelect,
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    take: 6,
  })
  const whatsappNumber = await getStoreWhatsAppNumber()
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    "Olá! Vim pelo site da Nacho Factory e gostaria de solicitar um orçamento."
  )

  return (
    <>
      <HeroSection whatsappUrl={whatsappUrl} />
      <AudienceSection />
      <CatalogSection products={products.map(adaptMarketplaceProduct)} />
      <ProcessSection />
      <HomeAboutSection />
      <HomeContactSection whatsappNumber={whatsappNumber} />
    </>
  )
}

function HeroSection({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <section id="inicio" className="relative isolate overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-0 -z-10">
        <video
          className="h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/embalagens-3.webp"
          aria-hidden="true"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/45" />
      </div>

      <div className="mx-auto flex min-h-[720px] max-w-7xl flex-col justify-center px-4 py-20 md:min-h-[760px] lg:py-28">
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-3 rounded-full border border-lime/25 bg-background/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-lime backdrop-blur">
            <Factory className="h-4 w-4" aria-hidden="true" />
            Indústria para food service
          </p>
          <h1 className="mt-7 text-4xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
            Alimentos prontos
            <br />
            para sua <span className="text-lime neon-glow">operação.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-foreground/70 md:text-lg">
            Produzimos carnes congeladas, molhos, temperos e kits prontos para restaurantes, hamburguerias, eventos e
            revendedores.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/produtos"
              className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-lime px-8 text-sm font-black tracking-wider text-background transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(239,255,13,0.28)]"
            >
              VER CATÁLOGO
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-13 items-center justify-center gap-3 rounded-full border border-foreground/25 bg-background/45 px-8 text-sm font-black tracking-wider text-foreground backdrop-blur transition-all hover:border-purple-medium hover:text-purple-medium"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              SOLICITAR ORÇAMENTO
            </a>
          </div>
        </div>

        <div className="mt-14 grid max-w-4xl grid-cols-2 overflow-hidden rounded-2xl border border-border bg-background/70 backdrop-blur md:grid-cols-4">
          {heroStats.map((stat) => (
            <div key={stat.label} className="border-b border-r border-border p-5 last:border-r-0 md:border-b-0 md:p-6">
              <p className="text-2xl font-black tracking-tight text-lime md:text-3xl">{stat.value}</p>
              <p className="mt-2 text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AudienceSection() {
  return (
    <section className="border-b border-border bg-graphite py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Soluções para food service"
          title="Feito para operações que precisam de padrão e velocidade"
          description="Produtos pensados para reduzir preparo, simplificar a rotina da cozinha e manter o mesmo resultado em cada pedido."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((audience) => (
            <article
              key={audience.title}
              className="group rounded-2xl border border-border bg-graphite p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-lime/20 bg-lime/10">
                <audience.icon className="h-5 w-5 text-lime" aria-hidden="true" />
              </div>
              <h3 className="mt-8 text-lg font-black uppercase leading-tight text-foreground">{audience.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{audience.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CatalogSection({ products }: { products: ReturnType<typeof adaptMarketplaceProduct>[] }) {
  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Catálogo Nacho Factory"
          title="Produtos mais vendidos"
          description="Itens com maior saída para operações de food service."
          action={
            <Link
              href="/produtos"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-lime/40 px-7 text-sm font-black tracking-wider text-lime transition-all hover:bg-lime hover:text-background"
            >
              VER TODOS
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          }
        />
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => (
            <ProductDetailCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProcessSection() {
  return (
    <section className="border-b border-border bg-graphite py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow="Do carrinho à entrega"
          title="Um processo simples para abastecer seu negócio"
          description="Você escolhe, nosso time alinha as condições e a Nacho Factory cuida do restante."
        />
        <ol className="mt-12 grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-graphite md:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <li key={step.title} className="relative border-b border-r border-border p-7 last:border-0 lg:border-b-0">
              <span className="text-5xl font-black leading-none text-lime">0{index + 1}</span>
              <h3 className="mt-8 text-base font-black uppercase text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
