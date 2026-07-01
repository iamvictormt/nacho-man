import Link from "next/link"
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  Factory,
  Gift,
  PackageSearch,
  ReceiptText,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  UsersRound,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { PrivatePageHeader } from "@/components/private-page-header"
import { OrdersEvolutionChart, TopProductsChart } from "@/components/admin-dashboard-charts"

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  AWAITING_SERVICE: "Aguardando atendimento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  PICKING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted-foreground",
  AWAITING_SERVICE: "bg-purple-medium",
  AWAITING_PAYMENT: "bg-amber-400",
  PAYMENT_CONFIRMED: "bg-lime",
  PICKING: "bg-cyan-400",
  SHIPPED: "bg-blue-400",
  DELIVERED: "bg-emerald-400",
  CANCELLED: "bg-red-400",
}

const businessTimeZone = "America/Sao_Paulo"

function getZonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: businessTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getZonedParts(date)
  const zonedTimeAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )

  return zonedTimeAsUtc - date.getTime()
}

function zonedMonthStartUtc(year: number, month: number) {
  const normalized = new Date(Date.UTC(year, month - 1, 1))
  const localMidnightAsUtc = new Date(
    Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth(), 1, 0, 0, 0)
  )
  let utcDate = new Date(localMidnightAsUtc.getTime() - getTimeZoneOffsetMs(localMidnightAsUtc))
  utcDate = new Date(localMidnightAsUtc.getTime() - getTimeZoneOffsetMs(utcDate))

  return utcDate
}

function monthKey(date: Date) {
  const parts = getZonedParts(date)
  return `${parts.year}-${parts.month}`
}

