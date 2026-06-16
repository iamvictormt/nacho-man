import type { CartItem } from "./cart-store"
import { formatPrice } from "./format"

/** Número de WhatsApp comercial da Nacho Factory (com código do país). */
export const STORE_WHATSAPP_NUMBER = "554797269146"

/**
 * Gera mensagem formatada para envio via WhatsApp com os itens do orçamento.
 * Inclui saudação, lista numerada com nome, quantidade e subtotal estimado por item.
 */
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

/**
 * Constrói a URL do WhatsApp (wa.me) com número e mensagem URL-encoded.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encodedMessage}`
}
