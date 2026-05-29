/**
 * Formata um valor numérico para o padrão monetário brasileiro (R$ X,XX).
 * Usa vírgula como separador decimal e sempre exibe 2 casas decimais.
 */
export function formatPrice(value: number): string {
  const fixed = value.toFixed(2)
  const [integerPart, decimalPart] = fixed.split(".")
  return `R$ ${integerPart},${decimalPart}`
}
