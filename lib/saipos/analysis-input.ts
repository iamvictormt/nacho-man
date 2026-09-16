import { z } from "zod"

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, "Data inválida.")

export const analysisInput = z
  .object({
    question: z.string().trim().min(8).max(2000),
    store: z.string().regex(/^(all|[1-9]\d{0,8})$/),
    start: date,
    end: date,
    comparisonStart: date,
    comparisonEnd: date,
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const [start, end] of [
      [value.start, value.end],
      [value.comparisonStart, value.comparisonEnd],
    ]) {
      const days = (Date.parse(end) - Date.parse(start)) / 86400000
      if (days < 0 || days > 365)
        ctx.addIssue({ code: "custom", message: "Selecione até 366 dias por período, em ordem cronológica." })
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())
      if (end >= today) ctx.addIssue({ code: "custom", message: "Use períodos encerrados até ontem." })
    }
  })

export type AnalysisInput = z.infer<typeof analysisInput>
