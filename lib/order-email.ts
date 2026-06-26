import "server-only"

import { formatMoneyFromCents } from "@/lib/money"
import { sendMail } from "@/lib/email"

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  AWAITING_SERVICE: "Aguardando atendimento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  PICKING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

type OrderEmailItem = {
  name: string
  unit: string
  quantity: number
  totalInCents: number
}

type OrderConfirmationEmailInput = {
  to: string
  customerName: string
  franchiseName: string
  orderNumber: string
  status: string
  paymentMethod: "PIX" | "CARD" | string
  items: OrderEmailItem[]
  subtotalInCents: number
  promotionDiscountInCents: number
  couponDiscountInCents: number
  pixDiscountInCents: number
  totalInCents: number
  notes?: string | null
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildOrderConfirmationHtml(input: OrderConfirmationEmailInput) {
  const statusLabel = statusLabels[input.status] ?? input.status
  const paymentLabel = input.paymentMethod === "PIX" ? "PIX" : "Cartão"
  const discountRows = [
    input.promotionDiscountInCents > 0
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Descontos</td><td align="right" style="padding:6px 0;color:#fca5a5;font-weight:800;">-${formatMoneyFromCents(input.promotionDiscountInCents)}</td></tr>`
      : "",
    input.couponDiscountInCents > 0
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Cupom</td><td align="right" style="padding:6px 0;color:#fca5a5;font-weight:800;">-${formatMoneyFromCents(input.couponDiscountInCents)}</td></tr>`
      : "",
    input.pixDiscountInCents > 0
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Desconto PIX</td><td align="right" style="padding:6px 0;color:#fca5a5;font-weight:800;">-${formatMoneyFromCents(input.pixDiscountInCents)}</td></tr>`
      : "",
  ].join("")

  const itemRows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #2a2a2a;">
            <strong style="display:block;color:#ffffff;font-size:14px;">${escapeHtml(item.name)}</strong>
            <span style="color:#9ca3af;font-size:12px;">${item.quantity} ${escapeHtml(item.unit)}</span>
          </td>
          <td align="right" style="padding:14px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:800;">
            ${formatMoneyFromCents(item.totalInCents)}
          </td>
        </tr>`
    )
    .join("")

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#0f0f0f;font-family:Montserrat,Arial,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f0f0f;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#171717;border:1px solid #2a2a2a;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:#d6ff2f;color:#101010;padding:22px 26px;">
                <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;">Nacho Factory</p>
                <h1 style="margin:8px 0 0;font-size:26px;line-height:1.1;text-transform:uppercase;">Pedido confirmado</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <p style="margin:0 0 18px;color:#e5e7eb;font-size:15px;line-height:1.6;">
                  Olá, ${escapeHtml(input.customerName)}. Recebemos o pedido <strong style="color:#d6ff2f;">${escapeHtml(input.orderNumber)}</strong> da unidade <strong>${escapeHtml(input.franchiseName)}</strong>.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                  <tr>
                    <td style="padding:14px;border:1px solid #2a2a2a;border-radius:12px;background:#111111;">
                      <span style="display:block;color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;">Status atual</span>
                      <strong style="display:block;margin-top:7px;color:#d6ff2f;font-size:18px;">${escapeHtml(statusLabel)}</strong>
                    </td>
                    <td width="12"></td>
                    <td style="padding:14px;border:1px solid #2a2a2a;border-radius:12px;background:#111111;">
                      <span style="display:block;color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;">Pagamento</span>
                      <strong style="display:block;margin-top:7px;color:#ffffff;font-size:18px;">${paymentLabel}</strong>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  ${itemRows}
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
                  <tr><td style="padding:6px 0;color:#9ca3af;">Subtotal</td><td align="right" style="padding:6px 0;color:#ffffff;font-weight:800;">${formatMoneyFromCents(input.subtotalInCents)}</td></tr>
                  ${discountRows}
                  <tr>
                    <td style="padding:16px 0 0;color:#ffffff;font-size:18px;font-weight:900;">Total estimado</td>
                    <td align="right" style="padding:16px 0 0;color:#d6ff2f;font-size:22px;font-weight:900;">${formatMoneyFromCents(input.totalInCents)}</td>
                  </tr>
                </table>

                ${
                  input.notes
                    ? `<p style="margin:24px 0 0;padding:14px;border-left:3px solid #7c3aed;background:#111111;color:#d1d5db;font-size:13px;line-height:1.5;"><strong style="color:#ffffff;">Observações:</strong> ${escapeHtml(input.notes)}</p>`
                    : ""
                }

                <p style="margin:28px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
                  A equipe Nacho Factory vai seguir com o atendimento e atualizar o status do pedido pelo marketplace.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildOrderConfirmationText(input: OrderConfirmationEmailInput) {
  const lines = [
    `Pedido ${input.orderNumber} confirmado.`,
    `Unidade: ${input.franchiseName}`,
    `Status atual: ${statusLabels[input.status] ?? input.status}`,
    `Pagamento: ${input.paymentMethod === "PIX" ? "PIX" : "Cartão"}`,
    "",
    ...input.items.map(
      (item) => `${item.quantity} ${item.unit} - ${item.name}: ${formatMoneyFromCents(item.totalInCents)}`
    ),
    "",
    `Subtotal: ${formatMoneyFromCents(input.subtotalInCents)}`,
    input.promotionDiscountInCents > 0 ? `Descontos: -${formatMoneyFromCents(input.promotionDiscountInCents)}` : "",
    input.couponDiscountInCents > 0 ? `Cupom: -${formatMoneyFromCents(input.couponDiscountInCents)}` : "",
    input.pixDiscountInCents > 0 ? `Desconto PIX: -${formatMoneyFromCents(input.pixDiscountInCents)}` : "",
    `Total estimado: ${formatMoneyFromCents(input.totalInCents)}`,
  ]

  return lines.filter(Boolean).join("\n")
}

export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput) {
  await sendMail({
    to: input.to,
    subject: `Pedido ${input.orderNumber} confirmado - Nacho Factory`,
    html: buildOrderConfirmationHtml(input),
    text: buildOrderConfirmationText(input),
  })
}

