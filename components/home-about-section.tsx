"use client"

import {
  ArrowRight,
  ClipboardCheck,
  MapPin,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react"

const differentials = [
  { icon: Zap, title: "Alta Performance", sub: "Equipamentos modernos" },
  { icon: ClipboardCheck, title: "Padronização", sub: "Controle em cada etapa" },
  { icon: ShieldCheck, title: "Segurança", sub: "Rastreabilidade total" },
  { icon: Users, title: "Equipe Técnica", sub: "Profissionais especializados" },
]

const aboutHighlights = [
  "Produção de molhos, empanados e proteínas prontas",
  "Armazenagem refrigerada e congelada para terceiros",
  "Processos padronizados e controle de qualidade",
  "Segurança alimentar e rastreabilidade total",
  "Capacidade para pequenos e grandes volumes",
]

const galleryItems = [
  { image: "/local-nacho-factory.webp", alt: "Vista externa da fábrica Nacho Factory com estrutura industrial moderna" },
  { image: "/camara-fria.webp", alt: "Câmara fria industrial com prateleiras de produtos congelados armazenados" },
  { image: "/produtos-congelados.webp", alt: "Produtos congelados embalados prontos para distribuição" },
  { image: "/molhos.webp", alt: "Linha de produção de molhos artesanais em recipientes industriais" },
  { image: "/estrutura.webp", alt: "Área de produção industrial com equipamentos de processamento de alimentos" },
  { image: "/embalagens.webp", alt: "Setor de embalagem com produtos sendo preparados para expedição" },
]

const storageStats = [
  { value: "−18°C", sub: "congelados" },
  { value: "0~5°C", sub: "refrigerados" },
  { value: "24/7", sub: "monitoramento" },
]

export function HomeAboutSection() {
  return (
    <section id="sobre" className="bg-background">
      <section className="relative overflow-hidden border-b border-border bg-background py-16 md:py-24">
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <SectionEyebrow>Institucional</SectionEyebrow>
            <h2 className="mt-2 max-w-3xl text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
              Quem é a Nacho Factory
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Uma indústria especializada na produção de alimentos congelados para restaurantes, cafeterias, dark kitchens
            e marcas próprias, com estrutura própria para produzir, congelar e armazenar.
          </p>
        </div>
      </section>

      {/* <section className="border-b border-border bg-background py-6">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {differentials.map((item) => (
              <div key={item.title} className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-lime/20 bg-lime/10">
                  <item.icon className="h-4 w-4 text-lime" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-wider text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="relative overflow-hidden border-b border-border py-16 md:py-24">
        <img src="/caveira-roxo.svg" alt="" className="pointer-events-none absolute right-8 top-12 h-14 w-14 animate-float-2 opacity-15" aria-hidden="true" />
        <img src="/pimenta-roxo.svg" alt="" className="pointer-events-none absolute bottom-16 left-8 h-10 w-10 animate-float-4 opacity-15" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-lg border border-border">
              <img
                src="/local-nacho-factory.webp"
                alt="Fachada da fábrica Nacho Factory Alimentos em Blumenau, Santa Catarina"
                className="h-auto w-full object-cover md:h-[600px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 backdrop-blur-sm">
                <MapPin className="h-3 w-3 text-lime" aria-hidden="true" />
                <span className="text-[10px] font-bold tracking-wider text-foreground">BLUMENAU - SC</span>
              </div>
            </div>

            <div className="space-y-6">
              <SectionEyebrow>Quem somos</SectionEyebrow>
              <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-foreground md:text-4xl">
                Indústria de alimentos
                <br />
                feita para o seu negócio
                <br />
                <span className="text-lime neon-glow">crescer.</span>
              </h2>
              <div className="space-y-4">
                <p className="leading-relaxed text-muted-foreground">
                  A Nacho Factory Alimentos é uma indústria especializada na produção de alimentos congelados para
                  restaurantes, cafeterias, dark kitchens e marcas próprias.
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  O que começou em uma pequena cozinha para abastecer a Rede Nacho Man evoluiu para uma indústria com
                  mais de 700m² de estrutura.
                </p>
              </div>
              <ul className="space-y-3">
                {aboutHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime/30 bg-lime/10">
                      <span className="text-[8px] font-bold text-lime">✓</span>
                    </div>
                    <span className="text-sm text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="estrutura" className="relative overflow-hidden border-b border-border bg-graphite py-16 md:py-24">
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-purple-medium/40 via-lime/20 to-purple-medium/40" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-purple-medium/20 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <SectionEyebrow centered>Nossa estrutura</SectionEyebrow>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
              Conheça a <span className="text-lime neon-glow">fábrica</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {galleryItems.map((item) => (
              <div key={item.image} className="group relative aspect-square overflow-hidden rounded-lg border border-border transition-all duration-300 hover:border-lime/30">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="armazenagem" className="border-b border-border py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="space-y-5">
              <SectionEyebrow>Armazenagem refrigerada</SectionEyebrow>
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
                Controle total de
                <br />
                <span className="text-lime neon-glow">temperatura</span>
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                Estrutura completa para armazenagem de produtos de terceiros com segurança, controle de temperatura e
                rastreabilidade. Câmaras frias modernas para manter a qualidade dos seus produtos com monitoramento
                contínuo 24 horas por dia.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-4">
                {storageStats.map((item) => (
                  <div key={item.sub} className="rounded-lg border border-border bg-graphite p-4 text-center transition-colors hover:border-lime/30">
                    <p className="text-xl font-black text-lime">{item.value}</p>
                    <p className="mt-1 text-[9px] font-semibold tracking-wider text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-border">
              <img
                src="/camara-fria.webp"
                alt="Interior da câmara fria com sistema de refrigeração industrial e monitoramento de temperatura"
                className="h-[600px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border bg-graphite py-16 md:py-24">
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
        <div className="relative mx-auto max-w-3xl space-y-6 px-4 text-center">
          <h2 className="text-2xl font-black uppercase leading-tight tracking-tight text-foreground md:text-4xl">
            Menos preocupação com produção.
            <br />
            Mais tempo para o que importa:
            <br />
            <span className="text-lime neon-glow italic">fazer o seu negócio crescer.</span>
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Vamos produzir o próximo sucesso juntos? Fale com nosso time comercial.
          </p>
          <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
            <a href="#contato" className="group inline-flex items-center justify-center gap-3 rounded-full bg-lime px-8 py-4 text-sm font-black tracking-wider text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,255,13,0.3)]">
              SOLICITAR ORÇAMENTO <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a href="https://wa.me/554797269146" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-purple-medium/40 px-8 py-4 text-sm font-bold tracking-wider text-foreground transition-all duration-300 hover:border-purple-medium hover:text-purple-medium">
              WHATSAPP
            </a>
          </div>
        </div>
      </section>
    </section>
  )
}

function SectionEyebrow({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 text-xs font-black uppercase leading-relaxed tracking-[0.16em] text-lime sm:text-[13px] ${centered ? "justify-center" : ""}`}>
      <span className="h-px w-8 shrink-0 bg-lime/70" aria-hidden="true" />
      {children}
      {centered && <span className="h-px w-8 shrink-0 bg-lime/70" aria-hidden="true" />}
    </span>
  )
}
