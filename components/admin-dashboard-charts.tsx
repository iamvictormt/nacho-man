"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type MonthlyPoint = {
  label: string
  orders: number
  totalInCents: number
}

type ProductPoint = {
  name: string
  quantity: number
}

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

const monthlyConfig = {
  totalInCents: {
    label: "Valor em pedidos",
    color: "#efff0d",
  },
  orders: {
    label: "Pedidos",
    color: "#7c3faa",
  },
} satisfies ChartConfig

const productConfig = {
  quantity: {
    label: "Unidades",
    color: "#7c3faa",
  },
} satisfies ChartConfig

export function OrdersEvolutionChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ChartContainer config={monthlyConfig} className="h-[260px] w-full min-w-0 md:h-[310px]">
      <AreaChart data={data} margin={{ top: 12, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="ordersValueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-totalInCents)" stopOpacity={0.28} />
            <stop offset="95%" stopColor="var(--color-totalInCents)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 5" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `${Math.round(Number(value) / 100000)}k`}
          width={44}
        />
        <ChartTooltip
          cursor={{ stroke: "rgba(239,255,13,.25)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value, name) => (
                <div className="flex min-w-36 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {monthlyConfig[name as keyof typeof monthlyConfig]?.label}
                  </span>
                  <span className="font-black text-foreground">
                    {name === "totalInCents" ? moneyFormatter.format(Number(value) / 100) : Number(value)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="totalInCents"
          stroke="var(--color-totalInCents)"
          strokeWidth={3}
          fill="url(#ordersValueGradient)"
          activeDot={{ r: 5, fill: "#efff0d", stroke: "#090909", strokeWidth: 3 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function TopProductsChart({ data }: { data: ProductPoint[] }) {
  return (
    <ChartContainer config={productConfig} className="h-[245px] w-full min-w-0">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} strokeDasharray="4 5" />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          width={105}
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => (String(value).length > 16 ? `${String(value).slice(0, 15)}…` : value)}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(124,63,170,.08)" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex min-w-40 items-center justify-between gap-4">
                  <span className="max-w-32 text-muted-foreground">{item.payload.name}</span>
                  <span className="font-black text-foreground">{Number(value)} un.</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="quantity" fill="var(--color-quantity)" radius={[0, 7, 7, 0]} barSize={18} />
      </BarChart>
    </ChartContainer>
  )
}
