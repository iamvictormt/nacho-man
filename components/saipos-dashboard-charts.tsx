"use client"

import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type RevenuePoint = {
  label: string
  grossInCents: number
  netInCents: number
  orders: number
}

type RevenueChartPoint = RevenuePoint & {
  grossTrendInCents: number
}

type DistributionPoint = {
  name: string
  value: number
}

const revenueConfig = {
  grossInCents: {
    label: "Bruto",
    color: "var(--lime)",
  },
  netInCents: {
    label: "Líquido",
    color: "var(--purple-medium)",
  },
  orders: {
    label: "Pedidos",
    color: "var(--muted-foreground)",
  },
  grossTrendInCents: {
    label: "Tendência",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

const distributionConfig = {
  value: {
    label: "Pedidos",
    color: "var(--purple-medium)",
  },
} satisfies ChartConfig

const colors = ["var(--lime)", "var(--purple-medium)", "var(--lime-dark)", "var(--muted-foreground)", "var(--foreground)", "var(--border)"]

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

function formatAxisMoney(cents: number) {
  const value = cents / 100
  if (value >= 1000000) return `R$ ${Math.round(value / 1000000)}mi`
  if (value >= 1000) return `R$ ${Math.round(value / 1000)}k`
  return `R$ ${Math.round(value)}`
}

function getRevenueBarSize(length: number) {
  if (length <= 7) return 34
  if (length <= 10) return 28
  return 22
}

export function SaiposRevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData: RevenueChartPoint[] = data.map((item) => ({
    ...item,
    grossTrendInCents: item.grossInCents,
  }))

  return (
    <ChartContainer config={revenueConfig} className="h-[260px] w-full min-w-0 sm:h-[280px] md:h-[330px]">
      <ComposedChart data={chartData} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 5" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} />
        <YAxis yAxisId="money" axisLine={false} tickLine={false} tickFormatter={(value) => formatAxisMoney(Number(value))} width={54} />
        <ChartTooltip
          cursor={{ fill: "rgba(239,255,13,.08)" }}
          content={({ active, payload, label }) => {
            const visibleItems = payload?.filter((item) => item.dataKey !== "grossTrendInCents") ?? []
            if (!active || visibleItems.length === 0) return null

            return (
              <div className="grid min-w-40 gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
                <strong className="font-black text-foreground">{label}</strong>
                {visibleItems.map((item) => (
                  <div key={String(item.dataKey)} className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {item.dataKey === "grossInCents" ? "Bruto" : "Líquido"}
                    </span>
                    <span className="font-black text-foreground">
                      {moneyFormatter.format(Number(item.value) / 100)}
                    </span>
                  </div>
                ))}
              </div>
            )
          }}
        />
        <Bar
          yAxisId="money"
          dataKey="grossInCents"
          fill="var(--color-grossInCents)"
          radius={[7, 7, 0, 0]}
          barSize={getRevenueBarSize(data.length)}
        />
        <Bar
          yAxisId="money"
          dataKey="netInCents"
          fill="var(--color-netInCents)"
          radius={[7, 7, 0, 0]}
          barSize={getRevenueBarSize(data.length)}
        />
        <Line
          yAxisId="money"
          type="monotone"
          dataKey="grossTrendInCents"
          tooltipType="none"
          stroke="var(--color-grossTrendInCents)"
          strokeWidth={3}
          dot={{ r: 3, fill: "var(--muted-foreground)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

export function SaiposDistributionChart({ data }: { data: DistributionPoint[] }) {
  return (
    <ChartContainer config={distributionConfig} className="h-[230px] w-full min-w-0 sm:h-[260px]">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex min-w-32 items-center justify-between gap-4">
                  <span className="max-w-24 truncate text-muted-foreground">{item.payload.name}</span>
                  <span className="font-black text-foreground">{Number(value)}</span>
                </div>
              )}
            />
          }
        />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
