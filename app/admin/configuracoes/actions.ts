"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { loginImageSettings, paymentDiscountSettings, storeWhatsAppSetting } from "@/lib/site-settings"
import { sanitizeWhatsAppNumber } from "@/lib/whatsapp"

function sanitizePercentage(value: FormDataEntryValue | null, fallback: string) {
  const normalized = String(value ?? fallback).replace(",", ".")
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return fallback
  return String(Math.min(100, Math.max(0, parsed)))
}

export async function updateLoginImagesAction(formData: FormData) {
  await requireAdmin()

  await Promise.all(
    [
      ...loginImageSettings.map((setting) => ({
        key: setting.key,
        value: String(formData.get(setting.key) ?? "").trim() || setting.fallback,
      })),
      {
        key: storeWhatsAppSetting.key,
        value: sanitizeWhatsAppNumber(formData.get(storeWhatsAppSetting.key)),
      },
      {
        key: paymentDiscountSettings.pix.key,
        value: sanitizePercentage(formData.get(paymentDiscountSettings.pix.key), paymentDiscountSettings.pix.fallback),
      },
      {
        key: paymentDiscountSettings.card.key,
        value: sanitizePercentage(formData.get(paymentDiscountSettings.card.key), paymentDiscountSettings.card.fallback),
      },
    ].map((setting) =>
      prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    )
  )

  revalidatePath("/admin/configuracoes")
  revalidatePath("/login")
  revalidatePath("/")
  revalidatePath("/marketplace")
  revalidatePath("/marketplace/pedidos")
  revalidatePath("/api/marketplace/pedidos")
}
