import type { CartItem } from "./cart-store"
import { formatPrice } from "./format"

/** Número de WhatsApp da loja Nacho Man (com código do país) */
export const STORE_WHATSAPP_NUMBER = "5511999999999"

/**
 * Gera mensagem formatada para envio via WhatsApp com os itens do carrinho.
 * Inclui saudação, lista numerada com nome, quantidade e subtotal por item, e total geral.
 */
export function generateWhatsAppMessage(items: CartItem[]): string {
  const greeting = "Olá! Gostaria de fazer o seguinte pedido:"

  const itemLines = items.map((item, index) => {
    const subtotal = item.price * item.quantity
    return `${index + 1}. ${item.name} - Qtd: ${item.quantity} - ${formatPrice(subtotal)}`
  })

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const lines = [greeting, "", ...itemLines, "", `*Total: ${formatPrice(total)}*`]

  return lines.join("\n")
}

/**
 * Constrói a URL do WhatsApp (wa.me) com número e mensagem URL-encoded.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encodedMessage}`
}
