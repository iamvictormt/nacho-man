"use client"

import { useFormStatus } from "react-dom"
import { LoaderCircle, LogOut } from "lucide-react"

export function LogoutSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      disabled={pending}
      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-lime px-4 text-sm font-black text-background transition hover:bg-lime/90 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {pending ? "Saindo..." : "Sair"}
    </button>
  )
}
