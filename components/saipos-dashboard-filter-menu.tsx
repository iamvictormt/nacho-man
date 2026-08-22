"use client"

import * as React from "react"
import { ChevronDown, SlidersHorizontal, X } from "lucide-react"
import { AdminSelect } from "@/components/admin-form-fields"
import { SaiposPeriodPicker } from "@/components/saipos-period-picker"
import { FilterSubmitButton } from "@/app/admin/saipos/filter-submit-button"
import type { SaiposPeriodMode } from "@/lib/saipos/period"

type SaiposDashboardFilterMenuProps = {
  activeTab: string
  selectedStore: string
  storeOptions: Array<{ value: string; label: string }>
  selectedMode: SaiposPeriodMode
  periodInputs: Record<SaiposPeriodMode, string>
  comparisonPeriodInputs: Record<SaiposPeriodMode, string>
  maxDate: string
  comparisonMaxDate?: string
  comparisonEnabled?: boolean
  lockedMode?: SaiposPeriodMode
}

function getModeLabel(mode: SaiposPeriodMode) {
  if (mode === "day") return "Dia"
  if (mode === "week") return "Semana"
  if (mode === "month") return "Mês"
  return "Ano"
}

function isRadixPortalClick(target: EventTarget | null) {
  if (!(target instanceof Element)) return false

  return Boolean(
    target.closest(
      [
        "[data-radix-popper-content-wrapper]",
        "[data-radix-select-content]",
        "[data-radix-select-viewport]",
        "[data-radix-popover-content]",
        "[data-saipos-period-picker-portal]",
        "[role='listbox']",
        "[role='option']",
      ].join(",")
    )
  )
}

function PeriodModeField({
  selectedMode,
  onModeChange,
}: {
  selectedMode: SaiposPeriodMode
  onModeChange: (mode: SaiposPeriodMode) => void
}) {
  const modes: SaiposPeriodMode[] = ["day", "week", "month", "year"]

  return (
    <fieldset className="grid gap-2.5">
      <legend className="text-xs font-bold leading-4 text-muted-foreground">Escala</legend>
      <div className="grid grid-cols-4 rounded-xl border border-border bg-graphite p-1">
        {modes.map((mode) => (
          <label key={mode} className="relative cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name="mode"
              value={mode}
              checked={mode === selectedMode}
              onChange={() => onModeChange(mode)}
            />
            <span className="flex h-9 cursor-pointer select-none items-center justify-center rounded-lg border border-transparent text-[10px] font-black uppercase text-muted-foreground transition hover:border-lime/35 hover:bg-background hover:text-foreground peer-focus-visible:border-lime peer-focus-visible:outline-2 peer-focus-visible:outline-lime peer-checked:border-lime peer-checked:bg-lime peer-checked:text-background">
              {getModeLabel(mode)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function SaiposDashboardFilterMenu({
  activeTab,
  selectedStore,
  storeOptions,
  selectedMode,
  periodInputs,
  comparisonPeriodInputs,
  maxDate,
  comparisonMaxDate,
  comparisonEnabled = false,
  lockedMode,
}: SaiposDashboardFilterMenuProps) {
  const [mode, setMode] = React.useState(lockedMode ?? selectedMode)
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDetailsElement>(null)
  const effectiveMode = lockedMode ?? mode

  React.useEffect(() => {
    setMode(lockedMode ?? selectedMode)
  }, [lockedMode, selectedMode])

  React.useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (isRadixPortalClick(event.target)) return
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <details ref={menuRef} open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="group relative min-w-0 sm:flex-none">
      <summary
        role="button"
        onClick={(event) => {
          event.preventDefault()
          setOpen((current) => !current)
        }}
        className="inline-flex min-h-12 w-full min-w-0 cursor-pointer select-none list-none items-center justify-center gap-2 overflow-hidden rounded-xl border border-border bg-graphite px-3 py-3 text-xs font-black uppercase text-foreground shadow-[0_10px_28px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:border-lime/50 hover:bg-lime/10 hover:text-lime group-open:border-lime/60 group-open:bg-lime group-open:text-background sm:w-auto sm:px-4 [&::-webkit-details-marker]:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">Filtros</span>
        <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
      </summary>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[70] bg-background/75 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-label="Fechar filtros"
        />
      ) : null}
      <form className="fixed left-1/2 top-1/2 z-[80] grid max-h-[min(720px,calc(100dvh-2rem))] w-[min(430px,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-graphite p-4 shadow-[0_28px_90px_rgba(0,0,0,.55)] sm:p-5">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Filtros do painel</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {comparisonEnabled ? "Ajuste loja e períodos da comparação." : "Ajuste loja, escala e período analisado."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-lime/40 hover:text-lime"
            aria-label="Fechar filtros"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input name="tab" type="hidden" value={activeTab} />
        <AdminSelect name="store" label="Unidade" defaultValue={selectedStore}>
          <option value="all">Todas as lojas</option>
          {storeOptions.map((store) => (
            <option key={store.value} value={store.value}>
              {store.label}
            </option>
          ))}
        </AdminSelect>
        {lockedMode ? (
          <div className="grid gap-2.5">
            <label className="text-xs font-bold leading-4 text-muted-foreground">Escala</label>
            <input name="mode" type="hidden" value={lockedMode} />
            <div className="flex min-h-11 items-center rounded-xl border border-lime/25 bg-lime/10 px-3 text-sm font-black text-lime">
              {getModeLabel(lockedMode)}
            </div>
          </div>
        ) : (
          <PeriodModeField selectedMode={effectiveMode} onModeChange={setMode} />
        )}
        <SaiposPeriodPicker mode={effectiveMode} values={periodInputs} maxDate={maxDate} label="Período analisado" />
        {comparisonEnabled ? (
          <SaiposPeriodPicker
            mode={effectiveMode}
            values={comparisonPeriodInputs}
            maxDate={comparisonMaxDate ?? maxDate}
            label="Comparação"
            fieldNames={{ day: "compareDay", week: "compareWeek", month: "compareMonth", year: "compareYear" }}
          />
        ) : null}
        <FilterSubmitButton />
      </form>
    </details>
  )
}
