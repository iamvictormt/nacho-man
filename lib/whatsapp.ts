import type { CartItem } from "./cart-store"
import { formatPrice } from "./format"

export const DEFAULT_STORE_WHATSAPP_NUMBER = "554797269146"
export const STORE_WHATSAPP_NUMBER = DEFAULT_STORE_WHATSAPP_NUMBER

export function sanitizeWhatsAppNumber(value: FormDataEntryValue | string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "")
  if (!digits) return DEFAULT_STORE_WHATSAPP_NUMBER
  return digits.startsWith("55") ? digits : `55${digits}`
}

export function formatWhatsAppDisplay(number: string): string {
  const local = number.replace(/^55/, "")
  const ddd = local.slice(0, 2)
  const subscriber = local.slice(2)
  const first = subscriber.slice(0, Math.max(4, subscriber.length - 4))
  const last = subscriber.slice(-4)
  return `+55 ${ddd} ${first}-${last}`
}

export function generateWhatsAppMessage(items: CartItem[]): string {
  const greeting = "Olá! Gostaria de solicitar um orçamento com os seguintes itens:"

  const itemLines = items.map((item, index) => {
    const subtotal = item.price * item.quantity
    const unit = item.priceUnit ? ` ${item.priceUnit}` : " un."
    return `${index + 1}. ${item.name} - Qtd: ${item.quantity}${unit} - estimado: ${formatPrice(subtotal)}`
  })

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const lines = [
    greeting,
    "",
    ...itemLines,
    "",
    `*Total estimado: ${formatPrice(total)}*`,
    "",
    "Podem confirmar disponibilidade, pedido mínimo, entrega e condições comerciais?",
  ]

  return lines.join("\n")
}

export function buildWhatsAppUrl(phone: string, message = ""): string {
  const encodedMessage = encodeURIComponent(message)
  return message ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/${phone}`
}

