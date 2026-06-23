"use client"

import { ArrowRight, MessageCircle } from "lucide-react"
import Link from "next/link"

export function NewsletterSection() {
  return (
    <section className="py-24 bg-graphite relative overflow-hidden">
      {/* Neon accent lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-medium/30 to-transparent" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-medium/15 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-60 w-60 rounded-full bg-purple-medium/10 blur-[100px]" />

      {/* Decorative SVG elements */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/estrelas-roxo.svg"
          alt=""
          className="absolute top-[15%] left-[8%] h-10 w-10 opacity-20 animate-float-2"
          aria-hidden="true"
        />
        <img
          src="/coracao-pegando-fogo-roxo.svg"
          alt=""
          className="absolute bottom-[20%] right-[8%] h-12 w-12 opacity-15 animate-float-4"
          aria-hidden="true"
        />
        <img
          src="/burrito-roxo.svg"
          alt=""
          className="absolute top-[60%] left-[4%] h-10 w-10 opacity-10 animate-float-1"
          aria-hidden="true"
        />
        <img
          src="/pimenta-roxo.svg"
          alt=""
          className="absolute top-[25%] right-[5%] h-8 w-8 opacity-12 animate-float-3"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        {/* Subtitle */}
        <p className="text-muted-foreground text-sm md:text-base uppercase tracking-wider font-bold">
          MENOS PREOCUPAÇÃO COM PRODUÇÃO.
        </p>
        <p className="text-muted-foreground text-sm md:text-base uppercase tracking-wider font-bold mt-1">
          MAIS TEMPO PARA O QUE IMPORTA:
        </p>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mt-4 leading-tight">
          <span className="text-lime neon-glow italic">FAZER O SEU NEGÓCIO CRESCER.</span>
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-sm mt-6 max-w-lg mx-auto leading-relaxed">
          Fale com nosso time comercial e descubra como podemos produzir para o seu negócio com qualidade e escala.
          Atendimento personalizado para food service.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
          <Link
            href="/#contato"
            className="group inline-flex items-center justify-center gap-3 bg-lime text-background font-black text-sm px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(239,255,13,0.3)] transition-all duration-300"
          >
            SOLICITAR ORÇAMENTO
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="https://wa.me/5547999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-3 border-2 border-purple-medium/40 text-foreground font-bold text-sm px-8 py-4 rounded-full hover:border-purple-medium hover:text-purple-medium hover:shadow-[0_0_20px_rgba(91,45,130,0.2)] transition-all duration-300"
          >
            <MessageCircle className="h-4 w-4" />
            CHAMAR NO WHATSAPP
          </a>
        </div>
      </div>
    </section>
  )
}
