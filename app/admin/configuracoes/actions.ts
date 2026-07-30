"use server"

import { revalidatePath, updateTag } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  loginImageSettings,
  orderMessageSettings,
  paymentDiscountSettings,
  SITE_SETTINGS_CACHE_TAG,
  storeWhatsAppSetting,
} from "@/lib/site-settings"
import { sanitizeWhatsAppNumber } from "@/lib/whatsapp"

function sanitizePercentage(value: FormDataEntryValue | null, fallback: string) {
  const normalized = String(value ?? fallback).replace(",", ".")
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return fallback
  return String(Math.min(100, Math.max(0, parsed)))
}

function checkboxValue(formData: FormData, key: string) {
  return formData.has(key) ? "true" : "false"
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
        key: orderMessageSettings.whatsapp.key,
        value:
          String(formData.get(orderMessageSettings.whatsapp.key) ?? "").trim() ||
          orderMessageSettings.whatsapp.fallback,
      },
      {
        key: orderMessageSettings.emailSubject.key,
        value:
          String(formData.get(orderMessageSettings.emailSubject.key) ?? "").trim() ||
          orderMessageSettings.emailSubject.fallback,
      },
      {
        key: orderMessageSettings.emailMessage.key,
        value:
          String(formData.get(orderMessageSettings.emailMessage.key) ?? "").trim() ||
          orderMessageSettings.emailMessage.fallback,
      },
      {
        key: paymentDiscountSettings.pix.key,
        value: sanitizePercentage(formData.get(paymentDiscountSettings.pix.key), paymentDiscountSettings.pix.fallback),
      },
      {
        key: paymentDiscountSettings.pix.franchiseeOnlyKey,
        value: checkboxValue(formData, paymentDiscountSettings.pix.franchiseeOnlyKey),
      },
      {
        key: paymentDiscountSettings.card.key,
        value: sanitizePercentage(
          formData.get(paymentDiscountSettings.card.key),
          paymentDiscountSettings.card.fallback
        ),
      },
      {
        key: paymentDiscountSettings.card.franchiseeOnlyKey,
        value: checkboxValue(formData, paymentDiscountSettings.card.franchiseeOnlyKey),
      },
      {
        key: paymentDiscountSettings.boleto.key,
        value: sanitizePercentage(
          formData.get(paymentDiscountSettings.boleto.key),
          paymentDiscountSettings.boleto.fallback
        ),
      },
      {
        key: paymentDiscountSettings.boleto.franchiseeOnlyKey,
        value: checkboxValue(formData, paymentDiscountSettings.boleto.franchiseeOnlyKey),
      },
    ].map((setting) =>
      prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    )
  )

  updateTag(SITE_SETTINGS_CACHE_TAG)
  revalidatePath("/admin/configuracoes")
  revalidatePath("/login")
  revalidatePath("/")
  revalidatePath("/marketplace")
  revalidatePath("/marketplace/pedidos")
  revalidatePath("/api/marketplace/pedidos")
}
