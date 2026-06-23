"use client"

import { useRef, useState } from "react"
import { LoaderCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DeleteActionDialog({
  action,
  fields,
  title,
  description,
  label = "Excluir",
  successMessage,
}: {
  action: (formData: FormData) => Promise<void>
  fields: Record<string, string>
  title: string
  description: string
  label?: string
  successMessage: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)

  async function confirmDelete() {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    const formData = new FormData()
    Object.entries(fields).forEach(([key, value]) => formData.set(key, value))
    try {
      await action(formData)
      toast.success(successMessage)
      setOpen(false)
    } catch {
      toast.error("Não foi possível concluir a exclusão.")
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          disabled={pending}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-red-400/25 px-4 text-[9px] font-black uppercase text-red-300 transition hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-60 min-[420px]:w-auto"
        >
          <Trash2 className="h-3.5 w-3.5" /> {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-1rem)] border-border bg-background p-5 sm:max-w-lg sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black uppercase">{title}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <button
            onClick={confirmDelete}
            disabled={pending}
            aria-busy={pending}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-500 px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {pending ? "Processando..." : label}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
