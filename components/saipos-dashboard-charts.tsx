"use client"

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type RevenuePoint = {
  label: string
  totalInCents: number
  orders: number
}

type DistributionPoint = {
  name: string
  value: number
}

const revenueConfig = {
  totalInCents: {
    label: "Faturamento",
    color: "#efff0d",
  },
} satisfies ChartConfig

const distributionConfig = {
  value: {
    label: "Pedidos",
    color: "#7c3faa",
  },
} satisfies ChartConfig

const colors = ["#efff0d", "#7c3faa", "#22c55e", "#38bdf8", "#f59e0b", "#f43f5e"]

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

export function SaiposRevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ChartContainer config={revenueConfig} className="h-[280px] w-full min-w-0 md:h-[330px]">
      <BarChart data={data} margin={{ top: 12, right: 6, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 5" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => formatAxisMoney(Number(value))} width={64} />
        <ChartTooltip
          cursor={{ fill: "rgba(239,255,13,.08)" }}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex min-w-44 items-center justify-between gap-4">
                  <span className="text-muted-foreground">{item.payload.orders} pedidos</span>
                  <span className="font-black text-foreground">{moneyFormatter.format(Number(value) / 100)}</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="totalInCents" fill="var(--color-totalInCents)" radius={[7, 7, 0, 0]} barSize={34} />
      </BarChart>
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

