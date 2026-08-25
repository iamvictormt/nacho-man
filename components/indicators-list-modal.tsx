"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export type IndicatorsListModalColumn = {
  key: string
  label: string
  align?: "left" | "right"
  highlight?: boolean
}

export type IndicatorsListModalRow = {
  id: string
  cells: Record<string, string>
}

type IndicatorsListModalProps = {
  title: string
  description?: string
  triggerLabel?: string
  columns: IndicatorsListModalColumn[]
  rows: IndicatorsListModalRow[]
  pageSize?: number
}

export function IndicatorsListModal({
  title,
  description,
  triggerLabel = "Ver tudo",
  columns,
  rows,
  pageSize = 10,
}: IndicatorsListModalProps) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const pageRows = useMemo(() => rows.slice(page * pageSize, page * pageSize + pageSize), [page, pageSize, rows])
  const primaryColumn = columns[0]
  const detailColumns = columns.slice(1)

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setPage(0)
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-full border-lime/20 bg-lime/10 px-3 text-xs font-black text-lime hover:bg-lime/15 hover:text-lime"
        >
          <ListFilter className="h-4 w-4" />
          {triggerLabel}
          <span className="rounded-full bg-lime px-1.5 py-0.5 text-[10px] leading-none text-background">
            {rows.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] w-[calc(100%-1rem)] overflow-hidden border-border bg-graphite p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-4 py-4 sm:px-5">
          <DialogTitle className="text-base font-black uppercase">{title}</DialogTitle>
          <DialogDescription>{description ?? `${rows.length} registros encontrados`}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto px-4 py-4 sm:px-5 sm:py-0">
          <div className="grid gap-3 sm:hidden">
            {pageRows.map((row) => (
              <article key={row.id} className="rounded-xl border border-border bg-background/70 p-3">
                {primaryColumn ? (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                      {primaryColumn.label}
                    </p>
                    <strong
                      className={`mt-1 block break-words text-sm leading-5 ${
                        primaryColumn.highlight ? "text-lime" : "text-foreground"
                      }`}
                    >
                      {row.cells[primaryColumn.key] ?? ""}
                    </strong>
                  </div>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {detailColumns.map((column) => (
                    <div key={column.key} className="min-w-0 rounded-lg border border-border bg-graphite/60 p-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-muted-foreground">
                        {column.label}
                      </p>
                      <strong
                        className={`mt-1 block break-words text-sm leading-5 ${
                          column.highlight ? "text-lime" : "text-foreground"
                        }`}
                      >
                        {row.cells[column.key] ?? ""}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <table className="hidden w-full min-w-[680px] text-left text-sm sm:table">
            <thead className="sticky top-0 z-10 border-b border-border bg-graphite text-xs uppercase text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`py-3 ${column.align === "right" ? "text-right" : "text-left"}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`py-3 ${column.align === "right" ? "text-right" : "text-left"} ${
                        column.highlight ? "font-black text-lime" : ""
                      }`}
                    >
                      {row.cells[column.key] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={page >= totalPages - 1}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
