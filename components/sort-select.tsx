"use client"

import { ChevronDown } from "lucide-react"

export type SortOption = "name-asc" | "price-asc" | "price-desc"

export interface SortSelectProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Nome A-Z" },
  { value: "price-asc", label: "Menor Preço" },
  { value: "price-desc", label: "Maior Preço" },
]

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="min-h-11 bg-graphite border border-border text-[11px] font-bold text-muted-foreground tracking-wider pl-4 pr-8 py-2 rounded-full appearance-none cursor-pointer hover:border-lime/40 hover:text-foreground transition-all duration-300 focus:border-lime/50 focus:shadow-[0_0_10px_rgba(239,255,13,0.1)]"
        aria-label="Ordenar produtos"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
    </div>
  )
}
