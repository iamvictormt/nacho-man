"use client"

import * as React from "react"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
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
  comparisonEnabled?: boolean
  lockedMode?: SaiposPeriodMode
}

function getModeLabel(mode: SaiposPeriodMode) {
  if (mode === "day") return "Dia"
  if (mode === "week") return "Semana"
  if (mode === "month") return "Mês"
  return "Ano"
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
  comparisonEnabled = false,
  lockedMode,
}: SaiposDashboardFilterMenuProps) {
  const [mode, setMode] = React.useState(lockedMode ?? selectedMode)
  const effectiveMode = lockedMode ?? mode

  React.useEffect(() => {
    setMode(lockedMode ?? selectedMode)
  }, [lockedMode, selectedMode])

  return (
    <details className="group relative">
      <summary
        role="button"
        className="inline-flex min-h-12 cursor-pointer select-none list-none items-center gap-2 rounded-xl border border-border bg-graphite px-4 py-3 text-xs font-black uppercase text-foreground shadow-[0_10px_28px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:border-lime/50 hover:bg-lime/10 hover:text-lime group-open:border-lime/60 group-open:bg-lime group-open:text-background [&::-webkit-details-marker]:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
      </summary>
      <form className="absolute right-0 top-14 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-4 rounded-2xl border border-border bg-background p-4 shadow-2xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Contexto</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {comparisonEnabled ? "Ajuste loja e períodos da comparação." : "Ajuste loja, escala e período analisado."}
          </p>
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
            maxDate={maxDate}
            label="Comparação"
            fieldNames={{ day: "compareDay", week: "compareWeek", month: "compareMonth", year: "compareYear" }}
          />
        ) : null}
        <FilterSubmitButton />
      </form>
    </details>
  )
}
