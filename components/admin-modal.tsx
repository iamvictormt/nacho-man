"use client"

import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AdminModal({
  id,
  triggerLabel,
  triggerClassName,
  title,
  description,
  children,
  size = "md",
}: {
  id: string
  triggerLabel: string
  triggerClassName: string
  title: string
  description?: string
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
          className={cn(
            "group transition hover:shadow-[0_0_24px_rgba(239,255,13,.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60",
            triggerClassName
          )}
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" /> {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={`grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden border-border bg-background p-0 sm:max-h-[90vh] [&>*]:min-w-0 ${
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
        <div className="min-w-0 overflow-y-auto px-4 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
