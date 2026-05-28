"use client"

import { ArrowRight } from "lucide-react"

export function PromoBanners() {
  return (
    <section className="py-12 bg-background">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Banner 1 - Large */}
          <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-purple-dark to-purple-medium min-h-[300px] md:min-h-[350px] flex flex-col justify-end p-8 border border-purple-medium/30 hover:border-lime/20 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-0 right-0 h-full w-1/2 flex items-center justify-end pr-8 opacity-80">
              <img
                src="/placeholder.svg?height=280&width=280"
                alt="Carnes Congeladas"
                className="h-56 w-56 object-contain transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3"
              />
            </div>
            <div className="relative z-10 space-y-3">
              <span className="inline-block text-[10px] font-black tracking-[0.2em] text-lime bg-lime/10 px-3 py-1 rounded-full">
                COLLECTION
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                CARNES<br />CONGELADAS
              </h3>
              <p className="text-sm text-white/70 max-w-[200px]">
                Barbacoa, Costelinha e Chili Beans prontos para servir.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-lime text-xs font-black tracking-wider group/btn hover:gap-3 transition-all"
              >
                EXPLORAR
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right column - 2 stacked */}
          <div className="grid grid-rows-2 gap-4">
            {/* Banner 2 */}
            <div className="relative group overflow-hidden rounded-2xl bg-graphite min-h-[160px] flex items-center p-6 border border-border/30 hover:border-lime/20 transition-all duration-500">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80">
                <img
                  src="/placeholder.svg?height=140&width=140"
                  alt="Salsas"
                  className="h-28 w-28 object-contain transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="relative z-10 space-y-2">
                <span className="text-[9px] font-black tracking-[0.2em] text-lime/80">ARTESANAL</span>
                <h3 className="text-xl font-black text-foreground leading-tight">
                  SALSAS &<br />MOLHOS
                </h3>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-lime text-[10px] font-black tracking-wider"
                >
                  VER MOLHOS <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Banner 3 */}
            <div className="relative group overflow-hidden rounded-2xl bg-lime min-h-[160px] flex items-center p-6 border border-lime/30 hover:border-foreground/20 transition-all duration-500">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60">
                <img
                  src="/placeholder.svg?height=140&width=140"
                  alt="Food Service"
                  className="h-28 w-28 object-contain transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="relative z-10 space-y-2">
                <span className="text-[9px] font-black tracking-[0.2em] text-background/60">PROFISSIONAL</span>
                <h3 className="text-xl font-black text-background leading-tight">
                  FOOD<br />SERVICE
                </h3>
                <p className="text-[11px] text-background/70 font-medium">Embalagens de 1L a 2L</p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-background text-[10px] font-black tracking-wider"
                >
                  VER OPÇÕES <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
