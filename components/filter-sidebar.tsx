"use client"

import { X } from "lucide-react"
import { allProducts } from "@/lib/products"

const CATEGORIES = ["CONGELADO", "SECO"] as const
const SUBCATEGORIES = [
  "Carnes",
  "Molhos",
  "Temperos",
  "Kits",
  "Doces",
  "Acompanhamentos",
  "Food Service",
  "Vegetariano",
] as const

// Extract unique non-null tags from products
const ALL_TAGS = [...new Set(allProducts.map((p) => p.tag).filter((t): t is string => t !== null))]

export interface FilterSidebarProps {
  category: string | null
  subcategory: string | null
  tags: string[]
  onCategoryChange: (category: string | null) => void
  onSubcategoryChange: (subcategory: string | null) => void
  onTagsChange: (tags: string[]) => void
  onClearAll: () => void
}

export function FilterSidebar({
  category,
  subcategory,
  tags,
  onCategoryChange,
  onSubcategoryChange,
  onTagsChange,
  onClearAll,
}: FilterSidebarProps) {
  const hasActiveFilters = category !== null || subcategory !== null || tags.length > 0

  function handleTagToggle(tag: string) {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag))
    } else {
      onTagsChange([...tags, tag])
    }
  }

  return (
    <aside className="space-y-6">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black tracking-wider text-foreground uppercase">
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex min-h-11 items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-lime transition-colors"
            aria-label="Limpar todos os filtros"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Categoria
        </h4>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(category === cat ? null : cat)}
              className={`min-h-11 px-4 py-2 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 ${
                category === cat
                  ? "bg-lime text-background shadow-[0_0_15px_rgba(230,230,59,0.3)]"
                  : "bg-graphite border border-border text-muted-foreground hover:border-lime/40 hover:text-foreground"
              }`}
              aria-pressed={category === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory filter */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Subcategoria
        </h4>
        <div className="flex flex-wrap gap-2">
          {SUBCATEGORIES.map((sub) => (
            <button
              key={sub}
              onClick={() => onSubcategoryChange(subcategory === sub ? null : sub)}
              className={`min-h-11 px-3 py-2 rounded-full text-[10px] font-bold tracking-wide transition-all duration-300 ${
                subcategory === sub
                  ? "bg-purple-medium text-white shadow-[0_0_15px_rgba(91,45,130,0.4)]"
                  : "bg-graphite border border-border text-muted-foreground hover:border-purple-medium/40 hover:text-foreground"
              }`}
              aria-pressed={subcategory === sub}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Tags filter */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`min-h-11 px-3 py-2 rounded-full text-[10px] font-bold tracking-wide transition-all duration-300 ${
                tags.includes(tag)
                  ? "bg-lime/20 border border-lime text-lime"
                  : "bg-graphite border border-border text-muted-foreground hover:border-lime/30 hover:text-foreground"
              }`}
              aria-pressed={tags.includes(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
