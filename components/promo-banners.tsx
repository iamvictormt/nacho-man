"use client"

import { ArrowRight, Factory, Snowflake } from "lucide-react"
import Link from "next/link"

export function PromoBanners() {
  return (
    <section className="py-12 bg-background">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Banner 1 - Produção (large) */}
          <div className="md:col-span-7 relative group overflow-hidden rounded-2xl border border-border hover:border-lime/30 transition-all duration-500 min-h-[280px]">
            <img
              src="/produtos-congelados.webp"
              alt="Congelados sob demanda"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-center p-8 space-y-3">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-lime" />
                <span className="text-[9px] font-black tracking-[0.2em] text-lime">PRODUÇÃO</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight tracking-tight">
                CONGELADOS<br /><span className="text-lime">SOB DEMANDA</span>
              </h3>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                Praticidade, qualidade e padronização para o seu food service.
              </p>
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 text-lime text-[10px] font-black tracking-wider group-hover:gap-3 transition-all"
              >
                VER PRODUÇÃO <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-5 grid grid-rows-2 gap-4">

            {/* Banner 2 - Molhos */}
            <div className="relative group overflow-hidden rounded-2xl border border-border hover:border-purple-medium/50 transition-all duration-500 min-h-[130px]">
              <img
                src="/molhos.webp"
                alt="Molhos & Salsas"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
              <div className="relative h-full flex flex-col justify-center p-6 space-y-2">
                <span className="text-[9px] font-black tracking-[0.2em] text-purple-medium">LINHA COMPLETA</span>
                <h3 className="text-lg font-black text-foreground leading-tight">
                  MOLHOS &<br />SALSAS
                </h3>
                <Link href="/produtos" className="inline-flex items-center gap-2 text-purple-medium text-[10px] font-black tracking-wider group-hover:gap-3 transition-all"
                >
                  VER LINHA <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Banner 3 - Armazenagem */}
            <div className="relative group overflow-hidden rounded-2xl bg-lime border border-lime/50 hover:shadow-[0_0_30px_rgba(200,255,0,0.15)] transition-all duration-500 min-h-[130px]">
              {/* Decorative icons */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                <img src="/abacate-roxo.svg" alt="" className="h-20 w-20" aria-hidden="true" />
              </div>

              <div className="relative h-full flex flex-col justify-center p-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-background" />
                  <span className="text-[9px] font-black tracking-[0.2em] text-background/70">ESTRUTURA COMPLETA</span>
                </div>
                <h3 className="text-lg font-black text-background leading-tight">
                  ARMAZENAGEM<br />REFRIGERADA
                </h3>
                <p className="text-[10px] text-background/70 font-medium">Câmaras Frias · 0ºC/congelados · -18°C</p>
                <a href="/combos" className="inline-flex items-center gap-2 text-background text-[10px] font-black tracking-wider group-hover:gap-3 transition-all"
                >
                  VER ESTRUTURA <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
