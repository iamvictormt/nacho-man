export function formatMoneyFromAmount(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatPercent(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function formatSignedPercent(value: number | null, fractionDigits = 1) {
  if (value === null) return "Sem base"
  const prefix = value > 0 ? "+" : ""
  return `${prefix}${formatPercent(value, fractionDigits)}`
}
