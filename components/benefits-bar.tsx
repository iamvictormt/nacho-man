"use client"

import { Factory, ClipboardCheck, Snowflake, ShieldCheck, Truck, Users } from "lucide-react"

const benefits = [
  { icon: Factory, title: "PRODUÇÃO INDUSTRIAL", sub: "Estrutura moderna e eficiente" },
  { icon: ClipboardCheck, title: "PADRONIZAÇÃO", sub: "Processos e receitas padronizados" },
  { icon: Snowflake, title: "ARMAZENAGEM −18°C", sub: "Câmaras frias com controle inteligente" },
  { icon: ShieldCheck, title: "SEGURANÇA ALIMENTAR", sub: "Boas práticas e normas fiscalizadas" },
  { icon: Truck, title: "ENTREGA RÁPIDA", sub: "Atendimento ágil para todo o Brasil" },
  { icon: Users, title: "EQUIPE TÉCNICA", sub: "Profissionais especializados" },
]

export function BenefitsBar() {
  return (
    <section className="py-16 bg-background relative neon-line-top">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold text-lime tracking-[0.3em] uppercase">Por que a Nacho Factory</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2">
            DIFERENCIAIS DA NOSSA <span className="text-lime neon-glow">OPERAÇÃO</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {benefits.map((b, i) => {
            const isPurple = i % 3 === 1
            return (
              <div key={i} className={`group flex flex-col items-center gap-3 p-5 rounded-2xl bg-graphite border border-border transition-all duration-300 text-center ${isPurple ? "hover:border-purple-medium/50 hover:shadow-[0_0_20px_rgba(91,45,130,0.15)]" : "hover:border-lime/40 hover:shadow-[0_0_20px_rgba(200,255,0,0.08)]"}`}>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isPurple ? "bg-purple-medium/10 border border-purple-medium/30 group-hover:bg-purple-medium/20" : "bg-lime/10 border border-lime/20 group-hover:bg-lime/20"}`}>
                  <b.icon className={`h-5 w-5 ${isPurple ? "text-purple-medium" : "text-lime"}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-foreground tracking-wider leading-tight">{b.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{b.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
