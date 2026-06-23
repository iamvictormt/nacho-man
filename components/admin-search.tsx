"use client"

import { useState } from "react"
import { LoaderCircle, Search } from "lucide-react"

export function AdminSearch({ containerId, placeholder = "Buscar..." }: { containerId: string; placeholder?: string }) {
  const [loading, setLoading] = useState(false)

  function search(value: string) {
    setLoading(true)
    const normalized = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>(`#${containerId} [data-search]`).forEach((element) => {
        const content = (element.dataset.search ?? "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
        element.hidden = !content.includes(normalized)
      })
      setLoading(false)
    })
  }

  return (
    <label className="relative block w-full sm:max-w-sm">
      {loading ? (
        <LoaderCircle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-lime" />
      ) : (
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        type="text"
        onChange={(event) => search(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-border bg-graphite pl-11 pr-4 text-sm"
      />
    </label>
  )
}
