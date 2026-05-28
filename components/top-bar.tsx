"use client"

import { Truck, Flame, Zap } from "lucide-react"
import { useEffect, useState } from "react"

const messages = [
  { icon: Flame, text: "FRETE GRÁTIS acima de R$199" },
  { icon: Zap, text: "PAGUE NO PIX COM 10% OFF" },
  { icon: Truck, text: "ENTREGA EXPRESSA • CONGELADOS COM GELO SECO" },
]

export function TopBar() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % messages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const Icon = messages[current].icon

  return (
    <div className="w-full bg-lime overflow-hidden">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-2 px-4 py-2">
        <Icon className="h-4 w-4 text-background animate-pulse" />
        <span className="text-xs font-bold text-background tracking-wider uppercase">
          {messages[current].text}
        </span>
      </div>
    </div>
  )
}
