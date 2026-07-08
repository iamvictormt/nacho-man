import Link from "next/link"
import type { SaiposSyncRun } from "@prisma/client"
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Eye,
  EyeOff,
  ReceiptText,
  RefreshCw,
  Store,
  TrendingUp,
} from "lucide-react"
import { AdminDatePicker, AdminSelect } from "@/components/admin-form-fields"
import { PrivatePageHeader } from "@/components/private-page-header"
import { SaiposDistributionChart, SaiposRevenueChart } from "@/components/saipos-dashboard-charts"
import { prisma } from "@/lib/prisma"
import { normalizeSaiposPeriod } from "@/lib/saipos-data-api"
import { getSaiposRecommendedSyncText } from "@/lib/saipos-sync"

type PageSearchParams = Record<string, string | string[] | undefined>
type SaiposDashboardSale = Awaited<ReturnType<typeof getSaiposDashboardSales>>[number]

const saleTypeLabels: Record<number, string> = {
  1: "Entrega",
  2: "Retirada",
  3: "Salão",
  4: "Ficha",
}

const cardOptions = [
  { key: "revenue", label: "Faturamento" },
  { key: "orders", label: "Pedidos" },
  { key: "ticket", label: "Ticket médio" },
  { key: "stores", label: "Lojas ativas" },
  { key: "canceled", label: "Cancelamentos" },
] as const

const defaultCards = cardOptions.map((card) => card.key)

function formatMoneyFromAmount(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function getSearchParam(searchParams: PageSearchParams, key: string) {
  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value
}

function getSelectedCards(searchParams: PageSearchParams) {
  const cards = getSearchParam(searchParams, "cards")
  if (!cards) return defaultCards

  const selected = cards.split(",").filter((card): card is (typeof defaultCards)[number] =>
    defaultCards.includes(card as (typeof defaultCards)[number])
  )

  return selected.length > 0 ? selected : defaultCards
}

function toPeriodStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function toPeriodEnd(value: string) {
  return new Date(`${value}T23:59:59.999Z`)
}

function buildHref(searchParams: PageSearchParams, updates: Record<string, string | null>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value)
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `/admin/saipos?${query}` : "/admin/saipos"
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((totals, item) => {
    const key = getKey(item)
    totals[key] = (totals[key] ?? 0) + 1
    return totals
  }, {})
}

function isCanceled(sale: SaiposDashboardSale) {
  return sale.canceled
}

function getPaymentLabel(sale: SaiposDashboardSale) {
  return sale.paymentMethod?.trim() || "Não informado"
}

function buildDailyRevenue(sales: SaiposDashboardSale[]) {
  const totals = sales.reduce<Record<string, { totalInCents: number; orders: number }>>((acc, sale) => {
    const key = (sale.shiftDate ?? sale.createdAtSaipos).toISOString().slice(0, 10)
    acc[key] ??= { totalInCents: 0, orders: 0 }
    acc[key].orders += 1
    acc[key].totalInCents += sale.totalAmountInCents
    return acc
  }, {})

  return Object.entries(totals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, item]) => ({
      label: date.includes("-") ? date.split("-").reverse().slice(0, 2).join("/") : date,
      ...item,
    }))
}

async function getSaiposDashboardSales({
  period,
  selectedStore,
}: {
  period: { start: string; end: string }
  selectedStore: string
}) {
  return prisma.saiposSale.findMany({
    where: {
      createdAtSaipos: {
        gte: toPeriodStart(period.start),
        lte: toPeriodEnd(period.end),
      },
      ...(selectedStore === "all" ? {} : { idStore: Number(selectedStore) }),
    },
    orderBy: { createdAtSaipos: "desc" },
    take: 5000,
  })
}

