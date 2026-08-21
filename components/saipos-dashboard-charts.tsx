"use client"

import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type RevenuePoint = {
  label: string
  grossInCents: number
  netInCents: number
  orders: number
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
  return (
    <ChartContainer config={revenueConfig} className="h-[280px] w-full min-w-0 md:h-[330px]">
      <ComposedChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 5" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} />
        <YAxis yAxisId="money" axisLine={false} tickLine={false} tickFormatter={(value) => formatAxisMoney(Number(value))} width={64} />
        <YAxis yAxisId="orders" orientation="right" axisLine={false} tickLine={false} hide />
        <ChartTooltip
          cursor={{ fill: "rgba(239,255,13,.08)" }}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex min-w-44 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {item.dataKey === "orders" ? "Pedidos" : item.dataKey === "grossInCents" ? "Bruto" : "Líquido"}
                  </span>
                  <span className="font-black text-foreground">
                    {item.dataKey === "orders" ? Number(value) : moneyFormatter.format(Number(value) / 100)}
                  </span>
                </div>
              )}
            />
          }
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
          yAxisId="orders"
          type="monotone"
          dataKey="orders"
          stroke="var(--color-orders)"
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
    <ChartContainer config={distributionConfig} className="h-[260px] w-full min-w-0">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex min-w-36 items-center justify-between gap-4">
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
