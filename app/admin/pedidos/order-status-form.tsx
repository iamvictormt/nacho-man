"use client"

import { useEffect, useState, useTransition } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrderStatusAction } from "./actions"

type StatusOption = {
  value: string
  label: string
}

export function OrderStatusForm({
  orderId,
  orderNumber,
  currentStatus,
  currentStatusLabel,
  options,
  statusClassNames,
}: {
  orderId: string
  orderNumber: string
  currentStatus: string
  currentStatusLabel: string
  options: StatusOption[]
  statusClassNames: Record<string, string>
}) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const disabled = currentStatus === "CANCELLED"
  const visibleOptions = options.some((option) => option.value === currentStatus)
    ? options
    : [{ value: currentStatus, label: currentStatusLabel }, ...options]
  const statusClassName = statusClassNames[status] ?? statusClassNames[currentStatus] ?? ""
  const statusLabel = visibleOptions.find((option) => option.value === status)?.label ?? currentStatusLabel
  const pendingStatusLabel = visibleOptions.find((option) => option.value === pendingStatus)?.label ?? pendingStatus

  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  function handleStatusChange(nextStatus: string) {
    if (!nextStatus || nextStatus === status || isPending) return
    setPendingStatus(nextStatus)
  }

  function confirmStatusChange() {
    if (!pendingStatus || pendingStatus === status || isPending) return

    const previousStatus = status
    const nextStatus = pendingStatus
    setStatus(nextStatus)
    setPendingStatus(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.set("orderId", orderId)
      formData.set("status", nextStatus)

      try {
        await updateOrderStatusAction(formData)
        toast.success("Status atualizado com sucesso.")
        router.refresh()
      } catch (error) {
        setStatus(previousStatus)
        toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o status.")
      }
    })
  }

  return (
    <>
      <div className="inline-flex max-w-full">
        <Select value={status} disabled={disabled || isPending} onValueChange={handleStatusChange}>
          <SelectTrigger
            size="sm"
            aria-label="Alterar status do pedido"
            className={cn(
              "h-10 w-[190px] rounded-full px-4 text-left text-[8px] font-black uppercase leading-3 tracking-wider shadow-none ring-1 ring-inset ring-white/5 transition hover:-translate-y-px hover:brightness-110 focus-visible:ring-2 focus-visible:ring-lime/60 [&>span]:min-w-0 [&>span]:whitespace-normal [&>svg]:size-3.5 [&>svg]:opacity-70",
              statusClassName
            )}
          >
            {isPending && <LoaderCircle className="mr-1 h-3.5 w-3.5 shrink-0 animate-spin" />}
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            align="end"
            sideOffset={8}
            className="z-[90] min-w-[220px] rounded-xl border-border bg-background p-1.5 shadow-2xl"
          >
            {visibleOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="min-h-10 rounded-lg px-3 py-2.5 pr-8 text-[10px] font-black uppercase tracking-wider focus:bg-lime focus:text-background"
              >
                <span>{option.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <AlertDialog open={Boolean(pendingStatus)} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-background p-5 shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black uppercase">Alterar status do pedido?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6">
              Confirme a troca do pedido <span className="font-black text-lime">{orderNumber}</span> de{" "}
              <span className="font-black text-foreground">{statusLabel}</span> para{" "}
              <span className="font-black text-lime">{pendingStatusLabel}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-border px-5 text-[10px] font-black uppercase">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className="rounded-full bg-lime px-5 text-[10px] font-black uppercase text-background hover:bg-lime/90"
            >
              Confirmar alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
