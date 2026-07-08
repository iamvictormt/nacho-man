"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const light = mounted && resolvedTheme === "light"
  const nextTheme = light ? "dark" : "light"
  const label = light ? "Ativar tema escuro" : "Ativar tema claro"
  const text = light ? "Tema escuro" : "Tema claro"
  const Icon = light ? Moon : Sun

  return (
    <button
      type="button"
      className={
        compact
          ? "flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 text-[10px] font-black uppercase tracking-wider text-foreground/75 transition hover:border-lime/35 hover:bg-graphite hover:text-lime"
          : "flex h-11 items-center justify-center gap-2 rounded-full border border-border px-3 text-[10px] font-black uppercase tracking-wider text-foreground/70 transition hover:border-lime/40 hover:text-lime"
      }
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="h-4 w-4" />
      <span className={compact ? "" : "hidden 2xl:inline"}>{text}</span>
    </button>
  )
}
