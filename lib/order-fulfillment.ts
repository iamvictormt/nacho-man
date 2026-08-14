export type OrderFulfillmentMethod = "FACTORY_PICKUP" | "SHIP_BY_CARRIER"

export const orderFulfillmentMethods = ["FACTORY_PICKUP", "SHIP_BY_CARRIER"] as const
const brazilTimeZone = "America/Sao_Paulo"
const factoryPickupOpeningHour = 8
const factoryPickupCutoffHour = 12
const factoryPickupLateCutoffHour = 18
const factoryPickupAfternoonHour = 13
const factoryPickupScheduleTimes = [
  ...createScheduleTimes(factoryPickupOpeningHour, 0, 12, 0),
  ...createScheduleTimes(factoryPickupAfternoonHour, 0, 17, 15),
]

export function getOrderFulfillmentLabel(method: OrderFulfillmentMethod | string) {
  return method === "FACTORY_PICKUP" ? "Retirar na fábrica" : "Receber via transportadora"
}

export function getOrderFulfillmentInstruction(method: OrderFulfillmentMethod | string) {
  return method === "FACTORY_PICKUP" ? "Retirada na fábrica" : "Entrega via transportadora"
}

function isBusinessDay(date: Date) {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

function createScheduleTimes(startHour: number, startMinute: number, endHour: number, endMinute: number) {
  const times: { hour: number; minute: number }[] = []
  const cursor = new Date(2000, 0, 1, startHour, startMinute, 0, 0)
  const end = new Date(2000, 0, 1, endHour, endMinute, 0, 0)

  while (cursor <= end) {
    times.push({ hour: cursor.getHours(), minute: cursor.getMinutes() })
    cursor.setMinutes(cursor.getMinutes() + 15)
  }

  return times
}

function getNextBusinessDay(date: Date) {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  next.setHours(factoryPickupOpeningHour, 0, 0, 0)

  while (!isBusinessDay(next)) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

function addBusinessDays(date: Date, days: number) {
  const result = new Date(date)
  let remaining = days

  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    if (isBusinessDay(result)) remaining -= 1
  }

  return result
}

function getBrazilDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: brazilTimeZone,
    year: "numeric",
  }).formatToParts(date)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
  }
}

function createBrazilCalendarDate(date: Date) {
  const parts = getBrazilDateParts(date)
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
}

function parseFactoryPickupScheduleParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const [, year, month, day, hour, minute] = match
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  }
}

function createDateFromScheduleParts(parts: { year: number; month: number; day: number; hour: number; minute: number }) {
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatTimeValue(hour: number, minute = 0) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function formatTimeLabel(hour: number, minute = 0) {
  return minute === 0 ? `${hour}h` : `${hour}h${String(minute).padStart(2, "0")}`
}

function isFactoryPickupScheduleTime(hour: number, minute: number) {
  return factoryPickupScheduleTimes.some((time) => time.hour === hour && time.minute === minute)
}

export function getFactoryPickupAvailableAt(from = new Date()) {
  const orderedAt = createBrazilCalendarDate(from)
  if (!isBusinessDay(orderedAt)) {
    const receivedAt = getNextBusinessDay(orderedAt)
    const availableAt = getNextBusinessDay(receivedAt)
    availableAt.setHours(factoryPickupAfternoonHour, 0, 0, 0)
    return availableAt
  }

  if (
    orderedAt.getHours() < factoryPickupCutoffHour ||
    (orderedAt.getHours() === factoryPickupCutoffHour && orderedAt.getMinutes() === 0)
  ) {
    const availableAt = getNextBusinessDay(orderedAt)
    availableAt.setHours(factoryPickupAfternoonHour, 0, 0, 0)
    return availableAt
  }

  const availableAt = addBusinessDays(orderedAt, 2)
  availableAt.setHours(
    orderedAt.getHours() >= factoryPickupLateCutoffHour ? factoryPickupAfternoonHour : factoryPickupOpeningHour,
    0,
    0,
    0
  )

  return availableAt
}

export function formatFactoryPickupAvailableAt(date: Date) {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date)
  const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date)
  const hours = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date)
  const formattedHours = hours.endsWith(":00") ? `${Number(hours.slice(0, 2))}h` : hours.replace(":", "h")

  return `${weekday}, ${dayMonth}, a partir das ${formattedHours}`
}

export function formatFactoryPickupScheduleAt(date: Date) {
  return formatFactoryPickupAvailableAt(date).replace("a partir das", "às")
}

export function formatFactoryPickupScheduleValue(date: Date) {
  return `${formatDateValue(date)}T${formatTimeValue(date.getHours(), date.getMinutes())}`
}

export function parseFactoryPickupScheduleValue(value: string) {
  const parts = parseFactoryPickupScheduleParts(value)
  if (!parts) return null

  return createDateFromScheduleParts(parts)
}

export function getFactoryPickupDateOptions(from = new Date(), count = 12) {
  const firstAvailable = getFactoryPickupAvailableAt(from)
  const options: { value: string; label: string; shortLabel: string }[] = []
  const cursor = new Date(firstAvailable)

  while (options.length < count) {
    if (isBusinessDay(cursor)) {
      options.push({
        value: formatDateValue(cursor),
        label: new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          weekday: "long",
        }).format(cursor),
        shortLabel: new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          weekday: "short",
        })
          .format(cursor)
          .replace(".", ""),
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return options
}

export function getFactoryPickupTimeOptions(dateValue: string, from = new Date()) {
  const firstAvailableValue = formatFactoryPickupScheduleValue(getFactoryPickupAvailableAt(from))

  return factoryPickupScheduleTimes.map(({ hour, minute }) => {
    const value = formatTimeValue(hour, minute)
    const scheduleValue = `${dateValue}T${value}`

    return {
      value,
      label: formatTimeLabel(hour, minute),
      disabled: scheduleValue < firstAvailableValue,
    }
  })
}

export function isFactoryPickupScheduleAllowed(value: string, from = new Date()) {
  const scheduledAt = parseFactoryPickupScheduleValue(value)
  if (!scheduledAt || !isBusinessDay(scheduledAt)) return false

  const parts = parseFactoryPickupScheduleParts(value)
  if (!parts) return false
  if (!isFactoryPickupScheduleTime(parts.hour, parts.minute)) return false

  return value >= formatFactoryPickupScheduleValue(getFactoryPickupAvailableAt(from))
}

export function getFactoryPickupEstimateMessage(from = new Date()) {
  return `Seu pedido estará disponível para retirada na ${formatFactoryPickupAvailableAt(
    getFactoryPickupAvailableAt(from)
  )}. Para retirar depois desse horário, escolha uma data e horário na agenda.`
}
