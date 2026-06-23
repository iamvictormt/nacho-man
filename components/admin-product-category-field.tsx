"use client"

import * as React from "react"
import { AdminInput, AdminSelect } from "@/components/admin-form-fields"

const NEW_CATEGORY_VALUE = "__new__"

export function AdminProductCategoryField({
  categories,
  defaultValue = "",
}: {
  categories: { id: string; name: string }[]
  defaultValue?: string
}) {
  const [selectedCategory, setSelectedCategory] = React.useState(defaultValue)
  const isNewCategory = selectedCategory === NEW_CATEGORY_VALUE

  return (
    <div className="space-y-4">
      <AdminSelect
        name="category"
        label="Categoria"
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        placeholder="Selecione"
        required
      >
        <option value="">Selecione</option>
        {categories.map((category) => (
          <option key={category.id} value={category.name}>
            {category.name}
          </option>
        ))}
        <option value={NEW_CATEGORY_VALUE}>Nova categoria</option>
      </AdminSelect>
      {isNewCategory && <AdminInput name="newCategory" label="Nome da nova categoria" required />}
    </div>
  )
}
