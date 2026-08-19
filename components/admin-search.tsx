"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { LoaderCircle, Search } from "lucide-react"

export function AdminSearch({
  containerId,
  placeholder = "Buscar...",
  queryParam,
}: {
  containerId: string
  placeholder?: string
  queryParam?: string
}) {
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryValue = queryParam ? (searchParams.get(queryParam) ?? "") : ""
  const [value, setValue] = useState(queryValue)

  useEffect(() => {
    if (queryParam) setValue(queryValue)
  }, [queryParam, queryValue])

  useEffect(() => {
    if (!queryParam) return

    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams(window.location.search)
      const normalizedValue = value.trim()
      const currentValue = nextParams.get(queryParam) ?? ""

      if (normalizedValue === currentValue) return

      nextParams.delete("page")
      if (normalizedValue) nextParams.set(queryParam, normalizedValue)
      else nextParams.delete(queryParam)

      const query = nextParams.toString()
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [pathname, queryParam, router, searchParams, value])

  function search(value: string) {
    if (queryParam) {
      setValue(value)
      return
    }

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
      ) : pending ? (
        <LoaderCircle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-lime" />
      ) : (
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        type="text"
        value={queryParam ? value : undefined}
        onChange={(event) => search(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-border bg-graphite pl-11 pr-4 text-sm"
      />
    </label>
  )
}
