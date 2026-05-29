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
import { productDetails } from "@/lib/product-details"
import { buildWhatsAppUrl, STORE_WHATSAPP_NUMBER } from "@/lib/whatsapp"

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
    image: "/molhos.webp",
    href: "/produtos?category=Molhos",
    items: [
      "Sweet Chili",
      "Habanero",
      "Jalapeño",
      "Salsa Verde",
      "Salsa Roja",
      "Hot Picles",
      "Ghost Pepper",
    ],
  },
  {
    title: "Bases e Insumos",
    image: "/embalagens-3.webp",
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

const products = [
  {
    name: "CARNE BARBACOA DESFIADA 1,5kg",
    price: "R$ 71",
    image: "/carne.webp",
    features: ["Carne bovina desfiada", "Cozimento lento", "Pronta para servir", "Congelada", "Rende até 15 porções de 100g"],
    applications: ["Tacos", "Burritos", "Nachos", "Hambúrgueres", "Pizzas", "Saladas"],
  },
  {
    name: "CHILI BEANS 1,5KG",
    price: "R$ 49,00",
    image: "/carne.webp",
    features: ["Receita tradicional mexicana", "Carne bovina e feijão temperados", "Pronto para servir", "Congelado", "Rende até 15 porções de 100g"],
    applications: ["Nachos", "Tacos", "Burritos", "Batatas Fritas", "Pizzas"],
  },
  {
    name: "COSTELINHA DESFIADA 1,5KG",
    price: "R$ 57,00",
    image: "/costelinha.webp",
    features: ["Costelinha suína cozida lentamente ao molho barbecue", "Extremamente suculenta", "Pronta para servir", "Congelada", "Rende até 15 porções 100g"],
    applications: ["Tacos", "Burritos", "Sanduíches", "Hambúrgueres", "Nachos", "Pizzas"],
  },
  {
    name: "CHILI VEG 1KG",
    price: "R$ 22,00",
    image: "/embalagens.webp",
    features: ["Proteína vegetal sabor mexicano", "Levemente apimentado", "Pronto para servir", "Congelado", "Excelente opção vegetariana"],
    applications: ["Tacos", "Burritos", "Nachos", "Bowls", "Wraps", "Pizzas", "Saladas"],
  },
  {
    name: "FRANGO DESFIADO AO MOLHO 1,5KG",
    price: "R$ 59,00",
    image: "/carne-embalada.webp",
    features: ["Frango extremamente macio", "Molho especial de tomate e mostarda", "Pronto para servir", "Congelado", "Rende até 30 coxinhas recheadas"],
    applications: ["Tacos", "Burritos", "Sanduíches", "Batatas", "Wraps", "Coxinhas", "Pastéis", "Risoles", "Pastelão", "Recheios salgados em geral"],
  },
  {
    name: "FRIJOLES REFRITOS 1KG",
    price: "R$ 16,80",
    image: "/produtos-congelados.webp",
    features: ["Feijão mexicano cremoso", "Receita tradicional", "Pronto para servir", "Congelado", "Alto rendimento"],
    applications: ["Nachos", "Tacos", "Burritos", "Tostadas", "Pratos Mexicanos"],
  },
  {
    name: "BASE ARROZ MEXICANO 100G",
    price: "R$ 4,60",
    image: "/produtos-congelados.webp",
    features: ["Preparo rápido", "Rende até 900g de arroz pronto", "Receita exclusiva Nacho Man", "Fácil padronização"],
    applications: ["Bowls", "Pratos Executivos", "Mexicanos", "Delivery"],
  },
  {
    name: "FRANGO EMPANADO HOT",
    subtitle: "10 unidades • 120g cada",
    price: "R$ 44,00",
    image: "/produtos-congelados.webp",
    features: ["Crocante por fora", "Suculento por dentro", "Levemente picante", "Congelado"],
    applications: ["Porções", "Combos", "Lanches", "Delivery", "Burritos"],
  },
  {
    name: "CHURROS PALITO 1KG",
    price: "R$ 14,40",
    image: "/embalagens-2.webp",
    features: ["Formato ideal para porções", "Fácil preparo", "Só fritar e finalizar", "Congelado"],
    applications: ["Sobremesas", "Festas", "Food Service", "Delivery"],
  },
  {
    name: "MINI CHURROS SEM RECHEIO 1KG",
    price: "R$ 14,40",
    image: "/embalagens-3.webp",
    features: ["Mini churros de 10cm", "Congelados", "Só fritar e rechear", "Excelente rentabilidade"],
    applications: ["Sobremesas", "Cafeterias", "Eventos", "Delivery"],
  },
  {
    name: "SALSA JALAPEÑO 200ML",
    price: "R$ 14,00",
    image: "/molhos.webp",
    features: ["Sabor intenso", "Levemente defumada", "Receita mexicana", "Pronta para uso"],
    applications: ["Tacos", "Nachos", "Hambúrgueres", "Batatas", "Porções"],
  },
  {
    name: "SALSA JALAPEÑO 2L",
    price: "R$ 74,90",
    image: "/molhos.webp",
    features: ["Embalagem econômica", "Food Service", "Alto rendimento", "Pronta para uso"],
    applications: ["Restaurantes", "Hamburguerias", "Dark Kitchens", "Franquias"],
  },
  {
    name: "SALSA GHOST PEPPER 200ML",
    price: "R$ 16,50",
    image: "/molhos.webp",
    features: ["Extremamente picante", "Produzida com Ghost Pepper", "Para amantes de pimenta", "Pronta para uso"],
    applications: ["Hambúrgueres", "Tacos", "Porções", "Desafios gastronômicos"],
  },
  {
    name: "SALSA HOT PICKLES 200ML",
    price: "R$ 14,00",
    image: "/molhos.webp",
    features: ["Agridoce e picante", "Sabor marcante de picles", "Pronta para uso", "Receita exclusiva"],
    applications: ["Hambúrgueres", "Hot Dogs", "Batatas", "Sanduíches"],
  },
  {
    name: "SALSA HOT PICKLES 1L",
    price: "R$ 34,80",
    image: "/molhos.webp",
    features: ["Versão econômica", "Alto rendimento", "Food Service", "Pronta para uso"],
    applications: ["Hamburguerias", "Lanchonetes", "Restaurantes"],
  },
  {
    name: "SALSA NEGRA 200ML",
    price: "R$ 14,00",
    image: "/molhos.webp",
    features: ["Perfil defumado", "Sabor intenso", "Receita exclusiva", "Pronta para uso"],
    applications: ["Carnes", "Hambúrgueres", "Tacos", "Costelas"],
  },
  {
    name: "SALSA HABANERO PIÑA 200ML",
    price: "R$ 12,00",
    image: "/molhos.webp",
    features: ["Abacaxi com habanero", "Agridoce e picante", "Sabor tropical", "Pronta para uso"],
    applications: ["Tacos", "Peixes", "Frango", "Hambúrgueres"],
  },
  {
    name: "SALSA ROJA 1L",
    price: "R$ 32,00",
    image: "/molhos.webp",
    features: ["Receita tradicional mexicana", "Equilíbrio perfeito de sabor", "Food Service", "Pronta para uso"],
    applications: ["Tacos", "Burritos", "Nachos", "Pratos Mexicanos"],
  },
  {
    name: "MOLHO SWEET CHILI 200ML",
    price: "R$ 12,00",
    image: "/molhos.webp",
    features: ["Agridoce levemente picante", "Muito versátil", "Pronta para uso", "Alta aceitação"],
    applications: ["Frango", "Batatas", "Porções", "Hambúrgueres"],
  },
  {
    name: "MOLHO SWEET CHILI 2L",
    price: "R$ 39,50",
    image: "/molhos.webp",
    features: ["Versão profissional", "Alto rendimento", "Food Service", "Excelente custo-benefício"],
    applications: ["Restaurantes", "Hamburguerias", "Dark Kitchens"],
  },
  {
    name: "SALSA VERDE 300ML",
    price: "R$ 14,90",
    image: "/molhos.webp",
    features: ["Receita mexicana tradicional", "Refrescante e levemente ácida", "Pronta para uso", "Muito versátil"],
    applications: ["Tacos", "Burritos", "Nachos", "Carnes"],
  },
  {
    name: "SALSA VERDE 600ML",
    price: "R$ 21,90",
    image: "/molhos.webp",
    features: ["Embalagem econômica", "Alto rendimento", "Food Service", "Pronta para uso"],
    applications: ["Restaurantes", "Lanchonetes", "Franquias"],
  },
  {
    name: "KIT BASE BACON MAYO",
    price: "R$ 25,00",
    image: "/embalagens.webp",
    features: ["Produza até 2 litros", "Receita exclusiva", "Fácil preparo", "Alta lucratividade"],
    applications: ["Hambúrgueres", "Batatas", "Sanduíches", "Porções"],
  },
  {
    name: "KIT BASE CHIPOTLE",
    price: "R$ 19,00",
    image: "/embalagens-3.webp",
    features: ["Produza até 2 litros", "Sabor defumado mexicano", "Fácil preparo", "Excelente rendimento"],
    applications: ["Hambúrgueres", "Tacos", "Sanduíches", "Batatas"],
  },
  {
    name: "CHAMOY (GELEIA) 500G",
    price: "R$ 21,00",
    image: "/molhos.webp",
    features: ["Molho mexicano agridoce", "Levemente picante", "Ideal para drinks", "Também usado em sobremesas e frutas"],
    applications: ["Drinks", "Sorvetes", "Frutas (manga, laranja, abacaxi)", "Sobremesas"],
  },
  {
    name: "AÇÚCAR ESPECIAL PARA CHURROS 500G",
    price: "R$ 7,00",
    image: "/embalagens-2.webp",
    features: ["Mistura pronta", "Sabor autêntico", "Fácil aplicação", "Padronização garantida"],
    applications: ["Churros", "Sonhos", "Rosquinhas"],
  },
  {
    name: "SAL ESPECIAL PARA BATATA 500G",
    price: "R$ 12,00",
    image: "/embalagens.webp",
    features: ["Tempero exclusivo", "Alta aderência", "Sabor intenso", "Pronto para uso"],
    applications: ["Batata Frita", "Batata Rústica", "Porções"],
  },
  {
    name: "SAL ESPECIAL PARA CHIPS 500G",
    price: "R$ 6,00",
    image: "/embalagens-3.webp",
    features: ["Tempero exclusivo", "Realça sabor", "Fácil aplicação", "Excelente rendimento"],
    applications: ["Chips", "Snacks", "Batatas"],
  },
  {
    name: "TAJÍN 250G",
    price: "R$ 32,00",
    image: "/molhos.webp",
    features: ["Tempero mexicano original", "Toque cítrico e picante", "Muito versátil", "Alto rendimento"],
    applications: ["Frutas", "Drinks", "Batatas", "Milho", "Petiscos"],
  },
]

const factoryFeatures = [
  { value: "700m²", label: "Estrutura" },
  { value: "-18°C", label: "Câmara fria" },
  { value: "Ultra", label: "Túnel de ultracongelamento" },
  { value: "Própria", label: "Produção própria" },
  { value: "Estoque", label: "Congelado e seco" },
]

const trustStats = [
  "Mais de 15 toneladas produzidas por mês",
  "Mais de 30 clientes Recorrentes",
  "Mais de 30 unidades da Rede Nacho Man abastecidas",
]

const qualityItems = ["Câmara fria", "Ultracongelamento", "Equipamentos de Ponta", "Controle de qualidade"]

const processSteps = [
  { title: "Escolha os produtos", description: "Monte seu carrinho online." },
  { title: "Receba orçamento", description: "Nosso time valida estoque e frete." },
  { title: "Confirme o pedido", description: "Pagamento simples e rápido." },
  { title: "Receba no seu negócio", description: "Produtos congelados entregues prontos para uso." },
]

export default function Home() {
  const whatsappUrl = buildWhatsAppUrl(
    STORE_WHATSAPP_NUMBER,
    "Olá! Vim pelo site da Nacho Factory e gostaria de solicitar um orçamento."
  )

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-background">
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
                ALIMENTOS PRONTOS PARA SUA OPERAÇÃO.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Produzimos carnes congeladas, molhos, temperos e kits prontos para restaurantes, hamburguerias, eventos e revendedores.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/produtos" className="group inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-lime px-7 py-3.5 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,230,59,0.35)]">
                VER CATÁLOGO
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border-2 border-purple-medium/50 px-7 py-3.5 text-sm font-bold tracking-wider text-foreground transition-all duration-300 hover:border-purple-medium hover:text-purple-medium">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                SOLICITAR ORÇAMENTO
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:ml-auto lg:max-w-[500px]">
            {heroStats.map((stat) => (
              <div key={stat.label} className="border border-border bg-graphite/85 p-5 backdrop-blur">
                <p className="text-3xl font-black text-lime md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-[10px] font-bold uppercase leading-relaxed tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader eyebrow="Operações atendidas" title="PARA QUEM É" />
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
          <SectionHeader eyebrow="Linhas de produtos" title="CATEGORIAS" />
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Visualmente fica muito mais fácil entender.
          </p>
          <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.title} href={category.href} className="group relative isolate block overflow-hidden border border-border bg-background transition-[border-color,box-shadow] duration-300 hover:border-lime/40 hover:shadow-[0_0_24px_rgba(230,230,59,0.1)]">
                <div className="relative h-56 overflow-hidden bg-background [transform:translateZ(0)]">
                  <Image src={category.image} alt={category.title} fill sizes="(max-width: 1023px) 100vw, 33vw" className="scale-[1.02] object-cover transition-transform duration-500 ease-out [backface-visibility:hidden] group-hover:scale-[1.08]" />
                  <div className="absolute inset-[-1px] bg-gradient-to-t from-background via-background/45 to-transparent" />
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
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader eyebrow="Produtos mais vendidos" title="PRODUTOS" />
          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {productDetails.map((product) => (
              <ProductDetailCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-graphite py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <SectionHeader eyebrow="Conheça a fábrica" title="CONHEÇA A NACHO FACTORY" />
            <div className="space-y-4 border-l-2 border-lime pl-5">
              <p className="text-base leading-relaxed text-foreground md:text-lg">
                O que começou em uma pequena cozinha para abastecer a Rede Nacho Man evoluiu para uma indústria com mais de 700m² de estrutura.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Produzimos molhos, carnes, acompanhamentos e receitas exclusivas para operações de food service em todo o Brasil.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {factoryFeatures.map((feature) => (
                <div key={feature.label} className="border border-border bg-background/45 p-4">
                  <p className="text-2xl font-black text-lime">{feature.value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {feature.label}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/sobre#estrutura" className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-lime px-7 py-3.5 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,230,59,0.3)]">
              VER ESTRUTURA
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { src: "/estrutura.webp", alt: "Estrutura industrial Nacho Factory" },
              { src: "/camara-fria.webp", alt: "Câmara fria Nacho Factory" },
              { src: "/tacho-industrial.webp", alt: "Tacho industrial de produção" },
              { src: "/porta-industrial.webp", alt: "Área industrial da Nacho Factory" },
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
          <SectionHeader eyebrow="Processo de compra" title="COMO FUNCIONA" />
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
            <SectionHeader eyebrow="Prova social" title="QUEM CONFIA NA NACHO FACTORY" />
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
            <h3 className="mt-5 text-2xl font-black uppercase text-foreground">Estrutura industrial com:</h3>
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
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-background/65">Atendimento Comercial</p>
            <h2 className="mt-2 text-3xl font-black uppercase leading-tight md:text-4xl">
              SOLICITE UM ORÇAMENTO PELO WHATSAPP
            </h2>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-background px-7 py-3.5 text-sm font-black tracking-wider text-lime transition-all hover:shadow-[0_0_24px_rgba(10,10,10,0.18)]">
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
