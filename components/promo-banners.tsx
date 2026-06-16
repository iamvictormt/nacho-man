"use client"

import { ArrowRight, Factory, Flame, Package } from "lucide-react"
import Link from "next/link"

const banners = [
  {
    id: "producao",
    image: "/produtos-congelados.webp",
    alt: "Congelados sob demanda",
    icon: Factory,
    label: "PRODUÇÃO",
    labelColor: "text-lime",
    title: "CONGELADOS",
    titleHighlight: "SOB DEMANDA",
    highlightColor: "text-lime",
    description:
      "Praticidade, qualidade e padronização para o seu food service. Produção sob medida para o seu negócio.",
    link: "/produtos",
    linkText: "VER PRODUÇÃO",
    linkColor: "text-lime",
    borderHover: "hover:border-lime/30",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(239,255,13,0.12)]",
    colSpan: "md:col-span-7",
    minHeight: "min-h-[280px]",
  },
  {
    id: "molhos",
    image: "/molhos.webp",
    alt: "Molhos & Salsas artesanais",
    icon: Flame,
    label: "LINHA COMPLETA",
    labelColor: "text-purple-medium",
    title: "MOLHOS &",
    titleHighlight: "SALSAS",
    highlightColor: "text-purple-medium",
    description: "Receitas exclusivas com ingredientes selecionados. Do suave ao picante.",
    link: "/produtos",
    linkText: "VER LINHA",
    linkColor: "text-purple-medium",
    borderHover: "hover:border-purple-medium/50",
    hoverShadow: "hover:shadow-[0_0_25px_rgba(91,45,130,0.15)]",
    colSpan: "",
    minHeight: "min-h-[130px]",
  },
  {
    id: "bases",
    image: null,
    alt: "",
    icon: Package,
    label: "BASES & INSUMOS",
    labelColor: "text-background/70",
    title: "KITS DE",
    titleHighlight: "PREPARO",
    highlightColor: "text-background",
    description: "Padronize receitas com bases, temperos e insumos prontos para operação.",
    link: "/produtos?category=Kits",
    linkText: "VER INSUMOS",
    linkColor: "text-background",
    borderHover: "",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(239,255,13,0.2)]",
    colSpan: "",
    minHeight: "min-h-[130px]",
    isHighlight: true,
  },
]

export function PromoBanners() {
  return (
    <section className="py-12 bg-background relative overflow-hidden">
      {/* Decorative SVG elements */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/pimenta-roxo.svg"
          alt=""
          className="absolute top-[10%] right-[5%] h-12 w-12 opacity-10 animate-float-3"
          aria-hidden="true"
        />
        <img
          src="/cacto-roxo.svg"
          alt=""
          className="absolute bottom-[15%] left-[3%] h-14 w-14 opacity-8 animate-float-1"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Banner 1 - Produção (large) */}
          <div
            className={`${banners[0].colSpan} relative group overflow-hidden rounded-2xl border border-border ${banners[0].borderHover} ${banners[0].hoverShadow} transition-all duration-500 ${banners[0].minHeight}`}
          >
            <img
              src={banners[0].image!}
              alt={banners[0].alt}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-center p-8 space-y-3">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-lime" />
                <span className="text-[9px] font-black tracking-[0.2em] text-lime">
                  {banners[0].label}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight tracking-tight">
                {banners[0].title}
                <br />
                <span className={banners[0].highlightColor}>{banners[0].titleHighlight}</span>
              </h3>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                {banners[0].description}
              </p>
              <Link
                href={banners[0].link}
                className="inline-flex items-center gap-2 text-lime text-[10px] font-black tracking-wider group-hover:gap-3 transition-all"
              >
                {banners[0].linkText} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-5 grid grid-rows-2 gap-4">
            {/* Banner 2 - Molhos */}
            <div
              className={`relative group overflow-hidden rounded-2xl border border-border ${banners[1].borderHover} ${banners[1].hoverShadow} transition-all duration-500 ${banners[1].minHeight}`}
            >
              <img
                src={banners[1].image!}
                alt={banners[1].alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
              <div className="relative h-full flex flex-col justify-center p-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-purple-medium" />
                  <span className="text-[9px] font-black tracking-[0.2em] text-purple-medium">
                    {banners[1].label}
                  </span>
                </div>
                <h3 className="text-lg font-black text-foreground leading-tight">
                  {banners[1].title}
                  <br />
                  <span className={banners[1].highlightColor}>{banners[1].titleHighlight}</span>
                </h3>
                <p className="text-[10px] text-muted-foreground max-w-[220px]">
                  {banners[1].description}
                </p>
                <Link
                  href={banners[1].link}
                  className="inline-flex items-center gap-2 text-purple-medium text-[10px] font-black tracking-wider group-hover:gap-3 transition-all"
                >
                  {banners[1].linkText} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Banner 3 - Bases (highlight) */}
            <div
              className={`relative group overflow-hidden rounded-2xl bg-lime border border-lime/50 ${banners[2].hoverShadow} transition-all duration-500 ${banners[2].minHeight}`}
            >
              {/* Decorative SVG */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                <img
                  src="/abacate-roxo.svg"
                  alt=""
                  className="h-20 w-20"
                  aria-hidden="true"
                />
              </div>

              <div className="relative h-full flex flex-col justify-center p-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-background" />
                  <span className="text-[9px] font-black tracking-[0.2em] text-background/70">
                    {banners[2].label}
                  </span>
                </div>
                <h3 className="text-lg font-black text-background leading-tight">
                  {banners[2].title}
                  <br />
                  {banners[2].titleHighlight}
                </h3>
                <p className="text-[10px] text-background/70 font-medium">
                  {banners[2].description}
                </p>
                <Link
                  href={banners[2].link}
                  className="inline-flex items-center gap-2 text-background text-[10px] font-black tracking-wider group-hover:gap-3 transition-all"
                >
                  {banners[2].linkText} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
