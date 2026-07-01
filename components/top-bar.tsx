"use client"

import { Factory, MessageCircle, PackageCheck, Snowflake } from "lucide-react"
import { formatWhatsAppDisplay } from "@/lib/whatsapp"

const staticMessages = [
  { icon: PackageCheck, text: "Produtos prontos para uso" },
  { icon: Snowflake, text: "Carnes, molhos e congelados" },
  { icon: Factory, text: "Estrutura industrial 700m²" },
]

export function TopBar({ whatsappNumber }: { whatsappNumber: string }) {
  const mobileMessages = [
    { icon: MessageCircle, text: `WhatsApp ${formatWhatsAppDisplay(whatsappNumber)}` },
    ...staticMessages,
  ]

  return (
    <div data-site-topbar className="relative w-full overflow-hidden bg-lime">
      <div className="relative mx-auto flex h-9 max-w-7xl items-center justify-center px-4 sm:h-10">
        <div className="h-4 overflow-hidden" aria-label="Atendimento comercial e informações da Nacho Factory">
          <div className="topbar-vertical-ticker flex flex-col">
            {mobileMessages.map((message) => {
              const Icon = message.icon
              return (
                <span
                  key={message.text}
                  className="flex h-4 items-center justify-center gap-2 whitespace-nowrap text-[11px] font-black uppercase leading-4 tracking-wide text-background sm:text-xs sm:tracking-[0.14em]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {message.text}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

