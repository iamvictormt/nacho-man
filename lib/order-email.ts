import "server-only"

import { formatMoneyFromCents } from "@/lib/money"
import { sendMail } from "@/lib/email"
import { getOrderMessageSettings } from "@/lib/site-settings"
import { getPaymentDiscountLabel, getPaymentMethodLabel } from "@/lib/payment-method"
import { getOrderFulfillmentLabel } from "@/lib/order-fulfillment"

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  AWAITING_SERVICE: "Aguardando atendimento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pedido faturado",
  PICKING: "Em separação",
  INVOICED: "Pedido faturado",
  READY_FOR_PICKUP: "Pronto para retirada",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

type OrderEmailItem = {
  name: string
  unit: string
  quantity: number
  totalInCents: number
  selectedOptions?: unknown
  product?: {
    category?: {
      name: string
      sortOrder: number
    } | null
  } | null
}

type OrderConfirmationEmailInput = {
  to: string
  customerName: string
  franchiseName: string
  orderNumber: string
  status: string
  paymentMethod: "PIX" | "CARD" | "BOLETO" | string
  fulfillmentMethod: "FACTORY_PICKUP" | "SHIP_BY_CARRIER" | string
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

function renderTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((message, [key, value]) => message.replaceAll(`{${key}}`, value), template)
}

function formatSelectedOptions(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((option) => {
      if (!option || typeof option !== "object") return null
      const record = option as { name?: unknown; quantity?: unknown }
      const name = typeof record.name === "string" ? record.name : ""
      const quantity = typeof record.quantity === "number" ? record.quantity : 0

      return name && quantity > 0 ? `${quantity}x ${name}` : null
    })
    .filter((option): option is string => Boolean(option))
}

function buildOrderConfirmationHtml(input: OrderConfirmationEmailInput, introMessage: string) {
  const statusLabel = statusLabels[input.status] ?? input.status
  const paymentLabel = getPaymentMethodLabel(input.paymentMethod)
  const fulfillmentLabel = getOrderFulfillmentLabel(input.fulfillmentMethod)
  const paymentDiscountLabel = getPaymentDiscountLabel(input.paymentMethod)
  const discountRows = [
    input.promotionDiscountInCents > 0
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Descontos</td><td align="right" style="padding:6px 0;color:#fca5a5;font-weight:800;">-${formatMoneyFromCents(input.promotionDiscountInCents)}</td></tr>`
      : "",
    input.couponDiscountInCents > 0
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Cupom</td><td align="right" style="padding:6px 0;color:#fca5a5;font-weight:800;">-${formatMoneyFromCents(input.couponDiscountInCents)}</td></tr>`
      : "",
    input.pixDiscountInCents > 0
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">${paymentDiscountLabel}</td><td align="right" style="padding:6px 0;color:#fca5a5;font-weight:800;">-${formatMoneyFromCents(input.pixDiscountInCents)}</td></tr>`
      : "",
  ].join("")

  const itemRows = input.items
    .map((item) => {
      const selectedOptions = formatSelectedOptions(item.selectedOptions)

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #2a2a2a;">
            <strong style="display:block;color:#ffffff;font-size:14px;">${escapeHtml(item.name)}</strong>
            <span style="color:#9ca3af;font-size:12px;">${item.quantity} ${escapeHtml(item.unit)}</span>
            ${
              selectedOptions.length > 0
                ? `<span style="display:block;margin-top:6px;color:#d6ff2f;font-size:12px;">${selectedOptions.map(escapeHtml).join(" | ")}</span>`
                : ""
            }
          </td>
          <td align="right" style="padding:14px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:800;">
            ${formatMoneyFromCents(item.totalInCents)}
          </td>
        </tr>`
    })
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
                  ${escapeHtml(introMessage)}
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

                <p style="margin:0 0 18px;padding:14px;border:1px solid #2a2a2a;border-radius:12px;background:#111111;color:#d1d5db;font-size:13px;">
                  <strong style="color:#ffffff;">Entrega:</strong> ${escapeHtml(fulfillmentLabel)}
                </p>

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

function buildOrderConfirmationText(input: OrderConfirmationEmailInput, introMessage: string) {
  const paymentDiscountLabel = getPaymentDiscountLabel(input.paymentMethod)
  const lines = [
    introMessage,
    "",
    `Pedido: ${input.orderNumber}`,
    `Empresa: ${input.franchiseName}`,
    `Status atual: ${statusLabels[input.status] ?? input.status}`,
    `Pagamento: ${getPaymentMethodLabel(input.paymentMethod)}`,
    `Entrega: ${getOrderFulfillmentLabel(input.fulfillmentMethod)}`,
    "",
    ...input.items.map((item) => {
      const selectedOptions = formatSelectedOptions(item.selectedOptions)

      return [
        `${item.quantity} ${item.unit} - ${item.name}: ${formatMoneyFromCents(item.totalInCents)}`,
        selectedOptions.length > 0 ? `Sabores: ${selectedOptions.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    }),
    "",
    `Subtotal: ${formatMoneyFromCents(input.subtotalInCents)}`,
    input.promotionDiscountInCents > 0 ? `Descontos: -${formatMoneyFromCents(input.promotionDiscountInCents)}` : "",
    input.couponDiscountInCents > 0 ? `Cupom: -${formatMoneyFromCents(input.couponDiscountInCents)}` : "",
    input.pixDiscountInCents > 0 ? `${paymentDiscountLabel}: -${formatMoneyFromCents(input.pixDiscountInCents)}` : "",
    `Total estimado: ${formatMoneyFromCents(input.totalInCents)}`,
  ]

  return lines.filter(Boolean).join("\n")
}

export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput) {
  const settings = await getOrderMessageSettings()
  const statusLabel = statusLabels[input.status] ?? input.status
  const paymentLabel = getPaymentMethodLabel(input.paymentMethod)
  const templateValues = {
    pedido: input.orderNumber,
    cliente: input.customerName,
    empresa: input.franchiseName,
    status: statusLabel,
    pagamento: paymentLabel,
    total: formatMoneyFromCents(input.totalInCents),
  }
  const subject = renderTemplate(settings.emailSubjectTemplate, templateValues)
  const introMessage = renderTemplate(settings.emailMessageTemplate, templateValues)

  await sendMail({
    to: input.to,
    subject,
    html: buildOrderConfirmationHtml(input, introMessage),
    text: buildOrderConfirmationText(input, introMessage),
  })
}
