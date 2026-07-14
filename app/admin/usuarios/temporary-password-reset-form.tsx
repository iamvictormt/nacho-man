"use client"

import { useActionState, useState } from "react"
import { Copy, LoaderCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  resetUserTemporaryPasswordAction,
  type TemporaryPasswordResetState,
} from "@/app/admin/usuarios/actions"
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

const initialState: TemporaryPasswordResetState = {}

export function TemporaryPasswordResetForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(resetUserTemporaryPasswordAction, initialState)
  const [copied, setCopied] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function copyPassword() {
    if (!state.temporaryPassword) return

    try {
      await navigator.clipboard.writeText(state.temporaryPassword)
      setCopied(true)
      toast.success("Senha temporária copiada.")
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Não foi possível copiar a senha.")
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-300 px-5 text-[10px] font-black uppercase text-background transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {pending ? "GERANDO..." : "GERAR SENHA TEMPORÁRIA"}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar senha temporária?</AlertDialogTitle>
            <AlertDialogDescription>
              A senha atual deste usuário deixará de funcionar. Uma nova senha temporária será exibida uma única vez
              para você copiar e repassar ao usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <form
              action={async (formData) => {
                await formAction(formData)
                setConfirmOpen(false)
              }}
            >
              <input type="hidden" name="id" value={userId} />
              <button
                type="submit"
                disabled={pending}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-amber-300 px-5 text-[10px] font-black uppercase text-background transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {pending ? "GERANDO..." : "CONFIRMAR"}
              </button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {state.error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200">
          {state.error}
        </p>
      )}
      {state.temporaryPassword && (
        <div className="rounded-xl border border-amber-300/25 bg-background p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Senha temporária gerada
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-h-11 flex-1 rounded-lg border border-border bg-graphite px-3 py-3 font-sans text-sm font-black tracking-normal text-lime">
              {state.temporaryPassword}
            </code>
            <button
              type="button"
              onClick={copyPassword}
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-[10px] font-black uppercase text-foreground transition hover:border-lime/40 hover:text-lime"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copiada" : "Copiar"}
            </button>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-amber-100/75">
            Passe esta senha ao usuário. Ela só aparece aqui agora; depois será armazenada apenas criptografada.
          </p>
        </div>
      )}
    </div>
  )
}
