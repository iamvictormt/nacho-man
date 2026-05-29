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
  Snowflake,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { allProducts } from "@/lib/products"
import { buildWhatsAppUrl, STORE_WHATSAPP_NUMBER } from "@/lib/whatsapp"

const heroStats = [
  { value: "30+", label: "Produtos" },
  { value: "700m2", label: "Estrutura industrial" },
  { value: "-18C", label: "Armazenagem congelada e seca" },
  { value: "100%", label: "Pronto para uso" },
]

const audiences = [
  {
    title: "Restaurantes",
    description: "Reduza tempo de preparo, padronize receitas e economize com mao de obra.",
    icon: ChefHat,
  },
  {
    title: "Hamburguerias e Pizzarias",
    description: "Molhos, carnes e acompanhamentos prontos para acelerar sua operacao.",
    icon: Pizza,
  },
  {
    title: "Franquias",
    description: "Produtos prontos para aquecer, vender e replicar com consistencia.",
    icon: Building2,
  },
  {
    title: "Revendedores",
    description: "Produtos congelados, molhos e bases com apelo para revenda.",
    icon: Store,
  },
]

const categories = [
  {
    title: "Carnes Prontas",
    description: "Proteinas cozidas, desfiadas e temperadas para montar pratos, tacos, pizzas e lanches.",
    image: "/carne.webp",
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
    description: "Salsas e molhos prontos para dar assinatura mexicana a porcoes, burgers e pratos.",
    image: "/molhos.webp",
    href: "/produtos?category=Molhos",
    items: [
      "Sweet Chili",
      "Habanero",
      "Jalapeno",
      "Salsa Verde",
      "Salsa Roja",
      "Hot Picles",
      "Ghost Pepper",
    ],
  },
  {
    title: "Bases e Insumos",
    description: "Kits, temperos e bases para padronizar producao com alto rendimento.",
    image: "/embalagens-3.webp",
    href: "/produtos?category=Kits",
    items: [
      "Acucar para Churros",
      "Kit Maionese de Bacon",
      "Kit Maionese de Chipotle defumada",
      "Base de Arroz Mexicano",
      "Feijao Cozido - Frijoles",
    ],
  },
]

const featuredProducts = [
  "carne-barbacoa-1-5kg",
  "carne-chili-beans-1-5kg",
  "carne-costelinha-1-5kg",
  "chili-veg-1kg",
  "frango-desfiado-ao-molho-1-5kg",
  "frijoles-refritos-1kg",
  "frango-empanado-hot-10un",
  "salsa-sweet-chili-2l",
]
  .map((slug) => allProducts.find((product) => product.slug === slug))
  .filter(Boolean)

const factoryFeatures = [
  "Camara fria",
  "Tunel de ultracongelamento",
  "Producao propria",
  "Estoque congelado e seco",
]

const trustStats = [
  "Mais de 15 toneladas produzidas por mes",
  "Mais de 30 clientes recorrentes",
  "Mais de 30 unidades da Rede Nacho Man abastecidas",
]

const qualityItems = [
  "Camara fria",
  "Ultracongelamento",
  "Equipamentos de ponta",
  "Controle de qualidade",
]

const processSteps = [
  {
    title: "Escolha os produtos",
    description: "Monte seu carrinho online com carnes, molhos, bases e congelados.",
  },
  {
    title: "Receba orcamento",
    description: "Nosso time valida estoque, condicoes comerciais e frete.",
  },
  {
    title: "Confirme o pedido",
    description: "Pagamento simples e rapido pelo atendimento comercial.",
  },
  {
    title: "Receba no seu negocio",
    description: "Produtos congelados entregues prontos para uso na operacao.",
  },
]

