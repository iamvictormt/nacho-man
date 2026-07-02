"use client"

import { useState } from "react"

type ProductOption = { id: string; name: string }

export function ComboProductSelector({
  products,
  initialQuantities = {},
}: {
  products: ProductOption[]
  initialQuantities?: Record<string, number>
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities)
  const serialized = products
    .filter((product) => (quantities[product.id] ?? 0) > 0)
    .map((product) => product.id)
    .join(",")

  return (
    <div className="min-w-0">
      <input type="hidden" name="options" value={serialized} />
      <p className="mb-3 text-xs font-bold leading-5 text-muted-foreground">Opções disponíveis no combo</p>
      <div className="max-h-64 min-w-0 space-y-3 overflow-y-auto rounded-xl border border-border bg-background p-3 sm:p-4">
        {products.map((product) => (
          <label
            key={product.id}
            className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/60 bg-graphite/60 px-3 py-3 text-xs sm:gap-4"
          >
            <span className="min-w-0 truncate">{product.name}</span>
            <input
              type="checkbox"
              checked={(quantities[product.id] ?? 0) > 0}
              onChange={(event) => {
                setQuantities((current) => ({ ...current, [product.id]: event.target.checked ? 1 : 0 }))
              }}
              className="h-5 w-5 shrink-0 accent-lime"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
