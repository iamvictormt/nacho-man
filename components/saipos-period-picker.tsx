"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

type PeriodMode = "day" | "week" | "month" | "year"

type SaiposPeriodPickerProps = {
  mode: PeriodMode
  values: Record<PeriodMode, string>
  maxDate: string
  fieldNames?: Partial<Record<PeriodMode, string>>
  label?: string
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function toPeriodStart(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return new Date()

  return new Date(year, month - 1, day)
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatBrDate(date: Date) {
  return toDateInputValue(date).split("-").reverse().join("/")
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(date: Date) {
  const day = date.getDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1
  return addDays(date, -daysSinceMonday)
}

function toWeekInputValue(date: Date) {
  const day = date.getDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1
  const thursday = addDays(date, 3 - daysSinceMonday)
  const weekYear = thursday.getFullYear()
  const firstThursday = addDays(startOfWeek(new Date(weekYear, 0, 4)), 3)
  const week = Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000) + 1

  return `${weekYear}-W${String(week).padStart(2, "0")}`
}

function parseWeekInputValue(value: string) {
  const match = value.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return new Date()

  const [, rawYear, rawWeek] = match
  const year = Number(rawYear)
  const week = Number(rawWeek)
  const firstWeekStart = startOfWeek(new Date(year, 0, 4))

  return addDays(firstWeekStart, (week - 1) * 7)
}

function getWeekLabel(date: Date) {
  const start = startOfWeek(date)
  const end = addDays(start, 6)

  return `${formatBrDate(start)} a ${formatBrDate(end)}`
}

function parseMonthValue(value: string) {
  const [year, month] = value.split("-").map(Number)
  if (!year || !month) return new Date()
  return new Date(year, month - 1, 1)
}

function getDisplayValue(mode: PeriodMode, value: string) {
  if (mode === "day") return formatBrDate(toPeriodStart(value))
  if (mode === "week") return getWeekLabel(parseWeekInputValue(value))
  if (mode === "month") {
    const date = parseMonthValue(value)
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date)
  }

  return value
}

function getPickerLabel(mode: PeriodMode) {
  if (mode === "day") return "Dia"
  if (mode === "week") return "Semana"
  if (mode === "month") return "Mês"
  return "Ano"
}

export function SaiposPeriodPicker({ mode, values, maxDate, fieldNames, label }: SaiposPeriodPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(values[mode])
  const [mounted, setMounted] = React.useState(false)
  const maxDateObject = toPeriodStart(maxDate)
  const title = label ?? getPickerLabel(mode)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    setValue(values[mode])
  }, [mode, values])

  React.useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[120] grid place-items-center p-3"
            data-saipos-period-picker-portal
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label={`Fechar ${title}`}
            />

            <div className="relative grid max-h-[calc(100dvh-1.5rem)] w-[min(390px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-graphite shadow-[0_28px_90px_rgba(0,0,0,.65)]">
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">{title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{getDisplayValue(mode, value)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-lime/40 hover:text-lime"
                  aria-label={`Fechar ${title}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain">
                {mode === "day" ? (
                  <DayPicker value={value} maxDate={maxDateObject} onChange={setValue} onDone={() => setOpen(false)} />
                ) : null}
                {mode === "week" ? (
                  <WeekPicker value={value} maxDate={maxDateObject} onChange={setValue} onDone={() => setOpen(false)} />
                ) : null}
                {mode === "month" ? (
                  <MonthPicker value={value} maxDate={maxDateObject} onChange={setValue} onDone={() => setOpen(false)} />
                ) : null}
                {mode === "year" ? (
                  <YearPicker value={value} maxDate={maxDateObject} onChange={setValue} onDone={() => setOpen(false)} />
                ) : null}
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className="min-w-0 space-y-2.5">
      <label className="block text-xs font-bold leading-4 text-muted-foreground">{title}</label>
      <input name={fieldNames?.[mode] ?? mode} type="hidden" value={value} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 text-left text-sm font-medium text-foreground shadow-none outline-offset-0 transition hover:border-foreground/20 focus-visible:border-lime focus-visible:outline-2 focus-visible:outline-lime"
      >
        <span className="min-w-0 truncate">{getDisplayValue(mode, value)}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {modal}
    </div>
  )
}

function isSameDate(first: Date, second: Date) {
  return toDateInputValue(first) === toDateInputValue(second)
}

function isBeforeDate(first: Date, second: Date) {
  return toDateInputValue(first) < toDateInputValue(second)
}

function isAfterDate(first: Date, second: Date) {
  return toDateInputValue(first) > toDateInputValue(second)
}

function DayPicker({
  value,
  maxDate,
  onChange,
  onDone,
}: {
  value: string
  maxDate: Date
  onChange: (value: string) => void
  onDone: () => void
}) {
  const selectedDate = toPeriodStart(value)
  const [visibleMonth, setVisibleMonth] = React.useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  return (
    <SimpleCalendar
      visibleMonth={visibleMonth}
      selectedStart={selectedDate}
      maxDate={maxDate}
      onPrevious={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
      onNext={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
      nextDisabled={new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1) > maxDate}
      onSelect={(date) => {
        if (isAfterDate(date, maxDate)) return
        onChange(toDateInputValue(date))
        onDone()
      }}
    />
  )
}

function WeekPicker({
  value,
  maxDate,
  onChange,
  onDone,
}: {
  value: string
  maxDate: Date
  onChange: (value: string) => void
  onDone: () => void
}) {
  const selectedDate = parseWeekInputValue(value)
  const selectedStart = startOfWeek(selectedDate)
  const selectedEnd = addDays(selectedStart, 6)
  const [visibleMonth, setVisibleMonth] = React.useState(new Date(selectedStart.getFullYear(), selectedStart.getMonth(), 1))

  return (
    <div>
      <SimpleCalendar
        visibleMonth={visibleMonth}
        selectedStart={selectedStart}
        selectedEnd={selectedEnd}
        maxDate={maxDate}
        weekMode
        onPrevious={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
        onNext={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
        nextDisabled={new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1) > maxDate}
        onSelect={(date) => {
          if (isAfterDate(date, maxDate)) return
          onChange(toWeekInputValue(date))
          onDone()
        }}
      />
      <p className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
        Semana selecionada: {getWeekLabel(selectedDate)}
      </p>
    </div>
  )
}

function SimpleCalendar({
  visibleMonth,
  selectedStart,
  selectedEnd,
  maxDate,
  weekMode = false,
  nextDisabled,
  onPrevious,
  onNext,
  onSelect,
}: {
  visibleMonth: Date
  selectedStart: Date
  selectedEnd?: Date
  maxDate: Date
  weekMode?: boolean
  nextDisabled?: boolean
  onPrevious: () => void
  onNext: () => void
  onSelect: (date: Date) => void
}) {
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const gridStart = addDays(monthStart, -monthStart.getDay())
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(visibleMonth)

  return (
    <div className="mx-auto w-full max-w-[326px] p-3">
      <PeriodPickerHeader value={monthLabel} onPrevious={onPrevious} onNext={onNext} nextDisabled={nextDisabled} />
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {["dom", "seg", "ter", "qua", "qui", "sex", "sab"].map((day) => (
          <span key={day} className="flex h-8 items-center justify-center text-[11px] font-bold text-muted-foreground">
            {day}
          </span>
        ))}
        {days.map((day) => {
          const outside = day.getMonth() !== visibleMonth.getMonth()
          const disabled = isAfterDate(day, maxDate)
          const inSelectedRange =
            selectedEnd && !isBeforeDate(day, selectedStart) && !isAfterDate(day, selectedEnd)
          const selected = isSameDate(day, selectedStart) || (selectedEnd ? isSameDate(day, selectedEnd) : false)
          const rangeClass = weekMode && inSelectedRange && !selected ? "bg-lime/15 text-foreground" : ""

          return (
            <button
              key={toDateInputValue(day)}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={cn(
                "flex aspect-square min-h-0 w-full items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-25",
                outside ? "text-muted-foreground/55" : "text-foreground",
                rangeClass,
                selected ? "bg-lime font-black text-background" : "hover:bg-lime/10 hover:text-lime"
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MonthPicker({
  value,
  maxDate,
  onChange,
  onDone,
}: {
  value: string
  maxDate: Date
  onChange: (value: string) => void
  onDone: () => void
}) {
  const parsed = parseMonthValue(value)
  const [year, setYear] = React.useState(parsed.getFullYear())
  const maxYear = maxDate.getFullYear()
  const maxMonth = maxDate.getMonth()

  return (
    <div className="mx-auto w-full max-w-[340px] p-4">
      <PeriodPickerHeader value={String(year)} onPrevious={() => setYear((current) => current - 1)} onNext={() => setYear((current) => Math.min(current + 1, maxYear))} nextDisabled={year >= maxYear} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {monthNames.map((month, index) => {
          const optionValue = `${year}-${String(index + 1).padStart(2, "0")}`
          const disabled = year > maxYear || (year === maxYear && index > maxMonth)
          const selected = optionValue === value

          return (
            <button
              key={month}
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange(optionValue)
                onDone()
              }}
              className={cn(
                "h-11 rounded-xl border text-xs font-black uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-35",
                selected
                  ? "border-lime bg-lime text-background"
                  : "border-border bg-background text-muted-foreground hover:border-lime/40 hover:text-foreground"
              )}
            >
              {month}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function YearPicker({
  value,
  maxDate,
  onChange,
  onDone,
}: {
  value: string
  maxDate: Date
  onChange: (value: string) => void
  onDone: () => void
}) {
  const selectedYear = Number(value)
  const maxYear = maxDate.getFullYear()
  const [decadeStart, setDecadeStart] = React.useState(Math.floor(selectedYear / 10) * 10)

  return (
    <div className="mx-auto w-full max-w-[340px] p-4">
      <PeriodPickerHeader
        value={`${decadeStart} - ${decadeStart + 9}`}
        onPrevious={() => setDecadeStart((current) => current - 10)}
        onNext={() => setDecadeStart((current) => Math.min(current + 10, Math.floor(maxYear / 10) * 10))}
        nextDisabled={decadeStart + 10 > maxYear}
      />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 12 }, (_, index) => decadeStart + index - 1).map((year) => {
          const disabled = year > maxYear
          const selected = year === selectedYear

          return (
            <button
              key={year}
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange(String(year))
                onDone()
              }}
              className={cn(
                "h-11 rounded-xl border text-xs font-black uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-35",
                selected
                  ? "border-lime bg-lime text-background"
                  : "border-border bg-background text-muted-foreground hover:border-lime/40 hover:text-foreground"
              )}
            >
              {year}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PeriodPickerHeader({
  value,
  onPrevious,
  onNext,
  nextDisabled,
}: {
  value: string
  onPrevious: () => void
  onNext: () => void
  nextDisabled?: boolean
}) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
      <button
        type="button"
        onClick={onPrevious}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-lime/40 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <strong className="text-center text-sm font-black uppercase tracking-[0.12em]">{value}</strong>
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-lime/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
