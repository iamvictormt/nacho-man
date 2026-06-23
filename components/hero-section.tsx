"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background min-h-[90vh] flex items-center">
      {/* Full background photo with heavy overlay */}
      <div className="absolute inset-0">
        <img src="/local-nacho-factory.webp" alt="" className="w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/65 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
      </div>

      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[15%] h-[400px] w-[400px] rounded-full bg-purple-medium/12 blur-[130px]" />
      </div>

      {/* Mobile decorative SVGs (visible on small screens) */}
      <div className="absolute inset-0 pointer-events-none lg:hidden">
        <img
          src="/caveira-roxo.svg"
          alt=""
          className="absolute top-[8%] right-[5%] h-[60px] w-[60px] opacity-15 hero-pulse"
          aria-hidden="true"
        />
        <img
          src="/pimenta-roxo.svg"
          alt=""
          className="absolute top-[15%] right-[30%] h-[40px] w-[40px] opacity-12 animate-float-4"
          aria-hidden="true"
        />
        <img
          src="/cacto-roxo.svg"
          alt=""
          className="absolute bottom-[20%] right-[8%] h-[50px] w-[50px] opacity-12 animate-float-3"
          aria-hidden="true"
        />
        <img
          src="/burrito-pegando-fogo-roxo.svg"
          alt=""
          className="absolute bottom-[30%] right-[25%] h-[45px] w-[45px] opacity-10 animate-float-2"
          aria-hidden="true"
        />
        <img
          src="/chapeu-roxo.svg"
          alt=""
          className="absolute top-[40%] right-[3%] h-[35px] w-[35px] opacity-10 animate-float-1"
          aria-hidden="true"
        />
      </div>

      {/* Right side — Mexican icons composition (desktop) */}
      <div className="absolute right-0 top-0 bottom-0 hidden lg:flex items-center pointer-events-none w-[50%]">
        <div className="relative w-full h-full">
          {/* Main caveira — large, center-right, pulsing glow */}
          <img
            src="/caveira-roxo.svg"
            alt=""
            className="absolute top-1/2 right-[15%] -translate-y-1/2 h-[280px] w-[280px] opacity-25 hero-pulse"
            aria-hidden="true"
          />
          {/* Caveira glow layer (duplicate for neon effect) */}
          <img
            src="/caveira-roxo.svg"
            alt=""
            className="absolute top-1/2 right-[15%] -translate-y-1/2 h-[280px] w-[280px] opacity-10 blur-[8px] hero-pulse-delayed"
            aria-hidden="true"
          />

          {/* Lutador — top right */}
          <img
            src="/lutador-roxo.svg"
            alt=""
            className="absolute top-[12%] right-[8%] h-[100px] w-[100px] opacity-20 animate-float-1"
            aria-hidden="true"
          />

          {/* Pimenta — top left area */}
          <img
            src="/pimenta-roxo.svg"
            alt=""
            className="absolute top-[18%] right-[55%] h-[80px] w-[80px] opacity-15 animate-float-4"
            aria-hidden="true"
          />

          {/* Burrito pegando fogo — mid left */}
          <img
            src="/burrito-pegando-fogo-roxo.svg"
            alt=""
            className="absolute top-[45%] right-[60%] h-[90px] w-[90px] opacity-18 animate-float-2"
            aria-hidden="true"
          />

          {/* Cacto — bottom right */}
          <img
            src="/cacto-roxo.svg"
            alt=""
            className="absolute bottom-[15%] right-[10%] h-[90px] w-[90px] opacity-18 animate-float-3"
            aria-hidden="true"
          />

          {/* Chapéu — top center */}
          <img
            src="/chapeu-roxo.svg"
            alt=""
            className="absolute top-[8%] right-[35%] h-[70px] w-[70px] opacity-15 animate-float-2"
            aria-hidden="true"
          />

          {/* Maracas — bottom left */}
          <img
            src="/maraca-roxo.svg"
            alt=""
            className="absolute bottom-[22%] right-[50%] h-[70px] w-[70px] opacity-15 animate-float-1"
            aria-hidden="true"
          />

          {/* Abacate — mid right */}
          <img
            src="/abacate-roxo.svg"
            alt=""
            className="absolute top-[65%] right-[25%] h-[60px] w-[60px] opacity-12 animate-float-4"
            aria-hidden="true"
          />

          {/* Estrelas — scattered */}
          <img
            src="/estrelas-roxo.svg"
            alt=""
            className="absolute top-[30%] right-[5%] h-[40px] w-[40px] opacity-20 hero-twinkle"
            aria-hidden="true"
          />
          <img
            src="/estrelas-roxo.svg"
            alt=""
            className="absolute bottom-[35%] right-[45%] h-[35px] w-[35px] opacity-15 hero-twinkle-delayed"
            aria-hidden="true"
          />

          {/* Coracao pegando fogo — accent */}
          <img
            src="/coracao-pegando-fogo-roxo.svg"
            alt=""
            className="absolute bottom-[10%] right-[35%] h-[55px] w-[55px] opacity-15 animate-float-3"
            aria-hidden="true"
          />

          {/* Molho — small accent */}
          <img
            src="/molho-roxo.svg"
            alt=""
            className="absolute top-[55%] right-[4%] h-[50px] w-[50px] opacity-12 animate-float-1"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 md:py-24 w-full">
        <div className="max-w-5xl space-y-8">
          {/* Headline — bold uppercase, font-weight 900 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase leading-[0.92] tracking-tight">
            <span className="text-foreground">Produção de</span>
            <br />
            <span className="text-foreground">Alimentos</span>
            <br />
            <span className="text-foreground">Congelados</span>
            <br />
            <span className="text-lime neon-glow italic">Para Food Service.</span>
          </h1>

          {/* Subtitle — max 200 characters, descriptive */}
          <p className="text-muted-foreground text-base md:text-lg max-w-lg leading-relaxed">
            Molhos, empanados e proteínas prontas. Armazenagem refrigerada com controle total de temperatura e
            rastreabilidade.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/#contato"
              className="group inline-flex items-center gap-3 bg-lime text-background px-7 py-3.5 rounded-full font-black text-sm tracking-wider hover:shadow-[0_0_30px_rgba(239,255,13,0.4)] transition-all duration-300"
            >
              SOLICITAR ORÇAMENTO
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-3 border-2 border-purple-medium/40 text-foreground px-7 py-3.5 rounded-full font-bold text-sm tracking-wider hover:border-purple-medium hover:text-purple-medium transition-all duration-300"
            >
              VER PRODUTOS
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
