"use client"

import { ArrowRight, Factory, ClipboardCheck, ShieldCheck, TrendingUp } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background min-h-[85vh] flex items-center">
      {/* Background base */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-dark/50 via-background to-background" />
      </div>

      {/* Purple splash/splatter effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large purple glow splashes */}
        <div className="absolute top-[10%] left-[5%] h-[300px] w-[300px] rounded-full bg-purple-medium/20 blur-[80px]" />
        <div className="absolute bottom-[20%] right-[10%] h-[250px] w-[250px] rounded-full bg-purple-medium/15 blur-[100px]" />
        <div className="absolute top-[50%] left-[40%] h-[200px] w-[200px] rounded-full bg-purple-medium/10 blur-[60px]" />
        <div className="absolute top-[5%] right-[30%] h-[150px] w-[150px] rounded-full bg-purple-dark/30 blur-[50px]" />
        <div className="absolute bottom-[10%] left-[30%] h-[180px] w-[180px] rounded-full bg-purple-medium/12 blur-[70px]" />
      </div>

      {/* Decorative SVGs scattered around - grunge style */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top area */}
        <img src="/caveira-roxo.svg" alt="" className="absolute top-[8%] left-[8%] h-24 w-24 opacity-25 -rotate-12 animate-float-1" aria-hidden="true" />
        <img src="/coracao-pegando-fogo-roxo.svg" alt="" className="absolute top-[5%] left-[30%] h-20 w-20 opacity-20 rotate-6 animate-float-2" aria-hidden="true" />
        <img src="/estrelas-roxo.svg" alt="" className="absolute top-[5%] right-[15%] h-14 w-14 opacity-30 rotate-6 animate-float-3" aria-hidden="true" />
        <img src="/cacto-roxo.svg" alt="" className="absolute top-[12%] right-[5%] h-20 w-20 opacity-20 rotate-12 animate-float-4" aria-hidden="true" />
        <img src="/pimenta-roxo.svg" alt="" className="absolute top-[3%] right-[35%] h-12 w-12 opacity-20 -rotate-12 animate-float-1" aria-hidden="true" />

        {/* Middle area */}
        <img src="/capa-lutador-roxo.svg" alt="" className="absolute top-[35%] left-[3%] h-28 w-28 opacity-15 -rotate-6 animate-float-3" aria-hidden="true" />
        <img src="/maraca-roxo.svg" alt="" className="absolute top-[40%] right-[3%] h-16 w-16 opacity-25 rotate-12 animate-float-2" aria-hidden="true" />
        <img src="/molho-roxo.svg" alt="" className="absolute top-[55%] right-[8%] h-16 w-16 opacity-20 -rotate-6 animate-float-4" aria-hidden="true" />
        <img src="/cinturao-coracao-roxo.svg" alt="" className="absolute top-[30%] right-[12%] h-14 w-14 opacity-15 rotate-3 animate-float-1" aria-hidden="true" />

        {/* Bottom area */}
        <img src="/chapeu-roxo.svg" alt="" className="absolute bottom-[15%] left-[5%] h-18 w-18 opacity-20 rotate-6 animate-float-2" aria-hidden="true" />
        <img src="/burrito-pegando-fogo-roxo.svg" alt="" className="absolute bottom-[8%] right-[12%] h-18 w-18 opacity-20 -rotate-12 animate-float-3" aria-hidden="true" />
        <img src="/cacto-roxo.svg" alt="" className="absolute bottom-[20%] right-[25%] h-12 w-12 opacity-15 rotate-3 animate-float-4" aria-hidden="true" />
        <img src="/estrelas-roxo.svg" alt="" className="absolute bottom-[5%] left-[20%] h-10 w-10 opacity-25 -rotate-3 animate-float-1" aria-hidden="true" />
        <img src="/pimenta-roxo.svg" alt="" className="absolute bottom-[12%] left-[35%] h-10 w-10 opacity-15 rotate-12 animate-float-2" aria-hidden="true" />
        <img src="/lutador-roxo.svg" alt="" className="absolute bottom-[3%] right-[35%] h-14 w-14 opacity-15 rotate-6 animate-float-4" aria-hidden="true" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <h1 className="space-y-2">
              <span className="block text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[0.9] tracking-tighter">
                FEITA PARA
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[0.9] tracking-tighter">
                O SEU NEGÓCIO
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl font-black text-lime leading-[0.9] tracking-tighter neon-glow">
                CRESCER.
              </span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-lg leading-relaxed font-medium">
              Produção de alimentos congelados e armazenagem refrigerada para empresas do food service.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="/contato"
                className="inline-flex items-center gap-3 bg-lime text-background px-8 py-4 rounded-full font-black text-sm tracking-wider hover:scale-105 transition-transform duration-300 group"
              >
                FALE COM NOSSO TIME
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="/sobre"
                className="inline-flex items-center gap-3 border-2 border-foreground/20 text-foreground px-8 py-4 rounded-full font-bold text-sm tracking-wider hover:border-lime hover:text-lime transition-all duration-300"
              >
                CONHEÇA A MARCA
              </a>
            </div>

            {/* Pilares */}
            <div className="grid grid-cols-4 gap-3 pt-4 max-w-md">
              {[
                { icon: Factory, label: "PRODUÇÃO" },
                { icon: ClipboardCheck, label: "PADRONIZAÇÃO" },
                { icon: ShieldCheck, label: "QUALIDADE" },
                { icon: TrendingUp, label: "ESCALA" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-foreground/[0.03] border border-border/20 hover:border-lime/20 transition-colors">
                  <item.icon className="h-6 w-6 text-lime" />
                  <span className="text-[8px] font-black text-muted-foreground tracking-wider text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Large logo with floating icons */}
          <div className="relative flex items-center justify-center">
            {/* Glow behind */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-72 w-72 lg:h-[400px] lg:w-[400px] rounded-full bg-purple-medium/12 blur-[100px]" />
            </div>

            {/* Central logo */}
            <div className="relative">
              <img
                src="/nacho-man-logo-roxo.svg"
                alt="Nacho Man"
                className="h-56 w-56 lg:h-90 lg:w-90 relative z-10 drop-shadow-[0_0_40px_rgba(230,230,59,0.15)]"
              />

              {/* Orbiting icons around the logo */}
              <img src="/pimenta-roxo.svg" alt="" className="absolute -top-6 left-1/2 -translate-x-1/2 h-12 w-12 opacity-60 animate-float-1" aria-hidden="true" />
              <img src="/molho-roxo.svg" alt="" className="absolute top-[15%] -right-8 h-14 w-14 opacity-50 animate-float-2" aria-hidden="true" />
              <img src="/burrito-pegando-fogo-roxo.svg" alt="" className="absolute bottom-[15%] -right-6 h-12 w-12 opacity-45 animate-float-4" aria-hidden="true" />
              <img src="/cacto-roxo.svg" alt="" className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-11 w-11 opacity-50 animate-float-3" aria-hidden="true" />
              <img src="/coracao-pegando-fogo-roxo.svg" alt="" className="absolute bottom-[15%] -left-8 h-13 w-13 opacity-45 animate-float-1" aria-hidden="true" />
              <img src="/caveira-roxo.svg" alt="" className="absolute top-[15%] -left-6 h-12 w-12 opacity-50 animate-float-4" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
