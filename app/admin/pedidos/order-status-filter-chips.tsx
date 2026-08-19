"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { OrderStatus } from "@prisma/client"

type StatusOption = {
  value: OrderStatus
  label: string
}

export function OrderStatusFilterChips({
  selectedStatus,
  statusCounts,
  statusOptions,
  total,
}: {
  selectedStatus: OrderStatus | null
  statusCounts: Record<string, number>
  statusOptions: StatusOption[]
  total: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState<OrderStatus | null>(selectedStatus)

  useEffect(() => {
    setOptimisticStatus(selectedStatus)
  }, [selectedStatus])

  const visibleStatuses = useMemo(
    () => statusOptions.filter((option) => (statusCounts[option.value] ?? 0) > 0 || optimisticStatus === option.value),
    [optimisticStatus, statusCounts, statusOptions]
  )

  function applyStatus(status: OrderStatus | null) {
    if (status === optimisticStatus && status === selectedStatus) return

    setOptimisticStatus(status)
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("page")
    if (status) nextParams.set("status", status)
    else nextParams.delete("status")

    const query = nextParams.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filtrar pedidos por status atual" aria-busy={isPending}>
      <OrderStatusFilterButton
        active={!optimisticStatus}
        label="Todos"
        count={total}
        onClick={() => applyStatus(null)}
      />
      {visibleStatuses.map((option) => (
        <OrderStatusFilterButton
          key={option.value}
          active={optimisticStatus === option.value}
          label={option.label}
          count={statusCounts[option.value] ?? 0}
          onClick={() => applyStatus(option.value)}
        />
      ))}
    </nav>
  )
}

function OrderStatusFilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-wider transition ${
        active
          ? "border-lime bg-lime text-background"
          : "border-border bg-graphite text-muted-foreground hover:border-lime/40 hover:text-lime"
      }`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[9px] ${active ? "bg-background/15" : "bg-background"}`}>
        {count}
      </span>
    </button>
  )
}
