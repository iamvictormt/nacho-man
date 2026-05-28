"use client"

import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"
import {
  Factory,
  Snowflake,
  Warehouse,
  Scale,
  ArrowRight,
  ShieldCheck,
  ClipboardCheck,
  Users,
  Zap,
  TrendingUp,
  MapPin,
} from "lucide-react"

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Hero - Estilo diferente: texto centralizado, sem grid */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-dark/30 via-background to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-purple-medium/8 blur-[150px]" />

        {/* Poucos SVGs sutis nos cantos */}
        <img src="/cacto-roxo.svg" alt="" className="absolute top-12 right-12 h-14 w-14 opacity-10 rotate-12 animate-float-2 pointer-events-none" aria-hidden="true" />
        <img src="/pimenta-roxo.svg" alt="" className="absolute bottom-16 left-12 h-10 w-10 opacity-10 -rotate-6 animate-float-4 pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-lime/10 border border-lime/20 rounded-full px-4 py-1.5 mb-8">
            <MapPin className="h-3 w-3 text-lime" />
            <span className="text-xs font-bold text-lime tracking-wider">BLUMENAU - SC</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[0.95]">
            QUEM É A<br />
            <span className="text-lime neon-glow">NACHO FACTORY ALIMENTOS</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl mt-8 max-w-2xl mx-auto leading-relaxed">
            Uma indústria especializada na produção de alimentos para restaurantes, cafeterias, empresas de alimentação e marcas próprias.
          </p>
        </div>
      </section>

      {/* Diferenciais - Faixa horizontal */}
      <section className="py-6 bg-graphite border-y border-border/20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Alta Performance", sub: "Equipamentos modernos" },
              { icon: ClipboardCheck, title: "Padronização", sub: "Controle em cada etapa" },
              { icon: ShieldCheck, title: "Segurança", sub: "Rastreabilidade total" },
              { icon: Users, title: "Equipe Técnica", sub: "Profissionais especializados" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-4">
                <div className="h-10 w-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-lime" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground tracking-wider">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O Que Produzimos */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Texto à esquerda */}
            <div className="lg:col-span-2 space-y-5">
              <span className="text-[10px] font-black tracking-[0.3em] text-lime">O QUE PRODUZIMOS</span>
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                SOLUÇÕES PRONTAS<br />PARA O SEU <span className="text-lime">NEGÓCIO</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Produtos práticos e saborosos, desenvolvidos para a rotina do food service.
              </p>
            </div>

            {/* Grid de produtos */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { icon: "/pimenta-roxo.svg", name: "Molhos de pimentas" },
                { icon: "/molho-roxo.svg", name: "Maioneses e molhos especiais" },
                { icon: "/burrito-pegando-fogo-roxo.svg", name: "Proteínas cozidas e desfiadas" },
                { icon: "/abacate-roxo.svg", name: "Empanados" },
                { icon: "/burrito-roxo.svg", name: "Bases e preparos" },
                { icon: "/coracao-pegando-fogo-roxo.svg", name: "E muito mais!" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-graphite border border-border/30 hover:border-lime/30 transition-all duration-300 text-center"
                >
                  <img src={item.icon} alt="" className="h-12 w-12 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-foreground/80">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Congelados + Infraestrutura - Layout lado a lado */}
      <section className="py-20 bg-graphite border-y border-border/20">
        <div className="mx-auto max-w-7xl px-4 space-y-16">
          {/* Congelados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-purple-medium/15 border border-purple-medium/25 rounded-full px-3 py-1">
                <Snowflake className="h-3 w-3 text-purple-medium" />
                <span className="text-[10px] font-bold text-purple-medium tracking-wider">CONGELADOS</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                QUALIDADE QUE<br /><span className="text-lime">VOCÊ CONGELA</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Mais sabor, praticidade e vida útil para o seu dia a dia. Congelamos qualidade para você servir o melhor sempre.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "−18°C", sub: "armazenagem" },
                { value: "100%", sub: "rastreável" },
                { value: "365d", sub: "validade" },
              ].map((item, i) => (
                <div key={i} className="text-center p-5 rounded-2xl bg-background/50 border border-border/30">
                  <p className="text-xl font-black text-lime">{item.value}</p>
                  <p className="text-[9px] font-semibold text-muted-foreground tracking-wider mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/20" />

          {/* Infraestrutura */}
          <div>
            <div className="text-center mb-10">
              <span className="text-[10px] font-black tracking-[0.3em] text-lime">INFRAESTRUTURA</span>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-2">
                ESTRUTURA DE PONTA
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: Warehouse,
                  title: "ARMAZENAGEM",
                  description: "Estrutura completa para produtos de terceiros com segurança e controle de temperatura.",
                },
                {
                  icon: Snowflake,
                  title: "CÂMARAS FRIAS",
                  description: "Tecnologia moderna para manter a qualidade e segurança dos seus produtos.",
                },
                {
                  icon: Scale,
                  title: "ESCALA",
                  description: "De pequenas demandas a grandes volumes com o mesmo padrão de qualidade.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-background/50 border border-border/30 hover:border-lime/30 transition-all duration-300 space-y-4"
                >
                  <div className="h-11 w-11 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center group-hover:bg-lime/20 transition-colors">
                    <item.icon className="h-5 w-5 text-lime" />
                  </div>
                  <h3 className="text-[11px] font-black text-foreground tracking-wider">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final - Simples e direto */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-60 w-60 rounded-full bg-lime/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-purple-medium/8 blur-[80px]" />

        <div className="relative mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
            MENOS PREOCUPAÇÃO COM PRODUÇÃO.<br />
            <span className="text-lime neon-glow">MAIS TEMPO PARA CRESCER.</span>
          </h2>

          <p className="text-muted-foreground max-w-md mx-auto">
            Vamos produzir o próximo sucesso juntos? Fale com nosso time comercial.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="/contato"
              className="inline-flex items-center justify-center gap-3 bg-lime text-background px-8 py-4 rounded-full font-black text-sm tracking-wider hover:scale-105 transition-transform duration-300 group"
            >
              FALE CONOSCO
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="https://wa.me/5547999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border-2 border-foreground/20 text-foreground px-8 py-4 rounded-full font-bold text-sm tracking-wider hover:border-lime hover:text-lime transition-all duration-300"
            >
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
