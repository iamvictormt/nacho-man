import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

type CloudinaryUploadResponse = {
  secure_url?: string
  url?: string
  error?: { message?: string }
}

export async function POST(request: Request) {
  await requireAdmin()

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET." },
      { status: 500 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie uma imagem válida." }, { status: 400 })
  }

  const uploadFolder = String(formData.get("folder") ?? "produtos")
  const folder = uploadFolder === "login" ? "nacho-man/login" : "nacho-man/produtos"
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = createHash("sha1").update(signaturePayload).digest("hex")

  const cloudinaryFormData = new FormData()
  cloudinaryFormData.append("file", file)
  cloudinaryFormData.append("folder", folder)
  cloudinaryFormData.append("timestamp", timestamp)
  cloudinaryFormData.append("api_key", apiKey)
  cloudinaryFormData.append("signature", signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: cloudinaryFormData,
  })
  const data = (await response.json()) as CloudinaryUploadResponse

  if (!response.ok || data.error) {
    return NextResponse.json({ error: data.error?.message ?? "Falha ao enviar imagem." }, { status: response.status })
  }

  return NextResponse.json({ url: data.secure_url ?? data.url })
}

