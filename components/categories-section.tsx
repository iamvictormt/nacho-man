"use client"

import { ArrowRight, Factory, Snowflake, Utensils } from "lucide-react"
import Link from "next/link"

const services = [
  {
    icon: Factory,
    title: "PRODUÇÃO INDUSTRIAL",
    description: "Fabricação de alimentos congelados sob demanda para food service, restaurantes e marcas próprias.",
    image: "/produtos-congelados.webp",
    href: "/produtos",
  },
  {
    icon: Utensils,
    title: "MOLHOS & EMPANADOS",
    description: "Linha completa de molhos artesanais, proteínas cozidas e empanados prontos para operação.",
    image: "/molhos.webp",
    href: "/produtos",
  },
  {
    icon: Snowflake,
    title: "ARMAZENAGEM REFRIGERADA",
    description: "Estrutura completa para armazenagem de produtos de terceiros com controle de temperatura e rastreabilidade de ponta a ponta.",
    image: "/camara-fria.webp",
    href: "/combos",
  },
]

export function CategoriesSection() {
  return (
    <section className="py-20 bg-graphite relative overflow-hidden">
      {/* Neon accent */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-medium/40 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-lime/20 to-transparent" />

      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none">
        <img src="/estrelas-roxo.svg" alt="" className="absolute top-[10%] right-[5%] h-10 w-10 opacity-20 animate-float-1" aria-hidden="true" />
        <img src="/caveira-roxo.svg" alt="" className="absolute bottom-[10%] left-[5%] h-12 w-12 opacity-15 animate-float-3" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-[10px] font-bold text-lime tracking-[0.3em] uppercase">Nossos Serviços</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-2">
            O QUE FAZEMOS PELO SEU <span className="text-lime neon-glow">NEGÓCIO</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {services.map((service, i) => {
            const isPurple = i === 1
            return (
              <Link
                key={i}
                href={service.href}
                className={`group relative rounded-2xl overflow-hidden border border-border transition-all duration-500 ${isPurple ? "hover:border-purple-medium/50 hover:shadow-[0_0_30px_rgba(91,45,130,0.12)]" : "hover:border-lime/40 hover:shadow-[0_0_30px_rgba(200,255,0,0.08)]"}`}
              >
                {/* Image */}
                <div className="relative h-62 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/50 to-transparent" />
                  {/* Icon badge */}
                  <div className={`absolute top-4 left-4 h-10 w-10 rounded-xl backdrop-blur-sm flex items-center justify-center ${isPurple ? "bg-purple-medium/15 border border-purple-medium/40" : "bg-lime/10 border border-lime/30"}`}>
                    <service.icon className={`h-5 w-5 ${isPurple ? "text-purple-medium" : "text-lime"}`} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3 bg-graphite">
                  <h3 className={`text-sm font-black text-foreground tracking-wider transition-colors ${isPurple ? "group-hover:text-purple-medium" : "group-hover:text-lime"}`}>
                    {service.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
                  <div className={`flex items-center gap-2 text-[10px] font-black tracking-wider pt-2 group-hover:gap-3 transition-all ${isPurple ? "text-purple-medium" : "text-lime"}`}>
                    SAIBA MAIS <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
