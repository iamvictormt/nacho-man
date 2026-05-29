"use client"

import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"
import { PageHeader } from "@/components/page-header"
import { Snowflake, ArrowRight, Thermometer, ShieldCheck, BarChart3, Zap } from "lucide-react"
import Link from "next/link"

const features = [
  { icon: Thermometer, title: "CONTROLE DE TEMPERATURA", description: "Câmaras frias com monitoramento 24/7. Temperaturas de −18°C e 0~5°C com alarmes automáticos." },
  { icon: ShieldCheck, title: "RASTREABILIDADE TOTAL", description: "Sistema completo de rastreamento de lotes, datas de entrada/saída e controle de validade." },
  { icon: BarChart3, title: "RELATÓRIOS E GESTÃO", description: "Acesso a relatórios de movimentação, estoque em tempo real e histórico de temperatura." },
  { icon: Zap, title: "CAPACIDADE FLEXÍVEL", description: "Espaço modular que se adapta à sua demanda. De pequenos volumes a grandes operações." },
]

export default function ArmazenagemPage() {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      <PageHeader
        label="Terceirização"
        title="ARMAZENAGEM REFRIGERADA"
        description="Estrutura completa para armazenagem de produtos de terceiros com segurança, controle de temperatura e rastreabilidade total."
        icon={Snowflake}
      />

      {/* Stats */}
      {/* <section className="py-8 bg-graphite border-b border-border">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "−18°C", label: "Congelados" },
              { value: "0~5°C", label: "Refrigerados" },
              { value: "24/7", label: "Monitoramento" },
              { value: "100%", label: "Rastreável" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-background border border-border hover:border-lime/30 transition-colors">
                <p className="text-2xl font-black text-lime">{stat.value}</p>
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-14">
            <span className="text-[10px] font-black tracking-[0.3em] text-lime">COMO FUNCIONA</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mt-2">
              INFRAESTRUTURA <span className="text-lime neon-glow">COMPLETA</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="group p-7 rounded-2xl border border-border bg-graphite hover:border-lime/30 hover:shadow-[0_0_20px_rgba(200,255,0,0.06)] transition-all duration-500">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 group-hover:bg-lime/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-lime" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-foreground tracking-wider">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits + Image */}
      <section className="py-20 bg-graphite border-y border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-medium/30 to-transparent" />
        <img src="/burrito-pegando-fogo-roxo.svg" alt="" className="absolute bottom-[10%] right-[5%] h-12 w-12 opacity-15 animate-float-2 pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-[10px] font-black tracking-[0.3em] text-lime">VANTAGENS</span>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                POR QUE TERCEIRIZAR A<br /><span className="text-lime neon-glow">ARMAZENAGEM?</span>
              </h2>
              <ul className="space-y-3">
                {[
                  "Sem investimento em infraestrutura própria",
                  "Redução de custos operacionais",
                  "Segurança alimentar garantida",
                  "Flexibilidade de volume",
                  "Localização estratégica em Blumenau-SC",
                  "Equipe técnica especializada",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[8px] text-lime font-bold">✓</span>
                    </div>
                    <span className="text-sm text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-border">
              <img src="/camara-fria.webp" alt="Câmara fria" className="w-full h-[380px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Segments */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black tracking-[0.3em] text-lime">SEGMENTOS</span>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-2">PARA QUEM É</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: "🍽️", name: "Restaurantes", sub: "Estoque seguro" },
              { emoji: "🏭", name: "Indústrias", sub: "Overflow de produção" },
              { emoji: "🛒", name: "Distribuidores", sub: "Hub logístico" },
              { emoji: "🍔", name: "Dark Kitchens", sub: "Insumos prontos" },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-graphite border border-border hover:border-lime/30 transition-all">
                <span className="text-3xl">{item.emoji}</span>
                <p className="text-xs font-black text-foreground tracking-wider mt-3">{item.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-graphite border-t border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-[20%] h-40 w-40 rounded-full bg-purple-medium/15 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
            PRECISA DE ESPAÇO<br /><span className="text-purple-medium neon-glow-purple italic">REFRIGERADO?</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">Solicite uma cotação personalizada para a sua operação.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/contato" className="group inline-flex items-center justify-center gap-3 bg-lime text-background px-8 py-4 rounded-full font-black text-sm tracking-wider hover:shadow-[0_0_30px_rgba(200,255,0,0.3)] transition-all duration-300">
              SOLICITAR COTAÇÃO <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="https://wa.me/5547999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 border-2 border-purple-medium/40 text-foreground px-8 py-4 rounded-full font-bold text-sm tracking-wider hover:border-purple-medium hover:text-purple-medium transition-all duration-300">
              WHATSAPP
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}
