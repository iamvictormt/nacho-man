"use client"

import { type LucideIcon } from "lucide-react"

interface PageHeaderProps {
  label: string
  title: string
  description?: string
  icon?: LucideIcon
  emoji?: string
}

export function PageHeader({ label, title, description, icon: Icon, emoji }: PageHeaderProps) {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden bg-graphite border-b border-border">
      {/* Neon accents */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-medium/50 via-lime/30 to-purple-medium/50" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-medium/20 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-[10%] h-48 w-48 rounded-full bg-purple-medium/15 blur-[80px]" />
        <div className="absolute bottom-0 left-[20%] h-32 w-32 rounded-full bg-lime/5 blur-[60px]" />
        <div className="absolute top-[50%] left-[5%] h-32 w-32 rounded-full bg-purple-medium/8 blur-[60px]" />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/estrelas-roxo.svg"
          alt=""
          className="absolute top-[20%] right-[8%] h-8 w-8 opacity-20 animate-float-1"
          aria-hidden="true"
        />
        <img
          src="/pimenta-roxo.svg"
          alt=""
          className="absolute bottom-[20%] right-[15%] h-6 w-6 opacity-15 animate-float-3"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-3 mb-4">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center">
              <Icon className="h-4 w-4 text-lime" />
            </div>
          )}
          {emoji && <span className="text-xl">{emoji}</span>}
          <span className="text-xs font-black uppercase leading-relaxed tracking-[0.16em] text-lime sm:text-[13px]">
            {label}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-4 max-w-lg text-base leading-relaxed">{description}</p>}
      </div>
    </section>
  )
}