export default async function AdminPage() {
  const now = new Date()
  const currentMonthParts = getZonedParts(now)
  const currentYear = Number(currentMonthParts.year)
  const currentMonth = Number(currentMonthParts.month)
  const monthStart = zonedMonthStartUtc(currentYear, currentMonth)
  const nextMonthStart = zonedMonthStartUtc(currentYear, currentMonth + 1)
  const sixMonthsStart = zonedMonthStartUtc(currentYear, currentMonth - 5)

  const [products, franchises, userCount, activePromotions, periodOrders, recentOrders, orderItems, comboItems] =
    await Promise.all([
      prisma.product.count({ where: { active: true } }),
      prisma.franchise.count({ where: { active: true } }),
      prisma.user.count({ where: { role: { in: ["FRANCHISEE", "USER"] } } }),
      prisma.promotion.count({
        where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sixMonthsStart } },
        select: {
          id: true,
          status: true,
          totalInCents: true,
          createdAt: true,
          franchise: { select: { tradeName: true } },
          user: { select: { name: true } },
        },
      }),
      prisma.order.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          totalInCents: true,
          createdAt: true,
          franchise: { select: { tradeName: true } },
          user: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.orderItem.findMany({
        where: {
          productId: { not: null },
          order: {
            status: { not: "CANCELLED" },
            createdAt: { gte: sixMonthsStart },
          },
        },
        select: { name: true, quantity: true },
      }),
      prisma.orderItem.findMany({
        where: {
          comboId: { not: null },
          order: {
            status: { not: "CANCELLED" },
            createdAt: { gte: sixMonthsStart },
          },
        },
        select: { name: true, quantity: true },
      }),
    ])

  const validOrders = periodOrders.filter((order) => order.status !== "CANCELLED")
  const currentMonthOrders = validOrders.filter(
    (order) => order.createdAt >= monthStart && order.createdAt < nextMonthStart
  )
  const currentMonthValue = currentMonthOrders.reduce((total, order) => total + order.totalInCents, 0)
  const awaitingOrders = periodOrders.filter((order) =>
    ["AWAITING_SERVICE", "AWAITING_PAYMENT"].includes(order.status)
  ).length

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = zonedMonthStartUtc(currentYear, currentMonth - 5 + index)
    return {
      key: monthKey(date),
      label: new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: businessTimeZone })
        .format(date)
        .replace(".", "")
        .toUpperCase(),
      orders: 0,
      totalInCents: 0,
    }
  })

  for (const order of validOrders) {
    const month = monthlyData.find((item) => item.key === monthKey(order.createdAt))
    if (month) {
      month.orders += 1
      month.totalInCents += order.totalInCents
    }
  }

  const statusCounts = periodOrders.reduce<Record<string, number>>((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1
    return counts
  }, {})
  const totalPeriodOrders = periodOrders.length
  const visibleStatuses = Object.entries(statusLabels)
    .map(([status, label]) => ({ status, label, count: statusCounts[status] ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

  const productTotals = orderItems.reduce<Record<string, number>>((totals, item) => {
    totals[item.name] = (totals[item.name] ?? 0) + item.quantity
    return totals
  }, {})
  const topProducts = Object.entries(productTotals)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)
  const comboTotals = comboItems.reduce<Record<string, number>>((totals, item) => {
    totals[item.name] = (totals[item.name] ?? 0) + item.quantity
    return totals
  }, {})
  const topCombos = Object.entries(comboTotals)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)

  const franchiseTotals = validOrders.reduce<Record<string, { orders: number; totalInCents: number }>>(
    (totals, order) => {
      const name = order.franchise?.tradeName ?? order.user?.name ?? "Cliente Nacho Man"
      totals[name] ??= { orders: 0, totalInCents: 0 }
      totals[name].orders += 1
      totals[name].totalInCents += order.totalInCents
      return totals
    },
    {}
  )
  const topFranchise = Object.entries(franchiseTotals).sort(([, a], [, b]) => b.totalInCents - a.totalInCents)[0]

  const stats = [
    {
      label: "Valor em pedidos no mês",
      value: formatMoneyFromCents(currentMonthValue),
      detail: `${currentMonthOrders.length} pedidos não cancelados`,
      icon: CircleDollarSign,
      color: "lime",
    },
    {
      label: "Pedidos neste mês",
      value: currentMonthOrders.length,
      detail: `${validOrders.length} nos últimos 6 meses`,
      icon: ReceiptText,
      color: "purple",
    },
    {
      label: "Aguardando ação",
      value: awaitingOrders,
      detail: "atendimento ou pagamento",
      icon: Clock3,
      color: "amber",
    },
    {
      label: "Franqueados ativos",
      value: franchises,
      detail: topFranchise ? `Destaque: ${topFranchise[0]}` : "Nenhum pedido no período",
      icon: Store,
      color: "purple",
    },
  ]

  return (
    <main>
      <PrivatePageHeader
        eyebrow="Visão geral da operação"
        title={
          <>
            Sua rede em <span className="text-lime neon-glow">movimento.</span>
          </>
        }
        description="Acompanhe o volume de pedidos, identifique pendências e veja o que mais está girando entre os franqueados."
        icon={Factory}
      >
        <Link
          href="/admin/pedidos"
          className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-lime px-7 text-xs font-black tracking-wider text-background transition hover:shadow-[0_0_28px_rgba(239,255,13,.25)]"
        >
          VER PEDIDOS
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </PrivatePageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, detail, icon: Icon, color }) => (
            <article
              key={label}
              className="relative overflow-hidden rounded-2xl border border-border bg-graphite p-5 md:p-6"
            >
              <div
                className={`absolute inset-x-0 top-0 h-px ${
                  color === "lime"
                    ? "bg-gradient-to-r from-transparent via-lime/70 to-transparent"
                    : color === "amber"
                      ? "bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                      : "bg-gradient-to-r from-transparent via-purple-medium/70 to-transparent"
                }`}
              />
              <div className="flex items-start justify-between gap-4">
                <p className="max-w-36 text-[10px] font-black uppercase leading-4 tracking-[0.14em] text-muted-foreground">
                  {label}
                </p>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    color === "lime"
                      ? "border-lime/20 bg-lime/10 text-lime"
                      : color === "amber"
                        ? "border-amber-400/20 bg-amber-400/10 text-amber-400"
                        : "border-purple-medium/30 bg-purple-medium/10 text-purple-medium"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-6 truncate text-2xl font-black tracking-[-0.04em] md:text-3xl">{value}</p>
              <p className="mt-2 truncate text-[11px] text-muted-foreground">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,.75fr)]">
          <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-graphite p-5 md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime">
                  <TrendingUp className="h-4 w-4" />
                  Últimos 6 meses
                </p>
                <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.03em] md:text-2xl">
                  Evolução dos pedidos
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">Pedidos cancelados não entram no valor</p>
            </div>
            <div className="mt-5">
              <OrdersEvolutionChart data={monthlyData} />
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-graphite p-5 md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-medium">Distribuição</p>
            <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.03em]">Pedidos por status</h2>
            {visibleStatuses.length > 0 ? (
              <div className="mt-7 space-y-5">
                {visibleStatuses.map(({ status, label, count }) => (
                  <div key={status}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-bold">{label}</span>
                      <span className="font-black text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background">
                      <div
                        className={`h-full rounded-full ${statusColors[status]}`}
                        style={{ width: `${Math.max((count / totalPeriodOrders) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Os status aparecerão quando os primeiros pedidos chegarem." />
            )}
          </article>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <article className="min-w-0 rounded-2xl border border-border bg-graphite p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-medium">
                  Giro de catálogo
                </p>
                <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.03em]">Produtos mais pedidos</h2>
              </div>
              <PackageSearch className="h-5 w-5 text-muted-foreground" />
            </div>
            {topProducts.length > 0 ? (
              <div className="mt-5 flex flex-1 items-stretch">
                <TopProductsChart data={topProducts} className="h-full min-h-[245px]" />
              </div>
            ) : (
              <div className="flex w-full flex-1 items-center">
                <EmptyState text="Ainda não há itens suficientes para montar o ranking." />
              </div>
            )}
          </article>

          <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-graphite p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-medium">
                  Ofertas montadas
                </p>
                <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.03em]">Combos mais pedidos</h2>
              </div>
              <Gift className="h-5 w-5 text-muted-foreground" />
            </div>
            {topCombos.length > 0 ? (
              <div className="mt-5 flex flex-1 items-stretch">
                <TopProductsChart data={topCombos} className="h-full min-h-[245px]" />
              </div>
            ) : (
              <div className="flex w-full flex-1 items-center">
                <EmptyState text="Os combos aparecerão aqui quando começarem a ser pedidos." />
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-2xl border border-border bg-graphite">
            <div className="flex items-center justify-between gap-4 border-b border-border p-5 md:px-7 md:py-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime">Atividade recente</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.03em]">Últimos pedidos</h2>
              </div>
              <Link
                href="/admin/pedidos"
                className="text-[10px] font-black uppercase tracking-wider text-lime hover:underline"
              >
                Ver todos
              </Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/admin/pedidos"
                    className="group flex items-center gap-3 px-5 py-4 transition hover:bg-lime/[0.025] md:px-7"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-lime">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <strong className="text-xs">#{String(order.number).padStart(5, "0")}</strong>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {order.franchise?.tradeName ?? order.user?.name ?? "Cliente Nacho Man"}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                        {statusLabels[order.status]} · {order._count.items}{" "}
                        {order._count.items === 1 ? "item" : "itens"}
                      </span>
                    </span>
                    <strong className="shrink-0 text-xs text-lime">{formatMoneyFromCents(order.totalInCents)}</strong>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-5 md:p-7">
                <EmptyState text="Os pedidos mais recentes aparecerão aqui." />
              </div>
            )}
          </article>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink href="/admin/produtos" icon={PackageSearch} label="Produtos" detail={`${products} ativos`} />
          <QuickLink href="/admin/campanhas" icon={Tag} label="Campanhas" detail={`${activePromotions} ativas agora`} />
          <QuickLink
            href="/admin/usuarios"
            icon={UsersRound}
            label="Usuários"
            detail={`${userCount} usuários cadastrados`}
          />
          <QuickLink
            href="/admin/pedidos"
            icon={ReceiptText}
            label="Central de pedidos"
            detail={`${awaitingOrders} aguardando ação`}
          />
        </section>
      </div>
    </main>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border bg-background/40 px-5 py-9 text-center text-xs leading-5 text-muted-foreground">
      {text}
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string
  icon: typeof ReceiptText
  label: string
  detail: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-graphite p-4 transition hover:border-lime/30 hover:bg-lime/[0.025]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/15 bg-lime/5 text-lime">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-xs uppercase">{label}</strong>
        <span className="mt-1 block truncate text-[10px] text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-lime" />
    </Link>
  )
}
