"use client"

import { useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const router = useRouter()
  const normalizedLabel = label.toLowerCase()
  const destructive = normalizedLabel.includes("desativar") || normalizedLabel.includes("cancelar")
  async function run(formData: FormData) {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    try {
      await action(formData)
      toast.success(successMessage)
      router.refresh()
    } catch {
      toast.error("Não foi possível concluir esta ação.")
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }
  return (
    <form action={run} className="flex w-full items-start gap-2 min-[420px]:w-auto">
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      <div className="min-w-0 space-y-2.5">
        <span className="invisible block text-xs font-bold leading-4" aria-hidden="true">
          Ação
        </span>
        <AdminInlineSubmitButton destructive={destructive} label={label} pending={pending} />
      </div>
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
      className={cn(
        "flex h-12 w-full min-w-32 items-center justify-center gap-2 rounded-full px-5 text-[10px] font-black transition disabled:cursor-wait disabled:opacity-60 min-[420px]:w-auto",
        destructive
          ? "border border-red-400/25 text-red-300 hover:bg-red-500/10"
          : "bg-lime text-background hover:shadow-[0_0_24px_rgba(239,255,13,.25)]"
      )}
    >
      {busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
      {busy ? "..." : label}
    </button>
  )
}
