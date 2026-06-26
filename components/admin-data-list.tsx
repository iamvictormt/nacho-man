import * as React from "react"
import { cn } from "@/lib/utils"

export function AdminDataList({
  headers,
  template,
  children,
  className,
  isEmpty = false,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription = "Quando houver itens cadastrados, eles aparecerão nesta tabela.",
}: {
  headers: string[]
  template: string
  children: React.ReactNode
  className?: string
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-background", className)}>
      <div
        className="hidden gap-5 border-b border-border bg-graphite px-5 py-3 xl:grid"
        style={{ gridTemplateColumns: template }}
      >
        {headers.map((header, index) => (
          <p
            key={`${header}-${index}`}
            className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground"
          >
            {header}
          </p>
        ))}
      </div>
      <div className="divide-y divide-border">
        {isEmpty ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-5 py-12 text-center">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">{emptyTitle}</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

export function AdminDataRow({
  template,
  search,
  inactive,
  children,
}: {
  template: string
  search?: string
  inactive?: boolean
  children: React.ReactNode
}) {
  return (
    <article
      data-search={search}
      className={cn(
        "group relative grid gap-4 px-4 py-5 transition hover:bg-graphite/55 sm:grid-cols-2 sm:px-5 xl:items-center xl:gap-5 xl:[grid-template-columns:var(--admin-list-template)]",
        inactive && "opacity-65"
      )}
      style={{ "--admin-list-template": template } as React.CSSProperties}
    >
      <span className={cn("absolute inset-y-4 left-0 w-0.5 rounded-full", inactive ? "bg-red-400" : "bg-lime")} />
      {children}
    </article>
  )
}

export function AdminDataLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground xl:hidden">{children}</p>
}
