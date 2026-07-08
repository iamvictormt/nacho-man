"use client"

import { useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"

export function AdminInlineActionForm({
  action,
  children,
  label,
  successMessage,
}: {
  action: (formData: FormData) => Promise<void>
  children: React.ReactNode
  label: string
  successMessage: string
}) {
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const normalizedLabel = label.toLowerCase()
  const destructive = normalizedLabel.includes("desativar") || normalizedLabel.includes("cancelar")
  async function run(formData: FormData) {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    try {
      await action(formData)
      toast.success(successMessage)
    } catch {
      toast.error("Não foi possível concluir esta ação.")
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }
  return (
    <form action={run} className="flex w-full items-end gap-2 min-[420px]:w-auto">
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      <AdminInlineSubmitButton destructive={destructive} label={label} pending={pending} />
    </form>
  )
}

function AdminInlineSubmitButton({
  destructive,
  label,
  pending,
}: {
  destructive: boolean
  label: string
  pending: boolean
}) {
  const { pending: formPending } = useFormStatus()
  const busy = pending || formPending

  return (
    <button
      disabled={busy}
      aria-busy={busy}
      className={`flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-[9px] font-black transition disabled:cursor-wait disabled:opacity-60 min-[420px]:w-auto ${
        destructive
          ? "border border-red-400/25 text-red-300 hover:bg-red-500/10"
          : "bg-lime text-background hover:bg-lime/90"
      }`}
    >
      {busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
      {busy ? "..." : label}
    </button>
  )
}
