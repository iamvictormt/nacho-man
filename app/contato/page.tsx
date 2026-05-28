"use client"

import { MessageCircle, MapPin, Clock, Phone } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { TopBar } from "@/components/top-bar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"

const WHATSAPP_NUMBER = "5562985329181"

export default function ContatoPage() {
  function openWhatsApp(message: string) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      {/* Header */}
      <section className="py-16 bg-graphite border-b border-border/20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="text-[10px] font-black tracking-[0.3em] text-lime">FALE COM A GENTE</span>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mt-3">
            CONTATO
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Dúvidas, pedidos especiais ou parcerias? Chama no WhatsApp que a gente resolve.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left - Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">
                  COMO PODEMOS AJUDAR?
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Nosso atendimento é feito 100% pelo WhatsApp. Rápido, direto e sem burocracia.
                </p>
              </div>

              <div className="space-y-5">
                <InfoItem
                  icon={Phone}
                  title="WHATSAPP"
                  value="(62) 98532-9181"
                />
                <InfoItem
                  icon={Clock}
                  title="HORÁRIO"
                  value="Seg a Sex, 9h às 18h"
                />
                <InfoItem
                  icon={MapPin}
                  title="LOCALIZAÇÃO"
                  value="Blumenau - SC"
                />
              </div>

              {/* Quick actions */}
              <div className="space-y-3 pt-4">
                <p className="text-xs font-black tracking-wider text-foreground/70">ATALHOS RÁPIDOS:</p>
                <button
                  onClick={() => openWhatsApp("Olá! Gostaria de fazer um pedido.")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-graphite border border-border/30 hover:border-lime/30 transition-colors text-left"
                >
                  <span className="text-lg">🛒</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Fazer um pedido</p>
                    <p className="text-[10px] text-muted-foreground">Enviar lista de produtos</p>
                  </div>
                </button>
                <button
                  onClick={() => openWhatsApp("Olá! Tenho interesse em comprar para meu restaurante (Food Service).")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-graphite border border-border/30 hover:border-lime/30 transition-colors text-left"
                >
                  <span className="text-lg">🍽️</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Food Service</p>
                    <p className="text-[10px] text-muted-foreground">Compras para restaurantes</p>
                  </div>
                </button>
                <button
                  onClick={() => openWhatsApp("Olá! Gostaria de saber sobre parcerias e revenda.")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-graphite border border-border/30 hover:border-lime/30 transition-colors text-left"
                >
                  <span className="text-lg">🤝</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Parcerias & Revenda</p>
                    <p className="text-[10px] text-muted-foreground">Quero revender NachoMan</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Right - CTA Card */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm p-8 rounded-3xl bg-gradient-to-br from-[#25D366]/10 to-[#25D366]/5 border border-[#25D366]/20 text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-[#25D366] flex items-center justify-center mx-auto">
                  <MessageCircle className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Atendimento rápido e personalizado. Tire dúvidas, faça pedidos ou peça recomendações.
                  </p>
                </div>
                <button
                  onClick={() => openWhatsApp("Olá! Vim pelo site da NachoMan.")}
                  className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white font-black text-sm tracking-wider py-4 rounded-full hover:scale-105 transition-transform duration-300"
                >
                  <MessageCircle className="h-5 w-5" />
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

function InfoItem({ icon: Icon, title, value }: { icon: typeof Phone; title: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-lime" />
      </div>
      <div>
        <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
