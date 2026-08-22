"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { useBodyScrollLock } from "@/components/use-body-scroll-lock"

export function SaiposDashboardContentShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useBodyScrollLock(loading)

  React.useEffect(() => {
    setLoading(false)
  }, [children, pathname, searchParams])

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return

      const link = target.closest("a[data-saipos-loading='content']")
      if (link) {
        setLoading(true)
        return
      }

      const submit = target.closest("button[type='submit'][data-saipos-loading='content']")
      if (submit) setLoading(true)
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [])

  return (
    <div className="relative">
      {children}
      {loading ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-background/92 px-6 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-graphite p-6 text-center shadow-[0_24px_90px_rgba(0,0,0,.45)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-lime/25 bg-lime/10 text-lime">
              <LoaderCircle className="h-7 w-7 animate-spin" />
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-lime">Nacho Man BI</p>
            <h2 className="mt-2 text-2xl font-black uppercase">Carregando painel</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Atualizando filtros, gráficos e indicadores do período selecionado.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
