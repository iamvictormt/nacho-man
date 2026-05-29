"use client"

import { Phone } from "lucide-react"

export function TopBar() {
  return (
    <div data-site-topbar className="w-full bg-lime py-2.5 relative overflow-hidden">
      {/* Neon pulse effect */}
      <div className="relative mx-auto max-w-7xl flex items-center justify-center gap-2 px-4">
        <Phone className="h-3.5 w-3.5 text-background" />
        <span className="text-xs font-bold text-background tracking-wide">
          Atendimento Comercial: WhatsApp +55 47 9726-9146
        </span>
      </div>
    </div>
  )
}
