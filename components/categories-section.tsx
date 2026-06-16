"use client"

import { ArrowRight, Package, Snowflake, Utensils } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const categories = [
  {
    icon: Snowflake,
    title: "CONGELADOS",
    description:
      "Proteínas, empanados e pratos prontos congelados. Qualidade industrial direto da nossa fábrica para o seu negócio.",
    image: "/produtos-congelados.webp",
    href: "/produtos?category=CONGELADO",
  },
  {
    icon: Utensils,
    title: "MOLHOS & TEMPEROS",
    description:
      "Linha completa de molhos artesanais e temperos secos. Sabor autêntico mexicano em cada receita.",
    image: "/molhos.webp",
    href: "/produtos?category=SECO",
  },
  {
    icon: Package,
    title: "BASES & INSUMOS",
    description:
      "Bases, temperos e kits de preparo para padronizar receitas e agilizar a rotina da cozinha.",
    image: "/camara-fria.webp",
    href: "/produtos?category=Kits",
  },
]

export function CategoriesSection() {
  return (
    <section className="py-20 bg-graphite relative overflow-hidden">
      {/* Neon accent lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-medium/40 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-lime/20 to-transparent" />

      {/* Decorative SVG elements (min 3 per requirement 1.5) */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="/estrelas-roxo.svg"
          alt=""
          width={40}
          height={40}
          className="absolute top-[8%] right-[5%] opacity-20 animate-float-1"
          aria-hidden="true"
        />
        <Image
          src="/pimenta-roxo.svg"
          alt=""
          width={48}
          height={48}
          className="absolute top-[50%] left-[3%] opacity-15 animate-float-2"
          aria-hidden="true"
        />
        <Image
          src="/caveira-roxo.svg"
          alt=""
          width={56}
          height={56}
          className="absolute bottom-[10%] right-[8%] opacity-12 animate-float-3"
          aria-hidden="true"
        />
        <Image
          src="/burrito-roxo.svg"
          alt=""
          width={40}
          height={40}
          className="absolute bottom-[15%] left-[6%] opacity-15 animate-float-4"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-[10px] font-bold text-lime tracking-[0.3em] uppercase">
            Categorias
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-2">
            EXPLORE NOSSO{" "}
            <span className="text-lime neon-glow">CATÁLOGO</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto">
            Encontre o produto ideal para o seu negócio em nossas categorias
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, i) => {
            const isPurple = i === 1
            return (
              <Link
                key={category.title}
                href={category.href}
                className={`group relative rounded-2xl overflow-hidden border border-border bg-graphite transition-all duration-500 hover:-translate-y-1 ${
                  isPurple
                    ? "hover:border-purple-medium/60 hover:shadow-[0_0_25px_rgba(91,45,130,0.25),0_0_50px_rgba(91,45,130,0.1)]"
                    : "hover:border-lime/50 hover:shadow-[0_0_25px_rgba(230,230,59,0.2),0_0_50px_rgba(230,230,59,0.08)]"
                }`}
              >
                {/* Image */}
                <div className="relative h-52 sm:h-56 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/60 to-transparent" />

                  {/* Icon badge */}
                  <div
                    className={`absolute top-4 left-4 h-11 w-11 rounded-xl backdrop-blur-sm flex items-center justify-center ${
                      isPurple
                        ? "bg-purple-medium/20 border border-purple-medium/50"
                        : "bg-lime/10 border border-lime/30"
                    }`}
                  >
                    <category.icon
                      className={`h-5 w-5 ${
                        isPurple ? "text-purple-medium" : "text-lime"
                      }`}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  <h3
                    className={`text-sm font-black tracking-wider transition-colors ${
                      isPurple
                        ? "group-hover:text-purple-medium"
                        : "group-hover:text-lime"
                    }`}
                  >
                    {category.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                  <div
                    className={`flex items-center gap-2 text-[10px] font-black tracking-wider pt-2 transition-all group-hover:gap-3 ${
                      isPurple ? "text-purple-medium" : "text-lime"
                    }`}
                  >
                    VER PRODUTOS{" "}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
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
