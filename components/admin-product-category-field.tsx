"use client"

import * as React from "react"
import { Edit3, LoaderCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AdminInput, AdminSelect } from "@/components/admin-form-fields"
import { deleteCategoryAction, updateCategoryAction } from "@/app/admin/produtos/actions"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const NEW_CATEGORY_VALUE = "__new__"

export function AdminProductCategoryField({
  categories,
  defaultValue = "",
}: {
  categories: { id: string; name: string; _count?: { products: number } }[]
  defaultValue?: string
}) {
  const [selectedCategory, setSelectedCategory] = React.useState(defaultValue)
  const [editing, setEditing] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const selectedCategoryItem = categories.find((category) => category.name === selectedCategory)
  const productCount = selectedCategoryItem?._count?.products ?? 0
  const isNewCategory = selectedCategory === NEW_CATEGORY_VALUE
  const canManageCategory = Boolean(selectedCategoryItem) && !isNewCategory

  function reloadAfterSuccess(message: string) {
    toast.success(message)
    window.setTimeout(() => window.location.reload(), 300)
  }

  function updateCategory(name: string) {
    if (!selectedCategoryItem || pending) return
    const normalizedName = name.trim()
    if (!normalizedName) {
      toast.error("Informe o nome da categoria.")
      return
    }

    const formData = new FormData()
    formData.set("id", selectedCategoryItem.id)
    formData.set("name", normalizedName)

    startTransition(async () => {
      try {
        await updateCategoryAction(formData)
        setEditing(false)
        reloadAfterSuccess("Categoria atualizada.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a categoria.")
      }
    })
  }

  function deleteCategory() {
    if (!selectedCategoryItem || pending || productCount > 0) return

    const formData = new FormData()
    formData.set("id", selectedCategoryItem.id)

    startTransition(async () => {
      try {
        await deleteCategoryAction(formData)
        setDeleting(false)
        reloadAfterSuccess("Categoria excluída.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível excluir a categoria.")
      }
    })
  }

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
      {canManageCategory && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border px-3 text-[9px] font-black uppercase tracking-wider text-foreground/70 transition hover:border-lime/35 hover:text-lime"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Editar categoria
          </button>
          <button
            type="button"
            onClick={() => setDeleting(true)}
            disabled={productCount > 0}
            title={productCount > 0 ? "Só é possível excluir categorias sem produtos." : "Excluir categoria"}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-red-400/25 px-3 text-[9px] font-black uppercase tracking-wider text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
          {productCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {productCount} {productCount === 1 ? "produto vinculado" : "produtos vinculados"}
            </span>
          )}
        </div>
      )}
      {isNewCategory && <AdminInput name="newCategory" label="Nome da nova categoria" required />}
      {selectedCategoryItem && (
        <>
          <EditCategoryDialog
            key={selectedCategoryItem.id}
            name={selectedCategoryItem.name}
            open={editing}
            pending={pending}
            onOpenChange={setEditing}
            onSave={updateCategory}
          />
          <AlertDialog open={deleting} onOpenChange={setDeleting}>
            <AlertDialogContent className="w-[calc(100%-1rem)] border-border bg-background p-5 sm:max-w-md sm:p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black uppercase">Excluir categoria?</AlertDialogTitle>
                <AlertDialogDescription className="leading-6">
                  Esta ação remove a categoria {selectedCategoryItem.name}. Só é permitido excluir categorias sem
                  produtos cadastrados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
                <button
                  type="button"
                  onClick={deleteCategory}
                  disabled={pending || productCount > 0}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-500 px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {pending ? "Processando..." : "Excluir"}
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

function EditCategoryDialog({
  name,
  open,
  pending,
  onOpenChange,
  onSave,
}: {
  name: string
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
}) {
  const [value, setValue] = React.useState(name)

  React.useEffect(() => {
    if (open) setValue(name)
  }, [name, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] border-border bg-background p-5 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-black uppercase">Editar categoria</DialogTitle>
          <DialogDescription>Renomeie a categoria usada nos produtos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="category-name" className="block text-xs font-bold text-muted-foreground">
            Nome
          </label>
          <input
            id="category-name"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground outline-offset-0 transition placeholder:text-muted-foreground/70 hover:border-foreground/20 focus-visible:border-lime focus-visible:outline-2 focus-visible:outline-lime"
          />
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-foreground/70 transition hover:border-lime/35 hover:text-lime disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(value)}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-lime px-4 text-sm font-black text-background disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
