import { Factory, ClipboardCheck, ShieldCheck, Snowflake } from "lucide-react"

const benefits = [
  { icon: Factory, title: "PRODUÇÃO INDUSTRIAL", sub: "estrutura de alta performance" },
  { icon: ClipboardCheck, title: "PADRONIZAÇÃO", sub: "controle em cada etapa" },
  { icon: Snowflake, title: "ARMAZENAGEM SEGURA", sub: "refrigerada e congelada" },
  { icon: ShieldCheck, title: "SEGURANÇA ALIMENTAR", sub: "rastreabilidade total" },
]

export function BenefitsBar() {
  return (
    <section className="py-10 bg-background border-y border-border/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-2xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 group-hover:bg-lime/20 transition-colors">
                <b.icon className="h-5 w-5 text-lime" />
              </div>
              <div>
                <p className="text-xs font-black text-foreground tracking-wider">{b.title}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
