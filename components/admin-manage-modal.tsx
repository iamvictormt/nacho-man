"use client"

import { useEffect, useState } from "react"
import { ChevronRight, X } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AdminManageModal({
  id,
  title,
  description,
  ariaLabel,
  children,
  size = "md",
}: {
  id: string
  title: string
  description?: string
  ariaLabel: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function close(event: Event) {
      if ((event as CustomEvent<string>).detail === id) setOpen(false)
    }
    window.addEventListener("admin-modal-success", close)
    return () => window.removeEventListener("admin-modal-success", close)
  }, [id])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          title="Gerenciar"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-lime/30 bg-lime/[0.06] px-4 text-lime transition hover:border-lime hover:bg-lime hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 sm:col-span-2 xl:col-span-1 xl:h-11 xl:w-11 xl:justify-self-end xl:rounded-full xl:px-0"
        >
          <span className="text-[9px] font-black uppercase tracking-wider xl:sr-only">Gerenciar</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={`max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] overflow-y-auto border-border bg-background p-0 sm:max-h-[90vh] ${
          size === "sm"
            ? "sm:max-w-lg"
            : size === "lg"
              ? "sm:max-w-3xl"
              : size === "xl"
                ? "sm:max-w-5xl"
                : "sm:max-w-2xl"
        }`}
      >
        <DialogHeader className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
          <DialogTitle className="pr-8 text-lg font-black uppercase sm:text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-graphite px-3 text-[9px] font-black uppercase tracking-wider text-foreground/70 transition hover:border-lime/40 hover:text-lime sm:right-4 sm:top-4"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Fechar</span>
            </button>
          </DialogClose>
        </DialogHeader>
        <div className="px-4 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
