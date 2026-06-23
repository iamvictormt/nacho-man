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
    .map((product) => `${product.id}:${quantities[product.id]}`)
    .join(",")

  return (
    <div>
      <input type="hidden" name="items" value={serialized} />
      <p className="mb-3 text-xs font-bold leading-5 text-muted-foreground">Produtos do combo</p>
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-border bg-background p-4">
        {products.map((product) => (
          <label
            key={product.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-graphite/60 px-3 py-2 text-xs"
          >
            <span className="min-w-0 truncate">{product.name}</span>
            <input
              type="text"
              inputMode="numeric"
              value={quantities[product.id] ?? 0}
              onChange={(event) => {
                const quantity = Number(event.target.value.replace(/\D/g, ""))
                setQuantities((current) => ({ ...current, [product.id]: Number.isFinite(quantity) ? quantity : 0 }))
              }}
              className="h-9 w-20 rounded-lg border border-border bg-graphite px-2 text-center"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