function topEntries(totals: Record<string, number>, limit = 6) {
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export default async function SaiposDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>
}) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const period = normalizeSaiposPeriod(resolvedSearchParams)
  const selectedCards = getSelectedCards(resolvedSearchParams)
  const selectedStore = getSearchParam(resolvedSearchParams, "store") ?? "all"
  const [allSales, stores, lastSync] = await Promise.all([
    getSaiposDashboardSales({ period, selectedStore }),
    prisma.saiposSale.findMany({
      distinct: ["idStore"],
      orderBy: { idStore: "asc" },
      select: { idStore: true },
    }),
    prisma.saiposSyncRun.findFirst({
      orderBy: { startedAt: "desc" },
    }),
  ])
  const storeOptions = stores.map((store) => String(store.idStore))
  const filteredSales = allSales
  const validSales = filteredSales.filter((sale) => !isCanceled(sale))
  const canceledSales = filteredSales.length - validSales.length
  const revenueInCents = validSales.reduce((total, sale) => total + sale.totalAmountInCents, 0)
  const revenue = revenueInCents / 100
  const averageTicket = validSales.length > 0 ? revenue / validSales.length : 0
  const storeTotals = validSales.reduce<Record<string, { orders: number; revenue: number }>>((acc, sale) => {
    const key = `Loja #${sale.idStore}`
    acc[key] ??= { orders: 0, revenue: 0 }
    acc[key].orders += 1
    acc[key].revenue += sale.totalAmountInCents / 100
    return acc
  }, {})
  const topStores = Object.entries(storeTotals)
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
  const saleTypes = topEntries(groupBy(validSales, (sale) => saleTypeLabels[sale.idSaleType] ?? "Outro"))
  const paymentTypes = topEntries(groupBy(validSales, getPaymentLabel))
  const dailyRevenue = buildDailyRevenue(validSales)

  const stats = [
    {
      key: "revenue",
      label: "Faturamento",
      value: formatMoneyFromAmount(revenue),
      detail: "Vendas não canceladas",
      icon: CircleDollarSign,
      tone: "lime",
    },
    {
      key: "orders",
      label: "Pedidos",
      value: String(validSales.length),
      detail: `${filteredSales.length} registros no período`,
      icon: ReceiptText,
      tone: "purple",
    },
    {
      key: "ticket",
      label: "Ticket médio",
      value: formatMoneyFromAmount(averageTicket),
      detail: "Média por pedido válido",
      icon: TrendingUp,
      tone: "lime",
    },
    {
      key: "stores",
      label: "Lojas ativas",
      value: String(new Set(validSales.map((sale) => sale.idStore)).size),
      detail: selectedStore === "all" ? "Com vendas no período" : `Filtro Loja #${selectedStore}`,
      icon: Store,
      tone: "purple",
    },
    {
      key: "canceled",
      label: "Cancelamentos",
      value: String(canceledSales),
      detail: filteredSales.length > 0 ? formatPercent(canceledSales / filteredSales.length) : "Sem registros",
      icon: AlertTriangle,
      tone: "amber",
    },
  ].filter((stat) => selectedCards.includes(stat.key as (typeof defaultCards)[number]))

  return (
    <main>
      <PrivatePageHeader
        eyebrow="Indicadores Saipos"
        title={
          <>
            Todas as lojas em <span className="text-lime neon-glow">um painel.</span>
          </>
        }
        description="Painel lido do banco local para acompanhar faturamento, pedidos, canais, formas de pagamento e desempenho por loja sem depender da Saipos em tempo real."
        icon={BarChart3}
      >
        <Link
          href={buildHref(resolvedSearchParams, { refresh: String(Date.now()) })}
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-lime/30 px-7 text-xs font-black uppercase tracking-wider text-lime transition hover:bg-lime hover:text-background"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Link>
      </PrivatePageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <form className="grid gap-4 rounded-2xl border border-border bg-graphite p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-start md:p-5">
          <AdminDatePicker name="start" label="Início" defaultValue={period.start} valueFormat="iso" />
          <AdminDatePicker name="end" label="Fim" defaultValue={period.end} valueFormat="iso" />
          <AdminSelect name="store" label="Loja" defaultValue={selectedStore}>
            <option value="all">Todas as lojas</option>
              {storeOptions.map((store) => (
                <option key={store} value={store}>
                  Loja #{store}
                </option>
            ))}
          </AdminSelect>
          <input type="hidden" name="cards" value={selectedCards.join(",")} />
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lime px-5 text-xs font-black uppercase tracking-wider text-background md:mt-[26px]">
            <CalendarDays className="h-4 w-4" />
            Filtrar
          </button>
        </form>

        <section className="mt-4 rounded-2xl border border-border bg-graphite p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-medium">
                Personalizar painel
              </p>
              <h2 className="mt-2 text-lg font-black uppercase tracking-[-0.03em]">Cards visíveis</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {cardOptions.map((card) => {
                const active = selectedCards.includes(card.key)
                const nextCards = active
                  ? selectedCards.filter((key) => key !== card.key)
                  : [...selectedCards, card.key]

                return (
                  <Link
                    key={card.key}
                    href={buildHref(resolvedSearchParams, { cards: nextCards.join(",") })}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-wider transition ${
                      active
                        ? "border-lime/30 bg-lime text-background"
                        : "border-border text-muted-foreground hover:border-lime/30 hover:text-lime"
                    }`}
                  >
                    {active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {card.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <SyncStatusCard lastSync={lastSync} />

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map(({ label, value, detail, icon: Icon, tone }) => (
            <article key={label} className="relative overflow-hidden rounded-2xl border border-border bg-graphite p-5">
              <div
                className={`absolute inset-x-0 top-0 h-px ${
                  tone === "amber"
                    ? "bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                    : tone === "lime"
                      ? "bg-gradient-to-r from-transparent via-lime/70 to-transparent"
                      : "bg-gradient-to-r from-transparent via-purple-medium/70 to-transparent"
                }`}
              />
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-black uppercase leading-4 tracking-[0.14em] text-muted-foreground">
                  {label}
                </p>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    tone === "amber"
                      ? "border-amber-400/20 bg-amber-400/10 text-amber-400"
                      : tone === "lime"
                        ? "border-lime/20 bg-lime/10 text-lime"
                        : "border-purple-medium/30 bg-purple-medium/10 text-purple-medium"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-6 truncate text-2xl font-black tracking-[-0.04em]">{value}</p>
              <p className="mt-2 truncate text-[11px] text-muted-foreground">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,.75fr)]">
          <article className="rounded-2xl border border-border bg-graphite p-5 md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime">Período selecionado</p>
            <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.03em]">Faturamento por dia</h2>
            {dailyRevenue.length > 0 ? <SaiposRevenueChart data={dailyRevenue} /> : <EmptyState text="Sem vendas no período selecionado." />}
          </article>

          <article className="rounded-2xl border border-border bg-graphite p-5 md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-medium">Canais</p>
            <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.03em]">Tipos de venda</h2>
            {saleTypes.length > 0 ? <SaiposDistributionChart data={saleTypes} /> : <EmptyState text="Não há tipos de venda para exibir." />}
            <Legend data={saleTypes} />
          </article>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <RankingCard title="Ranking de lojas" subtitle="Por faturamento" data={topStores.map((store) => ({
            name: store.name,
            detail: `${store.orders} pedidos`,
            value: formatMoneyFromAmount(store.revenue),
          }))} />
          <RankingCard
            title="Formas de pagamento"
            subtitle="Pedidos válidos"
            icon={CreditCard}
            data={paymentTypes.map((payment) => ({
              name: payment.name,
              detail: `${payment.value} pedidos`,
              value: formatPercent(validSales.length > 0 ? payment.value / validSales.length : 0),
            }))}
          />
        </section>
      </div>
    </main>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-border bg-background/40 px-5 py-10 text-center text-xs leading-5 text-muted-foreground">
      {text}
    </div>
  )
}

function SyncStatusCard({ lastSync }: { lastSync: SaiposSyncRun | null }) {
  const finishedAt = lastSync?.finishedAt
  const statusLabel =
    lastSync?.status === "SUCCESS"
      ? "Atualizado"
      : lastSync?.status === "PARTIAL"
        ? "Atualização parcial"
        : lastSync?.status === "FAILED"
          ? "A última sincronização falhou"
          : lastSync?.status === "RUNNING"
            ? "Sincronizando"
            : "Aguardando a primeira sincronização"
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  })

  return (
    <section className="mt-5 rounded-2xl border border-lime/20 bg-lime/[0.06] p-5 text-sm leading-6 text-foreground">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime">{statusLabel}</p>
          <p className="mt-2 text-muted-foreground">{getSaiposRecommendedSyncText()}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-border bg-background px-4 py-3 text-xs">
          <strong className="block text-foreground">
            {finishedAt ? dateFormatter.format(finishedAt) : "Sem sincronização concluída"}
          </strong>
          <span className="mt-1 block text-muted-foreground">
            {lastSync
              ? `${lastSync.recordsUpserted} registros gravados`
              : "O painel será preenchido após o primeiro job"}
          </span>
        </div>
      </div>
      {lastSync?.errorMessage && (
        <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          {lastSync.errorMessage}
        </p>
      )}
    </section>
  )
}

function Legend({ data }: { data: Array<{ name: string; value: number }> }) {
  if (data.length === 0) return null

  return (
    <div className="mt-4 grid gap-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate text-muted-foreground">{item.name}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function RankingCard({
  title,
  subtitle,
  data,
  icon: Icon = Store,
}: {
  title: string
  subtitle: string
  data: Array<{ name: string; detail: string; value: string }>
  icon?: typeof Store
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-graphite">
      <div className="flex items-center justify-between gap-4 border-b border-border p-5 md:px-7 md:py-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime">{subtitle}</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.03em]">{title}</h2>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      {data.length > 0 ? (
        <div className="divide-y divide-border">
          {data.map((item, index) => (
            <div key={item.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 md:px-7">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-xs font-black text-lime">
                {index + 1}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-xs">{item.name}</strong>
                <span className="mt-1 block truncate text-[10px] text-muted-foreground">{item.detail}</span>
              </span>
              <strong className="text-xs text-lime">{item.value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 md:p-7">
          <EmptyState text="Sem dados para montar este ranking." />
        </div>
      )}
    </article>
  )
}