export default function Home() {
  const whatsappUrl = buildWhatsAppUrl(
    STORE_WHATSAPP_NUMBER,
    "Ola! Vim pelo site da Nacho Factory e gostaria de solicitar um orcamento."
  )

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="absolute inset-0">
          <Image
            src="/embalagens-3.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-background/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/55" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-18">
          <div className="max-w-3xl space-y-7">
            <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-4 text-[10px] font-black uppercase tracking-[0.22em] text-lime">
              <Factory className="h-4 w-4" aria-hidden="true" />
              Nacho Factory
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.95] text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                Alimentos prontos para sua operacao.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Produzimos carnes congeladas, molhos, temperos e kits prontos para restaurantes, hamburguerias, eventos e revendedores.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/produtos"
                className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-lime px-7 py-3.5 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,230,59,0.35)]"
              >
                VER CATALOGO
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border-2 border-purple-medium/50 px-7 py-3.5 text-sm font-bold tracking-wider text-foreground transition-all duration-300 hover:border-purple-medium hover:text-purple-medium"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                SOLICITAR ORCAMENTO
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

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader eyebrow="Para quem e" title="Produtos prontos para diferentes operacoes" />
          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {audiences.map((audience) => (
              <div key={audience.title} className="border border-border bg-graphite p-5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center border border-lime/25 bg-lime/10">
                  <audience.icon className="h-5 w-5 text-lime" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black uppercase leading-tight text-foreground">{audience.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{audience.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-graphite py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader eyebrow="Categorias" title="Visualmente mais facil de entender" />
          <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group overflow-hidden border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:border-lime/40"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    sizes="(max-width: 1023px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black uppercase text-foreground">{category.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
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
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeader eyebrow="Produtos" title="Produtos mais vendidos" />
            <Link
              href="/produtos"
              className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-wider text-lime transition-all hover:gap-3"
            >
              Ver catalogo completo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => product && <ProductCard key={product.slug} product={product} />)}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-graphite py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5">
            <SectionHeader eyebrow="Conheca a fabrica" title="Conheca a Nacho Factory" />
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              O que comecou em uma pequena cozinha para abastecer a Rede Nacho Man evoluiu para uma industria com mais de 700m2 de estrutura.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Produzimos molhos, carnes, acompanhamentos e receitas exclusivas para operacoes de food service em todo o Brasil.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {factoryFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3 border border-border bg-background/45 p-4">
                  <Snowflake className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                  <span className="text-sm font-bold text-foreground">{feature}</span>
                </div>
              ))}
            </div>
            <Link
              href="/sobre"
              className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-lime px-7 py-3.5 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,230,59,0.3)]"
            >
              VER ESTRUTURA
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { src: "/estrutura.webp", alt: "Estrutura industrial Nacho Factory" },
              { src: "/camara-fria.webp", alt: "Camara fria Nacho Factory" },
              { src: "/tacho-industrial.webp", alt: "Tacho industrial de producao" },
              { src: "/porta-industrial.webp", alt: "Area industrial da Nacho Factory" },
            ].map((image) => (
              <div key={image.src} className="relative aspect-square overflow-hidden border border-border bg-background">
                <Image src={image.src} alt={image.alt} fill sizes="(max-width: 1023px) 50vw, 25vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader eyebrow="Como funciona" title="Do catalogo ao recebimento no seu negocio" />
          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.title} className="border border-border bg-graphite p-5">
                <p className="text-4xl font-black text-lime">{index + 1}</p>
                <h3 className="mt-5 text-base font-black uppercase text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-graphite py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader eyebrow="Prova social" title="Quem confia na Nacho Factory" />
            <div className="mt-7 space-y-3">
              {trustStats.map((stat) => (
                <div key={stat} className="flex items-center gap-3 border border-border bg-background/45 p-4">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-lime" aria-hidden="true" />
                  <span className="text-sm font-bold text-foreground">{stat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-background/45 p-6">
            <div className="flex h-12 w-12 items-center justify-center border border-lime/25 bg-lime/10">
              <PackageCheck className="h-5 w-5 text-lime" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-2xl font-black uppercase text-foreground">Estrutura industrial com controle</h3>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {qualityItems.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-lime py-14 text-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-background/65">Atendimento comercial</p>
            <h2 className="mt-2 text-3xl font-black uppercase leading-tight md:text-4xl">
              Solicite um orcamento para sua operacao.
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
    </>
  )
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-lime">{eyebrow}</span>
      <h2 className="mt-2 max-w-3xl text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
    </div>
  )
}
