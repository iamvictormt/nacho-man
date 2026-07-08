export function formatOrderCode(number: number) {
  return `PED-${String(number).padStart(5, "0")}`
}
