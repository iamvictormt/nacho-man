"use client"

import { ArrowRight } from "lucide-react"

export function NewsletterSection() {
  return (
    <section className="py-20 bg-graphite relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-lime/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-purple-medium/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <span className="text-[10px] font-black tracking-[0.3em] text-lime">
          VAMOS JUNTOS
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-foreground mt-3 tracking-tight">
          VAMOS PRODUZIR O PRÓXIMO<br />SUCESSO JUNTOS?
        </h2>
        <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-md mx-auto">
          Fale com nosso time comercial e descubra como podemos ajudar seu negócio a crescer com produtos de qualidade e escala.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <a
            href="/contato"
            className="inline-flex items-center justify-center gap-3 bg-lime text-background font-black text-sm px-10 py-4 rounded-full hover:scale-105 transition-transform duration-300 group"
          >
            FALE CONOSCO
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="https://wa.me/5547999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 border-2 border-foreground/20 text-foreground font-bold text-sm px-10 py-4 rounded-full hover:border-lime hover:text-lime transition-all duration-300"
          >
            WHATSAPP
          </a>
        </div>

        <p className="text-[10px] text-muted-foreground mt-6">
          Atendemos restaurantes, cafeterias, empresas de alimentação e marcas próprias.
        </p>
      </div>
    </section>
  )
}
