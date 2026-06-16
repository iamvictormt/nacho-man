"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { buildWhatsAppUrl, STORE_WHATSAPP_NUMBER } from "@/lib/whatsapp"
import {
  ArrowRight,
  Clock,
  Handshake,
  HelpCircle,
  MapPin,
  Phone,
  ShoppingCart,
} from "lucide-react"

const topics = [
  {
    icon: ShoppingCart,
    title: "Fazer um Pedido",
    description: "Envie seu pedido diretamente pelo WhatsApp de forma rápida e prática.",
    message: "Olá! Gostaria de fazer um pedido pelo site da Nacho Factory.",
  },
  {
    icon: HelpCircle,
    title: "Dúvidas sobre Produtos",
    description: "Tire suas dúvidas sobre ingredientes, preparo ou disponibilidade.",
    message: "Olá! Tenho uma dúvida sobre os produtos da Nacho Factory.",
  },
  {
    icon: Handshake,
    title: "Parceria Comercial",
    description: "Interessado em revender ou fazer parceria? Fale com nosso time.",
    message: "Olá! Gostaria de saber sobre parcerias comerciais com a Nacho Factory.",
  },
]

const FORMATTED_WHATSAPP = "+55 47 9726-9146"
const BUSINESS_HOURS = "SEG A SEX das 7h às 12h - 13h às 17h30"
const LOCATION = "Blumenau, SC"

export function HomeContactSection() {
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [blockedUrl, setBlockedUrl] = useState("")

  function openWhatsApp(message: string) {
    const url = buildWhatsAppUrl(STORE_WHATSAPP_NUMBER, message)
    const newWindow = window.open(url, "_blank")

    if (!newWindow) {
      setBlockedUrl(url)
      setPopupBlocked(true)
    } else {
      setPopupBlocked(false)
      setBlockedUrl("")
    }
  }

  return (
    <section id="contato" className="bg-background">
      <section className="relative overflow-hidden border-b border-border bg-background py-16 md:py-24">
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-black uppercase leading-relaxed tracking-[0.16em] text-lime sm:text-[13px]">
              <span className="h-px w-8 shrink-0 bg-lime/70" aria-hidden="true" />
              Fale com nosso time
            </span>
            <h2 className="mt-2 max-w-3xl text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
              Contato
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Solicite um orçamento, tire dúvidas ou faça seu pedido diretamente pelo WhatsApp.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          {popupBlocked && (
            <div className="mb-8 space-y-2 rounded-lg border border-purple-medium/30 bg-purple-medium/10 p-4 text-center">
              <p className="text-sm font-semibold text-foreground">
                O pop-up foi bloqueado pelo navegador.
              </p>
              <p className="text-xs text-muted-foreground">
                Permita pop-ups ou clique no link abaixo para abrir o WhatsApp:
              </p>
              <a
                href={blockedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-bold text-lime underline transition-colors hover:text-lime/80"
              >
                Abrir WhatsApp manualmente
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-black tracking-tight text-foreground">COMO PODEMOS AJUDAR?</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Nosso time está pronto para atender. Selecione o assunto e inicie uma conversa.
                </p>
              </div>

              <div className="space-y-3">
                {topics.map((topic) => (
                  <button
                    key={topic.title}
                    onClick={() => openWhatsApp(topic.message)}
                    className="group flex w-full items-center gap-4 rounded-lg border border-border bg-graphite p-4 text-left transition-all hover:border-lime/30 hover:shadow-[0_0_15px_rgba(239,255,13,0.05)]"
                    aria-label={`${topic.title} - Abrir WhatsApp`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-lime/20 bg-lime/10">
                      <topic.icon className="h-5 w-5 text-lime" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground transition-colors group-hover:text-lime">{topic.title}</p>
                      <p className="text-xs text-muted-foreground">{topic.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-lime" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="space-y-4 border-t border-border/50 pt-4">
                <ContactInfo icon={Phone} label="WHATSAPP" value={FORMATTED_WHATSAPP} />
                <ContactInfo icon={Clock} label="HORÁRIO" value={BUSINESS_HOURS} />
                <ContactInfo icon={MapPin} label="LOCALIZAÇÃO" value={LOCATION} />
              </div>
            </div>

            <div className="flex items-start justify-center">
              <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-border bg-graphite p-8 text-center">
                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#25D366]/50 to-transparent" />

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366] shadow-[0_0_30px_rgba(37,211,102,0.3)]">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-black text-foreground">WhatsApp Comercial</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Atendimento rápido e personalizado. Faça pedidos ou tire dúvidas.
                  </p>
                </div>
                <button
                  onClick={() => openWhatsApp("Olá! Vim pelo site da Nacho Factory e gostaria de mais informações.")}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#25D366] py-4 text-sm font-black tracking-wider text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,211,102,0.3)]"
                >
                  INICIAR CONVERSA
                </button>
                <p className="mt-6 text-[10px] text-muted-foreground">
                  Atendimento em horário comercial
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}

function ContactInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
      <div>
        <p className="text-[9px] font-bold tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
