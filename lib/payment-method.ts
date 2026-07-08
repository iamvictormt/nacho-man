export type MarketplacePaymentMethod = "PIX" | "CARD" | "BOLETO"

export function getPaymentMethodLabel(method: string) {
  if (method === "PIX") return "PIX"
  if (method === "BOLETO") return "Boleto"
  return "Cartão"
}

export function getPaymentMethodInstruction(method: string) {
  if (method === "PIX") return "PIX - aguardo o código PIX para pagamento."
  if (method === "BOLETO") return "Boleto - aguardo as instruções de emissão e pagamento."
  return "Cartão - aguardo o link de pagamento."
}

export function getPaymentDiscountLabel(method: string) {
  if (method === "PIX") return "Desconto PIX"
  if (method === "BOLETO") return "Desconto boleto"
  return "Desconto cartão"
}
