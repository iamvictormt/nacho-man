const BRAZIL_TIME_ZONE = "America/Sao_Paulo"

export function formatBrazilDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date)
}
