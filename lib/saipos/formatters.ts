export function formatMoneyFromAmount(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function truncate(value: number, fractionDigits: number) {
  const factor = 10 ** fractionDigits
  return Math.trunc(value * factor) / factor
}

export function formatPercent(value: number, fractionDigits = 2) {
  const percentValue = truncate(value * 100, fractionDigits)

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(percentValue)}%`
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function formatSignedPercent(value: number | null, fractionDigits = 2) {
  if (value === null) return "Sem base"
  const prefix = value > 0 ? "+" : ""
  return `${prefix}${formatPercent(value, fractionDigits)}`
}
