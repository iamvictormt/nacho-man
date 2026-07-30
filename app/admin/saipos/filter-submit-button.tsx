"use client"

import { useFormStatus } from "react-dom"
import { CalendarDays, LoaderCircle } from "lucide-react"

export function FilterSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      disabled={pending}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lime px-5 text-xs font-black uppercase tracking-wider text-background transition hover:bg-lime/90 disabled:cursor-wait disabled:opacity-70 md:mt-[26px]"
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
      {pending ? "Filtrando" : "Filtrar"}
    </button>
  )
}
