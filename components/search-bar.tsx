"use client"

import { Search, X } from "lucide-react"

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar produtos..."
        className="w-full h-11 pl-10 pr-12 rounded-full bg-graphite border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-lime/50 focus:shadow-[0_0_10px_rgba(230,230,59,0.1)] transition-all duration-300"
        aria-label="Buscar produtos"
      />
      {value.length > 0 && (
        <button
          onClick={() => onChange("")}
          className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {value.length > 0 && value.length < 2 && (
        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          min. 2 chars
        </span>
      )}
    </div>
  )
}
