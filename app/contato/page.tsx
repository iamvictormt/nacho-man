"use client"

import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"
import { PageHeader } from "@/components/page-header"
import { MessageCircle, MapPin, Clock, Phone, Factory, Snowflake, ArrowRight } from "lucide-react"

const WHATSAPP_NUMBER = "5547999999999"

const topics = [
  { icon: Factory, title: "Produção de Congelados", sub: "Orçamento para produção sob demanda", message: "Olá! Gostaria de solicitar um orçamento para produção de alimentos congelados." },
  { icon: Snowflake, title: "Armazenagem Refrigerada", sub: "Cotação para armazenagem de terceiros", message: "Olá! Tenho interesse em armazenagem refrigerada para meus produtos." },
  { emoji: "🏷️", title: "Marca Própria", sub: "Desenvolvimento de produtos exclusivos", message: "Olá! Gostaria de saber sobre desenvolvimento de marca própria." },
  { emoji: "🏭", title: "Visita à Fábrica", sub: "Agende uma visita técnica", message: "Olá! Gostaria de agendar uma visita à fábrica." },
]

export default function ContatoPage() {
  function openWhatsApp(message: string) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      <PageHeader
        label="Fale com nosso time"
        title="CONTATO"
        description="Solicite um orçamento, tire dúvidas ou agende uma visita à nossa fábrica."
        icon={MessageCircle}
      />

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">COMO PODEMOS AJUDAR?</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Nosso time comercial está pronto para atender. Selecione o assunto e inicie uma conversa.
                </p>
              </div>

              <div className="space-y-3">
                {topics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => openWhatsApp(topic.message)}
                    className="w-full group flex items-center gap-4 p-4 rounded-xl bg-graphite border border-border hover:border-lime/30 hover:shadow-[0_0_15px_rgba(200,255,0,0.05)] transition-all text-left"
                  >
                    <div className="h-10 w-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                      {topic.icon ? <topic.icon className="h-5 w-5 text-lime" /> : <span className="text-lg">{topic.emoji}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground group-hover:text-lime transition-colors">{topic.title}</p>
                      <p className="text-[10px] text-muted-foreground">{topic.sub}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-lime transition-colors shrink-0" />
                  </button>
                ))}
              </div>

              {/* Info */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-lime shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-muted-foreground">WHATSAPP</p>
                    <p className="text-sm font-semibold text-foreground">(47) 9 9999-9999</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-lime shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-muted-foreground">HORÁRIO</p>
                    <p className="text-sm font-semibold text-foreground">Seg a Sex, 8h às 18h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-lime shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-muted-foreground">LOCALIZAÇÃO</p>
                    <p className="text-sm font-semibold text-foreground">Blumenau - SC</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - WhatsApp CTA */}
            <div className="flex items-start justify-center">
              <div className="w-full max-w-sm p-8 rounded-2xl bg-graphite border border-border text-center space-y-6 relative overflow-hidden">
                {/* Neon accent */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#25D366]/50 to-transparent" />

                <div className="h-20 w-20 rounded-full bg-[#25D366] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(37,211,102,0.3)]">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">WhatsApp Comercial</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Atendimento rápido e personalizado. Solicite orçamentos ou tire dúvidas.
                  </p>
                </div>
                <button
                  onClick={() => openWhatsApp("Olá! Vim pelo site da NachoMan e gostaria de mais informações.")}
                  className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white font-black text-sm tracking-wider py-4 rounded-full hover:shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all duration-300"
                >
                  INICIAR CONVERSA
                </button>
                <p className="text-[10px] text-muted-foreground">
                  Resposta em até 30 minutos no horário comercial
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}
