"use client"

import { Bar, CartesianGrid, Cell, ComposedChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type RevenuePoint = {
  label: string
  grossInCents: number
  netInCents: number
  orders: number
}

type RevenueChartPoint = RevenuePoint & {
  currentGrossInCents: number
  previousGrossInCents?: number
  previousLabel?: string
}

type DistributionPoint = {
  name: string
  value: number
  revenueInCents?: number
}

type DistributionChartPoint = DistributionPoint & {
  chartValue: number
}

type DistributionLabelProps = {
  cx?: number | string
  cy?: number | string
  midAngle?: number
  outerRadius?: number | string
  percent?: number
}

const revenueConfig = {
  currentGrossInCents: {
    label: "Atual",
    color: "var(--lime)",
  },
  previousGrossInCents: {
    label: "Mês anterior",
    color: "var(--purple-medium)",
  },
  orders: {
    label: "Pedidos",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

const distributionConfig = {
  chartValue: {
    label: "Faturamento",
    color: "var(--purple-medium)",
  },
} satisfies ChartConfig

const colors = [
  "var(--lime)",
  "var(--purple-medium)",
  "var(--lime-dark)",
  "var(--muted-foreground)",
  "var(--foreground)",
  "var(--border)",
]

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatAxisMoney(cents: number) {
  const value = cents / 100
  if (value >= 1000000) return `R$ ${Math.round(value / 1000000)}mi`
  if (value >= 1000) return `R$ ${Math.round(value / 1000)}k`
  return `R$ ${Math.round(value)}`
}

function getRevenueBarSize(length: number, compact = false) {
  if (length <= 7) return compact ? 26 : 34
  if (length <= 10) return compact ? 22 : 28
  return compact ? 16 : 22
}

function renderDistributionPercentLabel({ cx, cy, midAngle, outerRadius, percent }: DistributionLabelProps) {
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    typeof midAngle !== "number" ||
    typeof outerRadius !== "number" ||
    typeof percent !== "number" ||
    percent < 0.045
  ) {
    return null
  }

  const radius = outerRadius + 18
  const angle = (-midAngle * Math.PI) / 180
  const x = cx + radius * Math.cos(angle)
  const y = cy + radius * Math.sin(angle)

  return (
    <text
      x={x}
      y={y}
      fill="var(--foreground)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-[10px] font-black"
    >
      {percentFormatter.format(percent * 100)}%
    </text>
  )
}

export function SaiposRevenueChart({
  data,
  comparisonData,
}: {
  data: RevenuePoint[]
  comparisonData?: RevenuePoint[]
}) {
  const chartData: RevenueChartPoint[] = data.map((item, index) => ({
    ...item,
    currentGrossInCents: item.grossInCents,
    previousGrossInCents: comparisonData?.[index]?.grossInCents,
    previousLabel: comparisonData?.[index]?.label,
  }))
  const hasComparison = chartData.some((item) => typeof item.previousGrossInCents === "number")

  return (
    <ChartContainer config={revenueConfig} className="h-[260px] w-full min-w-0 sm:h-[280px] md:h-[330px]">
      <ComposedChart data={chartData} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 5" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} />
        <YAxis
          yAxisId="money"
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => formatAxisMoney(Number(value))}
          width={54}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(239,255,13,.08)" }}
          content={({ active, payload, label }) => {
            const current = payload?.find((item) => item.dataKey === "currentGrossInCents")
            const previous = payload?.find((item) => item.dataKey === "previousGrossInCents")
            if (!active || !current) return null
            const previousLabel = current.payload.previousLabel

            return (
              <div className="grid min-w-40 gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
                <strong className="font-black text-foreground">{label}</strong>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Bruto atual</span>
                  <span className="font-black text-foreground">{moneyFormatter.format(Number(current.value) / 100)}</span>
                </div>
                {previous ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {previousLabel ? `Bruto ${previousLabel}` : "Bruto mês anterior"}
                    </span>
                    <span className="font-black text-foreground">
                      {moneyFormatter.format(Number(previous.value) / 100)}
                    </span>
                  </div>
                ) : null}
              </div>
            )
          }}
        />
        <Bar
          yAxisId="money"
          dataKey="currentGrossInCents"
          fill="var(--color-currentGrossInCents)"
          radius={[7, 7, 0, 0]}
          barSize={getRevenueBarSize(data.length, hasComparison)}
        />
        {hasComparison ? (
          <Bar
            yAxisId="money"
            dataKey="previousGrossInCents"
            fill="var(--color-previousGrossInCents)"
            radius={[7, 7, 0, 0]}
            barSize={getRevenueBarSize(data.length, true)}
          />
        ) : null}
      </ComposedChart>
    </ChartContainer>
  )
}

export function SaiposDistributionChart({
  data,
  showPercentLabels = false,
}: {
  data: DistributionPoint[]
  showPercentLabels?: boolean
}) {
  const chartData: DistributionChartPoint[] = data.map((item) => ({
    ...item,
    chartValue: item.revenueInCents ?? item.value,
  }))
  const total = chartData.reduce((sum, item) => sum + item.chartValue, 0)

  return (
    <ChartContainer config={distributionConfig} className="h-[310px] w-full min-w-0 sm:h-[340px]">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(_value, _name, item) => (
                <div className="flex min-w-48 items-center justify-between gap-4">
                  <span className="max-w-24 truncate text-muted-foreground">{item.payload.name}</span>
                  <span className="grid justify-items-end gap-0.5 font-black text-foreground">
                    {typeof item.payload.revenueInCents === "number" ? (
                      <span>{moneyFormatter.format(item.payload.revenueInCents / 100)}</span>
                    ) : null}
                    <span className="text-[10px] uppercase text-muted-foreground">{item.payload.value} pedidos</span>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {percentFormatter.format(total > 0 ? (item.payload.chartValue / total) * 100 : 0)}%
                    </span>
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="chartValue"
          nameKey="name"
          cx="50%"
          cy="52%"
          innerRadius={78}
          outerRadius={126}
          paddingAngle={3}
          label={showPercentLabels ? renderDistributionPercentLabel : false}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
