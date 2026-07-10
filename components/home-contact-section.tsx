"use client"

import { useState } from "react"
import { ArrowRight, Clock, Handshake, HelpCircle, Mail, MapPin, Phone, ShoppingCart } from "lucide-react"
import { buildWhatsAppUrl, formatWhatsAppDisplay } from "@/lib/whatsapp"

const topics = [
  {
    icon: ShoppingCart,
    title: "Fazer um pedido",
    description: "Envie seu pedido diretamente pelo WhatsApp.",
    message: "Olá! Gostaria de fazer um pedido pelo site da Nacho Factory.",
  },
  {
    icon: HelpCircle,
    title: "Dúvidas sobre produtos",
    description: "Tire dúvidas sobre ingredientes, preparo ou disponibilidade.",
    message: "Olá! Tenho uma dúvida sobre os produtos da Nacho Factory.",
  },
  {
    icon: Handshake,
    title: "Parceria comercial",
    description: "Fale com nosso time sobre revenda e parcerias.",
    message: "Olá! Gostaria de saber sobre parcerias comerciais com a Nacho Factory.",
  },
]

const emailChannels = [
  {
    title: "Pedidos da Factory",
    email: "pedidos@nachofactory.com.br",
    topics: [
      "Pedidos pelo site",
      "Alterações ou dúvidas sobre pedidos",
      "Logística, entregas, lotes, validade e faltas",
      "Problemas relacionados a produtos ou pedidos",
    ],
  },
  {
    title: "Administrativo/Financeiro",
    email: "adm@nachofactory.com.br",
    topics: ["Boletos e pagamentos", "Notas fiscais", "Cobranças", "Cadastros e atualizações de dados"],
  },
]

export function HomeContactSection({ whatsappNumber }: { whatsappNumber: string }) {
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [blockedUrl, setBlockedUrl] = useState("")

  function openWhatsApp(message: string) {
    const url = buildWhatsAppUrl(whatsappNumber, message)
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
    <section id="contato" className="relative overflow-hidden bg-graphite py-20 md:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
      <div className="mx-auto max-w-7xl px-4">
        {popupBlocked && (
          <div className="mb-8 rounded-xl border border-purple-medium/30 bg-purple-medium/10 p-4 text-sm text-foreground">
            O pop-up foi bloqueado.{" "}
            <a href={blockedUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-lime underline">
              Abrir WhatsApp manualmente
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-3">
            <div className="mb-10 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-lime">
                <span className="h-px w-8 bg-lime/70" aria-hidden="true" />
                Fale com nosso time
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-[1.05] tracking-[-0.035em] text-foreground md:text-5xl">
                Vamos abastecer sua próxima <span className="text-lime">operação?</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                Nossa equipe está pronta para ajudar com pedidos, dúvidas sobre produtos e oportunidades de parceria.
              </p>
            </div>

            {topics.map((topic) => (
              <button
                key={topic.title}
                onClick={() => openWhatsApp(topic.message)}
                className="group flex w-full items-center gap-5 rounded-2xl border border-border bg-background p-5 text-left transition-all hover:border-lime/30"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-lime/10">
                  <topic.icon className="h-5 w-5 text-lime" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-black uppercase text-foreground">{topic.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{topic.description}</span>
                </span>
                <ArrowRight
                  className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-lime"
                  aria-hidden="true"
                />
              </button>
            ))}

            <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
              <ContactInfo icon={Phone} label="WhatsApp" value={formatWhatsAppDisplay(whatsappNumber)} />
              <ContactInfo icon={Clock} label="Horário" value="Seg. a sex., 7h–17h30" />
              <ContactInfo icon={MapPin} label="Localização" value="Blumenau, SC" />
            </div>
          </div>

          <div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-2xl border border-border bg-background p-8 md:p-10 lg:min-h-0 justify-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime to-transparent" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />
            <div className="absolute bottom-20 left-10 h-32 w-32 rounded-full bg-purple-medium/10 blur-3xl" />

            <div className="relative space-y-15">
              {emailChannels.map((channel) => (
                <a
                  key={channel.email}
                  href={`mailto:${channel.email}`}
                  className="block rounded-2xl border border-border bg-graphite p-5 transition hover:border-lime/30"
                >
                  <Mail className="h-5 w-5 text-lime" aria-hidden="true" />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-lime">{channel.title}</p>
                  <p className="mt-2 break-words text-base font-black text-foreground">{channel.email}</p>
                  <ul className="mt-5 space-y-2 text-xs font-semibold leading-5 text-muted-foreground">
                    {channel.topics.map((topic) => (
                      <li key={topic} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lime" aria-hidden="true" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactInfo({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <Icon className="h-4 w-4 text-lime" aria-hidden="true" />
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-foreground">{value}</p>
    </div>
  )
}
