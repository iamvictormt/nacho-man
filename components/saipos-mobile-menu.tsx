"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Database,
  LineChart,
  Menu,
  PackageSearch,
  TrendingUp,
  Users,
  Utensils,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react"
import { useBodyScrollLock } from "@/components/use-body-scroll-lock"

type SaiposMobileMenuTab = {
  id: string
  label: string
  href: string
  icon: string
  selected: boolean
}

const iconMap: Record<string, LucideIcon> = {
  resumo: BarChart3,
  alertas: AlertTriangle,
  vendas: Users,
  ticket: TrendingUp,
  financeiro: WalletCards,
  operacional: Utensils,
  produtos: PackageSearch,
  semanal: CalendarDays,
  mensal: LineChart,
  brutos: Database,
}

export function SaiposMobileMenu({ tabs }: { tabs: SaiposMobileMenuTab[] }) {
  const [open, setOpen] = React.useState(false)
  const activeTab = tabs.find((tab) => tab.selected) ?? tabs[0]
  useBodyScrollLock(open)

  React.useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-border bg-graphite/95 px-3 py-3 backdrop-blur xl:hidden">
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground transition hover:border-lime/40 hover:text-lime"
            aria-label="Abrir menu de indicadores"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
            <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-8 w-auto shrink-0" />
            <span className="min-w-0">
              <strong className="block text-[10px] uppercase text-lime">Indicadores</strong>
              <span className="block truncate text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                {activeTab?.label ?? "Saipos BI"}
              </span>
            </span>
          </div>

          <Link
            href="/admin"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-lime/40 hover:text-lime"
            aria-label="Voltar ao admin"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] xl:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-background/75 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />

          <aside className="absolute inset-y-0 left-0 grid w-[min(330px,calc(100vw-2rem))] grid-rows-[auto_1fr_auto] border-r border-border bg-graphite shadow-[28px_0_80px_rgba(0,0,0,.45)]">
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-10 w-auto shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-lime">Nacho Man BI</p>
                    <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Saipos BI</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-lime/40 hover:text-lime"
                  aria-label="Fechar menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className="min-h-0 overflow-y-auto p-3">
              <div className="grid gap-1">
                {tabs.map((tab) => {
                  const Icon = iconMap[tab.icon] ?? BarChart3
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      data-saipos-loading="content"
                      onClick={() => setOpen(false)}
                      className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 text-sm transition ${
                        tab.selected
                          ? "border-lime/30 bg-lime/10 text-lime"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="border-t border-border p-4">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground transition hover:border-lime/40 hover:text-lime"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao admin
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
