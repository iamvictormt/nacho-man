"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function SaiposAdminExitButton({ compact = false }: { compact?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={
            compact
              ? "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-lime/40 hover:text-lime"
              : "inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-border px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground transition hover:border-lime/40 hover:text-lime"
          }
          aria-label="Voltar ao admin"
        >
          <ArrowLeft className="h-4 w-4" />
          {!compact ? <span>Voltar ao admin</span> : null}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-2xl border-border bg-graphite p-5 shadow-[0_28px_100px_rgba(0,0,0,.55)] sm:max-w-md sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-black uppercase text-foreground sm:text-lg">
            Voltar ao admin?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
            Você vai sair do painel de indicadores e voltar para o administrativo do Nacho Factory.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="min-h-11 rounded-full border-border bg-background px-5 text-[10px] font-black uppercase tracking-wider text-foreground hover:bg-background hover:text-lime">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-lime px-5 text-[10px] font-black uppercase tracking-wider text-background transition hover:bg-lime/90"
            >
              Confirmar saída
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
