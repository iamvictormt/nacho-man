"use client"

import { useState } from "react"
import { AdminSelect } from "@/components/admin-form-fields"

type ComboAudience = "FRANCHISEE" | "PUBLIC"
type ProductOption = { id: string; name: string; audience: ComboAudience }

export function ComboProductSelector({
  products,
  initialQuantities = {},
  initialAudience = "FRANCHISEE",
}: {
  products: ProductOption[]
  initialQuantities?: Record<string, number>
  initialAudience?: ComboAudience
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities)
  const [audience, setAudience] = useState<ComboAudience>(initialAudience)
  const visibleProducts = products.filter((product) => product.audience === audience)
  const productAudienceById = new Map(products.map((product) => [product.id, product.audience]))
  const serialized = visibleProducts
    .filter((product) => (quantities[product.id] ?? 0) > 0)
    .map((product) => product.id)
    .join(",")

  function handleAudienceChange(value: string) {
    const nextAudience = value as ComboAudience

    setAudience(nextAudience)
    setQuantities((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([productId, quantity]) => quantity > 0 && productAudienceById.get(productId) === nextAudience,
        ),
      ),
    )
  }

  return (
    <div className="min-w-0 space-y-4">
      <AdminSelect
        name="audience"
        label="Público alvo"
        value={audience}
        onValueChange={handleAudienceChange}
      >
        <option value="FRANCHISEE">Franqueados</option>
        <option value="PUBLIC">Não franqueados</option>
      </AdminSelect>
      <div className="min-w-0">
        <input type="hidden" name="options" value={serialized} />
        <p className="mb-3 text-xs font-bold leading-5 text-muted-foreground">Opções disponíveis no combo</p>
        <div className="max-h-64 min-w-0 space-y-3 overflow-y-auto rounded-xl border border-border bg-background p-3 sm:p-4">
          {visibleProducts.map((product) => (
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
          {visibleProducts.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-xs font-semibold text-muted-foreground">
              Nenhum produto ativo para este catalogo.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
