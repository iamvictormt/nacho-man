"use client"

import * as React from "react"
import { Download, LoaderCircle } from "lucide-react"

export function SaiposExportLink({ href }: { href: string }) {
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!loading) return
    const timeout = window.setTimeout(() => setLoading(false), 5000)
    const handleFocus = () => setLoading(false)

    window.addEventListener("focus", handleFocus)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener("focus", handleFocus)
    }
  }, [loading])

  return (
    <a
      href={href}
      onClick={() => setLoading(true)}
      className={`inline-flex min-h-12 min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-lime px-3 py-3 text-xs font-black uppercase text-background transition hover:bg-lime/90 sm:flex-none sm:px-4 ${
        loading ? "cursor-wait opacity-80" : ""
      }`}
      aria-busy={loading}
    >
      {loading ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Download className="h-4 w-4 shrink-0" />}
      <span className="min-w-0 truncate sm:hidden">{loading ? "Gerando" : "Exportar"}</span>
      <span className="hidden min-w-0 truncate sm:inline">{loading ? "Gerando XLS" : "Exportar XLS"}</span>
    </a>
  )
}
