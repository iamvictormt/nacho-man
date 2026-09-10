"use client"

import { useId, useRef, useState } from "react"
import { LoaderCircle, Ban } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { Textarea } from "@/components/ui/textarea"
import { cancelOrderAction } from "./actions"

export function CancelOrderDialog({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter()
  const reasonId = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)

  async function confirmCancellation() {
    if (pendingRef.current || !reason.trim()) return
    pendingRef.current = true
    setPending(true)
    const data = new FormData()
    data.set("orderId", orderId)
    data.set("reason", reason.trim())
    try {
      await cancelOrderAction(data)
      toast.success("Pedido cancelado. Justificativa registrada.")
      setOpen(false)
      setReason("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar o pedido.")
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!pendingRef.current) setOpen(value)
      }}
    >
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-red-400/25 px-4 text-[9px] font-black uppercase text-red-300 transition hover:bg-red-500/10 min-[420px]:w-auto"
        >
          <Ban className="h-3.5 w-3.5" /> Cancelar pedido
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-1rem)] border-border bg-background p-5 sm:max-w-lg sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black uppercase">Cancelar pedido {orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            Após a confirmação, este pedido não poderá mais ser editado. O cancelamento é definitivo e a justificativa
            ficará disponível apenas para consulta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label htmlFor={reasonId} className="text-[10px] font-black uppercase tracking-wider">
            Justificativa do cancelamento (obrigatória)
          </label>
          <Textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            maxLength={1000}
            disabled={pending}
            rows={4}
            placeholder="Informe o motivo do cancelamento"
            className="min-h-28 rounded-xl border-border bg-graphite/45"
          />
          <p className="text-right text-[10px] text-muted-foreground">{reason.length}/1.000 caracteres</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Voltar</AlertDialogCancel>
          <button
            type="button"
            onClick={confirmCancellation}
            disabled={pending || !reason.trim()}
            aria-busy={pending}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-red-500 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {pending ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
