"use client"

import * as React from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { AdminField } from "@/components/admin-form-fields"
import { cn } from "@/lib/utils"

type CloudinaryUploadResponse = {
  url?: string
  error?: string
}

export function AdminProductImageUpload({
  name = "image",
  label = "Imagem do produto",
  defaultValue = "",
  folder = "produtos",
  readyMessage = "Imagem pronta para salvar.",
  emptyMessage = "Nenhuma imagem selecionada.",
}: {
  name?: string
  label?: string
  defaultValue?: string | null
  folder?: "produtos" | "login"
  readyMessage?: string
  emptyMessage?: string
}) {
  const [imageUrl, setImageUrl] = React.useState(defaultValue ?? "")
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const body = new FormData()
    body.append("file", file)
    body.append("folder", folder)

    try {
      const response = await fetch("/api/admin/cloudinary-upload", {
        method: "POST",
        body,
      })
      const data = (await response.json()) as CloudinaryUploadResponse
      if (!response.ok || data.error) throw new Error(data.error ?? "Falha ao enviar imagem.")
      setImageUrl(data.url ?? "")
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar imagem.")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <AdminField label={label} error={error ?? undefined}>
      <input type="hidden" name={name} value={imageUrl} />
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <label
          className={cn(
            "group relative flex min-h-72 cursor-pointer items-center justify-center overflow-hidden bg-graphite transition hover:bg-graphite/80",
            !imageUrl && "border-b border-dashed border-border",
            isUploading && "pointer-events-none opacity-70"
          )}
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-background/0 transition group-hover:bg-background/45" />
              <span className="relative flex h-11 items-center justify-center gap-2 rounded-full bg-background/90 px-4 text-[10px] font-black uppercase text-lime opacity-0 shadow-xl transition group-hover:opacity-100">
                <ImagePlus className="h-4 w-4" />
                Trocar imagem
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              </span>
              <span className="mt-4 text-xs font-black uppercase text-foreground">
                {isUploading ? "Enviando imagem" : "Clique para enviar"}
              </span>
              <span className="mt-1 text-[10px] font-bold text-muted-foreground">PNG, JPG ou WEBP</span>
            </span>
          )}
          <input type="file" accept="image/*" className="sr-only" disabled={isUploading} onChange={uploadImage} />
        </label>
        <div className="flex min-h-14 flex-col gap-3 px-4 py-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <p className="min-w-0 truncate text-[10px] font-bold text-muted-foreground">
            {imageUrl ? readyMessage : emptyMessage}
          </p>
          {imageUrl && (
            <button
              type="button"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-red-400/30 px-3 text-[9px] font-black uppercase text-red-300 transition hover:border-red-300"
              onClick={() => setImageUrl("")}
            >
              <X className="h-3.5 w-3.5" /> Remover
            </button>
          )}
        </div>
      </div>
    </AdminField>
  )
}
