"use client"

import { useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"

export function AdminActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "SALVANDO...",
  successMessage,
  modalId,
  className,
  reloadOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<void>
  children: React.ReactNode
  submitLabel: string
  pendingLabel?: string
  successMessage: string
  modalId?: string
  className?: string
  reloadOnSuccess?: boolean
}) {
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    try {
      const form = event.currentTarget
      const formData = new FormData(form)

      await action(formData)
      toast.success(successMessage)
      if (modalId) window.dispatchEvent(new CustomEvent("admin-modal-success", { detail: modalId }))
      if (reloadOnSuccess) {
        window.setTimeout(() => window.location.reload(), 250)
        return
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir esta ação.")
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`admin-action-form min-w-0 ${className ?? ""}`}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      <AdminActionSubmitButton pending={pending} pendingLabel={pendingLabel} submitLabel={submitLabel} />
    </form>
  )
}

function AdminActionSubmitButton({
  pending,
  pendingLabel,
  submitLabel,
}: {
  pending: boolean
  pendingLabel: string
  submitLabel: string
}) {
  const { pending: formPending } = useFormStatus()
  const busy = pending || formPending

  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime text-[10px] font-black text-background transition hover:shadow-[0_0_24px_rgba(239,255,13,.25)] disabled:cursor-wait disabled:opacity-60"
    >
      {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {busy ? pendingLabel : submitLabel}
    </button>
  )
}
