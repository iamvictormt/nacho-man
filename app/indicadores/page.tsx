import Link from "next/link"
import {
  ArrowLeft,
  BadgePercent,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  LineChart,
  MapPin,
  PackageSearch,
  ReceiptText,
  RefreshCw,
  Store,
  Timer,
  TrendingUp,
  Users,
  Utensils,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import { SaiposDistributionChart, SaiposRevenueChart } from "@/components/saipos-dashboard-charts"
import { SaiposDashboardFilterMenu } from "@/components/saipos-dashboard-filter-menu"
import { requireIndicatorsAccess } from "@/lib/auth"
import {
  buildAlerts,
  buildDailyRevenue,
  buildHref,
  buildProductMix,
  buildStoreRows,
  getKnownStoreNames,
  getPartnerLabel,
  getPaymentLabel,
  groupBy,
  isCanceled,
  percentChange,
  saleTypeLabels,
  summarizeSales,
  topEntries,
  type SaiposDashboardTone,
} from "@/lib/saipos/dashboard-metrics"
import {
  buildCommercialFinanceInsights,
  buildCustomerInsights,
  buildOperationalInsights,
  buildPaymentInsights,
  buildRawDataInsights,
} from "@/lib/saipos/dashboard-insights"
import {
  getSaiposDashboardItems,
  getSaiposDashboardSales,
  getSaiposProductReferences,
  getSaiposStoreOptionsSource,
} from "@/lib/saipos/dashboard-queries"
import {
  addUtcDays,
  buildPeriodFromMode,
  diffUtcDays,
  getComparisonAnchorDate,
  getPeriodMode,
  getSearchParam,
  getSelectedAnchorDate,
  toBrazilDateInputValue,
  toDateInputValue,
  toPeriodStart,
  toWeekInputValue,
  type PageSearchParams,
} from "@/lib/saipos/period"
import { formatMoneyFromAmount, formatPercent, formatQuantity, formatSignedPercent } from "@/lib/saipos/formatters"

type Tone = SaiposDashboardTone
type DashboardTab =
  | "resumo"
  | "vendas"
  | "ticket"
  | "financeiro"
  | "folha"
  | "operacional"
  | "produtos"
  | "semanal"
  | "mensal"
  | "brutos"

const tabs: Array<{ id: DashboardTab; label: string; icon: LucideIcon; active: boolean }> = [
  { id: "resumo", label: "Resumo Executivo", icon: BarChart3, active: true },
  { id: "vendas", label: "Vendas e Clientes", icon: Users, active: true },
  { id: "ticket", label: "Ticket Médio", icon: TrendingUp, active: true },
  { id: "financeiro", label: "Financeiro & CMV", icon: WalletCards, active: true },
  { id: "folha", label: "Folha de Pagamento", icon: BadgePercent, active: false },
  { id: "operacional", label: "Operacional", icon: Utensils, active: true },
  { id: "produtos", label: "Mix de Produtos", icon: PackageSearch, active: true },
  { id: "semanal", label: "Comparativo Semanal", icon: CalendarDays, active: true },
  { id: "mensal", label: "Comparativo Mensal", icon: LineChart, active: true },
  { id: "brutos", label: "Dados Brutos", icon: Database, active: true },
]

function getTab(searchParams: PageSearchParams): DashboardTab {
  const tab = getSearchParam(searchParams, "tab")
  return tabs.some((item) => item.id === tab) ? (tab as DashboardTab) : "resumo"
}

function buildIndicatorsHref(searchParams: PageSearchParams, updates: Record<string, string | null>) {
  return buildHref(searchParams, updates).replace("/admin/saipos", "/indicadores")
}

export default async function IndicatorsPage({ searchParams }: { searchParams?: Promise<PageSearchParams> }) {
  const user = await requireIndicatorsAccess()
  const resolvedSearchParams = (await searchParams) ?? {}
  const yesterday = addUtcDays(toPeriodStart(toBrazilDateInputValue(new Date())), -1)
  const dayBeforeYesterday = addUtcDays(yesterday, -1)
  const maxDate = toDateInputValue(yesterday)
  const selectedStore = getSearchParam(resolvedSearchParams, "store") ?? "all"
  const activeTab = getTab(resolvedSearchParams)
  const comparisonTab = activeTab === "semanal" || activeTab === "mensal"
  const selectedMode =
    activeTab === "semanal" ? "week" : activeTab === "mensal" ? "month" : getPeriodMode(resolvedSearchParams)
  const selectedDate = getSelectedAnchorDate(selectedMode, resolvedSearchParams, yesterday)
  const selectedComparisonDate = getComparisonAnchorDate(selectedMode, resolvedSearchParams, dayBeforeYesterday)
  const period = buildPeriodFromMode(selectedMode, selectedDate, yesterday)
  const equivalentDays = diffUtcDays(toPeriodStart(period.start), toPeriodStart(period.end))
  const comparisonPeriod = buildPeriodFromMode(selectedMode, selectedComparisonDate, yesterday, equivalentDays)
  const periodStart = toPeriodStart(period.start)
  const comparisonPeriodStart = toPeriodStart(comparisonPeriod.start)
  const periodInputs = {
    day: period.start,
    week: toWeekInputValue(periodStart),
    month: period.start.slice(0, 7),
    year: period.start.slice(0, 4),
  }
  const comparisonPeriodInputs = {
    day: comparisonPeriod.start,
    week: toWeekInputValue(comparisonPeriodStart),
    month: comparisonPeriod.start.slice(0, 7),
    year: comparisonPeriod.start.slice(0, 4),
  }

  const [sales, comparisonSales, productItems, allProductItems, productReferences, storeOptionsSource] =
    await Promise.all([
      getSaiposDashboardSales({ period, selectedStore }),
      getSaiposDashboardSales({ period: comparisonPeriod, selectedStore }),
      getSaiposDashboardItems({ period, selectedStore }),
      getSaiposDashboardItems({ period, selectedStore, includeDeleted: true }),
      getSaiposProductReferences({ selectedStore }),
      getSaiposStoreOptionsSource(),
    ])

  const knownStoreNames = getKnownStoreNames(storeOptionsSource.storeNameRows)
  const storeOptions = storeOptionsSource.storeIds.map((store) => ({
    value: String(store.idStore),
    label: knownStoreNames.get(store.idStore) ?? `Loja #${store.idStore}`,
  }))
  const summary = summarizeSales(sales)
  const comparisonSummary = summarizeSales(comparisonSales)
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const dailyRevenue = buildDailyRevenue(sales, period)
  const storeRows = buildStoreRows({ sales, comparisonSales, knownStoreNames }).slice(0, 8)
  const saleTypes = topEntries(groupBy(validSales, (sale) => saleTypeLabels[sale.idSaleType] ?? "Outro"))
  const partners = topEntries(groupBy(validSales, getPartnerLabel))
  const paymentTypes = topEntries(groupBy(validSales, getPaymentLabel))
  const productMix = buildProductMix(productItems, productReferences)
  const paymentInsights = buildPaymentInsights(sales)
  const financeInsights = buildCommercialFinanceInsights(sales)
  const operationalInsights = buildOperationalInsights(sales, allProductItems)
  const customerInsights = buildCustomerInsights(sales)
  const rawDataInsights = buildRawDataInsights(sales, allProductItems)
  const alerts = buildAlerts({
    summary,
    customerCoverage: validSales.length > 0 ? customerInsights.uniqueCustomers / validSales.length : 0,
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen xl:grid-cols-[280px_1fr]">
        <aside className="border-r border-border bg-graphite xl:sticky xl:top-0 xl:h-screen">
          <div className="flex h-full flex-col gap-6 p-5">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-lime/35"
            >
              <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-12 w-auto" />
              <span className="min-w-0">
                <strong className="block text-xs uppercase text-lime">Indicadores</strong>
                <span className="block truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Saipos BI
                </span>
              </span>
            </Link>

            <Link
              href="/admin"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground transition hover:border-lime/40 hover:text-lime"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao admin
            </Link>

            <nav className="grid gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const selected = tab.id === activeTab
                return (
                  <Link
                    key={tab.id}
                    href={buildIndicatorsHref(resolvedSearchParams, { tab: tab.id })}
                    className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 text-sm transition ${
                      selected
                        ? "border-lime/30 bg-lime/10 text-lime"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                    {/* {!tab.active ? <span className="rounded-full bg-background px-2 py-0.5 text-[9px] uppercase text-muted-foreground">EM BREVE</span> : null} */}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Contexto atual</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {period.label}
                {comparisonTab ? ` comparado com ${comparisonPeriod.label}` : ""}
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 md:px-7">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Nacho Man BI</p>
              <h1 className="mt-2 text-3xl font-black uppercase">{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
              <PeriodSummary
                period={period.label}
                comparisonPeriod={comparisonTab ? comparisonPeriod.label : null}
                userName={user.name}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <SaiposDashboardFilterMenu
                activeTab={activeTab}
                selectedStore={selectedStore}
                storeOptions={storeOptions}
                selectedMode={selectedMode}
                periodInputs={periodInputs}
                comparisonPeriodInputs={comparisonPeriodInputs}
                maxDate={maxDate}
                comparisonEnabled={comparisonTab}
                lockedMode={comparisonTab ? selectedMode : undefined}
              />
              <button className="inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-3 text-xs font-black uppercase text-background transition hover:bg-lime/90">
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>
          </header>

          {activeTab === "resumo" ? (
            <ExecutiveView
              summary={summary}
              storeRows={storeRows}
              alerts={alerts}
              dailyRevenue={dailyRevenue}
              saleTypes={saleTypes}
            />
          ) : null}
          {activeTab === "vendas" ? (
            <SalesView
              summary={summary}
              saleTypes={saleTypes}
              partners={partners}
              paymentTypes={paymentTypes}
              customers={customerInsights}
              operational={operationalInsights}
            />
          ) : null}
          {activeTab === "ticket" ? (
            <TicketView summary={summary} dailyRevenue={dailyRevenue} storeRows={storeRows} />
          ) : null}
          {activeTab === "produtos" ? <ProductsView productMix={productMix} /> : null}
          {activeTab === "financeiro" ? (
            <FinanceView summary={summary} payments={paymentInsights} finance={financeInsights} />
          ) : null}
          {activeTab === "folha" ? (
            <RoadmapView
              title="Folha de Pagamento"
              icon={BadgePercent}
              available="Faturamento Saipos pronto para cruzamento"
              missing={["Salários", "Encargos", "Provisões", "Horas trabalhadas"]}
            />
          ) : null}
          {activeTab === "operacional" ? <OperationalView summary={summary} operational={operationalInsights} /> : null}
          {activeTab === "semanal" ? (
            <ComparisonView
              title="Comparativo semanal"
              periodLabel={period.label}
              comparisonLabel={comparisonPeriod.label}
              summary={summary}
              comparisonSummary={comparisonSummary}
              dailyRevenue={dailyRevenue}
              storeRows={storeRows}
            />
          ) : null}
          {activeTab === "mensal" ? (
            <ComparisonView
              title="Comparativo mensal"
              periodLabel={period.label}
              comparisonLabel={comparisonPeriod.label}
              summary={summary}
              comparisonSummary={comparisonSummary}
              dailyRevenue={dailyRevenue}
              storeRows={storeRows}
            />
          ) : null}
          {activeTab === "brutos" ? (
            <RawDataView rawData={rawDataInsights} productReferences={productReferences.length} />
          ) : null}

          <footer className="mt-8 flex items-center justify-center gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            Dados provenientes da API Saipos · módulo isolado do Nacho Factory
          </footer>
        </section>
      </div>
    </main>
  )
}

function PeriodSummary({
  period,
  comparisonPeriod,
  userName,
}: {
  period: string
  comparisonPeriod: string | null
  userName: string
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-full border border-lime/25 bg-lime/10 px-3 py-1.5 font-bold text-lime">{period}</span>
      {comparisonPeriod ? (
        <>
          <span className="text-muted-foreground">comparado com</span>
          <span className="rounded-full border border-border bg-graphite px-3 py-1.5 font-bold text-foreground">
            {comparisonPeriod}
          </span>
        </>
      ) : null}
      <span className="text-muted-foreground">· {userName}</span>
    </div>
  )
}

function ExecutiveView({
  summary,
  storeRows,
  alerts,
  dailyRevenue,
  saleTypes,
}: {
  summary: ReturnType<typeof summarizeSales>
  storeRows: ReturnType<typeof buildStoreRows>
  alerts: Array<{ title: string; detail: string; tone: Tone }>
  dailyRevenue: ReturnType<typeof buildDailyRevenue>
  saleTypes: Array<{ name: string; value: number }>
}) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <Kpi
          icon={CircleDollarSign}
          label="Faturamento Líquido"
          value={formatMoneyFromAmount(summary.netInCents / 100)}
          detail="Período selecionado"
        />
        <Kpi icon={Store} label="Número de Pedidos" value={String(summary.orders)} detail="Pedidos válidos" />
        <Kpi
          icon={TrendingUp}
          label="Ticket Médio"
          value={formatMoneyFromAmount(summary.averageTicketInCents / 100)}
          detail="Faturamento / pedidos"
        />
        <Kpi
          icon={PackageSearch}
          label="Cancelamentos"
          value={String(summary.canceledOrders)}
          detail={formatPercent(summary.cancellationRate)}
          inverse
        />
        <Kpi icon={BadgePercent} label="% CMV" value="--%" detail="Em implantação" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr_.9fr]">
        <Panel title="Faturamento por canal">
          <SaiposDistributionChart data={saleTypes} />
        </Panel>
        <Panel title="Evolução do faturamento">
          <SaiposRevenueChart data={dailyRevenue} />
        </Panel>
        <Panel title="Alertas">
          <div className="grid gap-3">
            {alerts.map((alert) => (
              <Signal key={alert.title} title={alert.title} detail={alert.detail} tone={alert.tone} />
            ))}
          </div>
        </Panel>
      </div>
      <StoreTable rows={storeRows} />
    </div>
  )
}

function SalesView({
  summary,
  saleTypes,
  partners,
  paymentTypes,
  customers,
  operational,
}: {
  summary: ReturnType<typeof summarizeSales>
  saleTypes: Array<{ name: string; value: number }>
  partners: Array<{ name: string; value: number }>
  paymentTypes: Array<{ name: string; value: number }>
  customers: ReturnType<typeof buildCustomerInsights>
  operational: ReturnType<typeof buildOperationalInsights>
}) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={Users} label="Clientes estimados" value={String(customers.uniqueCustomers)} />
        <Kpi icon={RefreshCw} label="Recorrentes" value={String(customers.recurringCustomers)} />
        <Kpi
          icon={CreditCard}
          label="Com telefone"
          value={formatPercent(summary.orders > 0 ? customers.phoneCustomers / summary.orders : 0)}
        />
        <Kpi
          icon={MapPin}
          label="Pedidos delivery"
          value={formatPercent(summary.orders > 0 ? operational.deliveryOrders / summary.orders : 0)}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Canal de venda">
          <SaiposDistributionChart data={saleTypes} />
        </Panel>
        <Panel title="Origem do pedido">
          <Ranking
            rows={partners.map((item) => ({ ...item, detail: `${item.value} pedidos` }))}
            total={summary.orders}
          />
        </Panel>
        <Panel title="Formas de pagamento">
          <Ranking
            rows={paymentTypes.map((item) => ({ ...item, detail: `${item.value} pedidos` }))}
            total={summary.orders}
          />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Cadastro dos clientes">
          <MetricList
            rows={[
              { label: "Com documento", value: String(customers.documentCustomers) },
              {
                label: "Contato acionável",
                value: formatPercent(summary.orders > 0 ? customers.actionableCustomers / summary.orders : 0),
              },
              {
                label: "Identificação única",
                value: formatPercent(summary.orders > 0 ? customers.uniqueCustomers / summary.orders : 0),
              },
            ]}
          />
        </Panel>
        <Panel title="Bairros de entrega">
          <Ranking rows={operational.districts} total={operational.deliveryOrders} />
        </Panel>
      </div>
    </div>
  )
}

function TicketView({
  summary,
  dailyRevenue,
  storeRows,
}: {
  summary: ReturnType<typeof summarizeSales>
  dailyRevenue: ReturnType<typeof buildDailyRevenue>
  storeRows: ReturnType<typeof buildStoreRows>
}) {
  const ticketRows = dailyRevenue
    .map((day) => ({
      name: day.label,
      value: day.orders > 0 ? day.netInCents / day.orders : 0,
      detail: `${day.orders} pedidos`,
      orders: day.orders,
    }))
    .filter((day) => day.orders > 0)
  const bestDay = [...ticketRows].sort((first, second) => second.value - first.value)[0]
  const lowestDay = [...ticketRows].sort((first, second) => first.value - second.value)[0]

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          label="Ticket Médio"
          value={formatMoneyFromAmount(summary.averageTicketInCents / 100)}
          detail="Período selecionado"
        />
        <Kpi icon={Store} label="Pedidos" value={String(summary.orders)} detail="Pedidos válidos" />
        <Kpi
          icon={CircleDollarSign}
          label="Faturamento"
          value={formatMoneyFromAmount(summary.netInCents / 100)}
          detail="Base do cálculo"
        />
        <Kpi
          icon={PackageSearch}
          label="Cancelamentos"
          value={String(summary.canceledOrders)}
          detail={formatPercent(summary.cancellationRate)}
          inverse
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[.75fr_1.25fr]">
        <Panel title="Leitura do ticket">
          <MetricList
            rows={[
              {
                label: "Maior ticket diário",
                value: bestDay ? `${bestDay.name} · ${formatMoneyFromAmount(bestDay.value / 100)}` : "--",
                strong: true,
              },
              {
                label: "Menor ticket diário",
                value: lowestDay ? `${lowestDay.name} · ${formatMoneyFromAmount(lowestDay.value / 100)}` : "--",
              },
              { label: "Dias com venda", value: String(ticketRows.length) },
              { label: "Faturamento líquido", value: formatMoneyFromAmount(summary.netInCents / 100) },
            ]}
          />
        </Panel>
        <Panel title="Ticket por dia">
          <CompactRanking rows={ticketRows} money limit={8} />
        </Panel>
      </div>

      <StoreTable rows={storeRows} />
    </div>
  )
}

function ComparisonView({
  title,
  periodLabel,
  comparisonLabel,
  summary,
  comparisonSummary,
  dailyRevenue,
  storeRows,
}: {
  title: string
  periodLabel: string
  comparisonLabel: string
  summary: ReturnType<typeof summarizeSales>
  comparisonSummary: ReturnType<typeof summarizeSales>
  dailyRevenue: ReturnType<typeof buildDailyRevenue>
  storeRows: ReturnType<typeof buildStoreRows>
}) {
  const revenueDelta = percentChange(summary.netInCents, comparisonSummary.netInCents)
  const orderDelta = percentChange(summary.orders, comparisonSummary.orders)
  const ticketDelta = percentChange(summary.averageTicketInCents, comparisonSummary.averageTicketInCents)
  const cancellationDelta = percentChange(summary.cancellationRate, comparisonSummary.cancellationRate)

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Kpi
          icon={CircleDollarSign}
          label="Faturamento"
          value={formatMoneyFromAmount(summary.netInCents / 100)}
          detail="Contra referência"
          delta={revenueDelta}
        />
        <Kpi
          icon={Store}
          label="Pedidos"
          value={String(summary.orders)}
          detail="Contra referência"
          delta={orderDelta}
        />
        <Kpi
          icon={TrendingUp}
          label="Ticket Médio"
          value={formatMoneyFromAmount(summary.averageTicketInCents / 100)}
          detail="Contra referência"
          delta={ticketDelta}
        />
        <Kpi
          icon={PackageSearch}
          label="Cancelamentos"
          value={formatPercent(summary.cancellationRate)}
          detail="Contra referência"
          delta={cancellationDelta}
          inverse
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[.75fr_1.25fr]">
        <Panel title={title}>
          <div className="grid gap-4 md:grid-cols-2">
            <ComparisonSnapshot label="Período" period={periodLabel} summary={summary} active />
            <ComparisonSnapshot label="Referência" period={comparisonLabel} summary={comparisonSummary} />
          </div>
        </Panel>
        <Panel title="Evolução do faturamento">
          <SaiposRevenueChart data={dailyRevenue} />
        </Panel>
      </div>

      <StoreTable rows={storeRows} />
    </div>
  )
}

function ComparisonSnapshot({
  label,
  period,
  summary,
  active = false,
}: {
  label: string
  period: string
  summary: ReturnType<typeof summarizeSales>
  active?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${active ? "border-lime/25 bg-lime/10" : "border-border bg-background"}`}>
      <p
        className={`text-[10px] font-black uppercase tracking-[0.16em] ${active ? "text-lime" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <strong className="mt-2 block text-sm">{period}</strong>
      <div className="mt-4">
        <MetricList
          rows={[
            { label: "Faturamento", value: formatMoneyFromAmount(summary.netInCents / 100), strong: active },
            { label: "Pedidos", value: String(summary.orders) },
            { label: "Ticket médio", value: formatMoneyFromAmount(summary.averageTicketInCents / 100) },
            { label: "Cancelamentos", value: formatPercent(summary.cancellationRate) },
          ]}
        />
      </div>
    </div>
  )
}

function ProductsView({ productMix }: { productMix: ReturnType<typeof buildProductMix> }) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={PackageSearch} label="Produtos vendidos" value={formatQuantity(productMix.totalQuantity)} />
        <Kpi
          icon={CircleDollarSign}
          label="Receita por item"
          value={formatMoneyFromAmount(productMix.totalRevenueInCents / 100)}
        />
        <Kpi
          icon={BadgePercent}
          label="Curva A"
          value={formatPercent(
            productMix.totalRevenueInCents > 0 ? productMix.classARevenueInCents / productMix.totalRevenueInCents : 0
          )}
        />
        <Kpi
          icon={ClipboardList}
          label="Sem preço próprio"
          value={String(productMix.zeroRevenueProducts)}
          detail="Itens inclusos"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
        <Panel title="Curva ABC por receita">
          <ProductRows rows={productMix.topProducts} />
        </Panel>
        <div className="grid gap-4">
          <Panel title="Baixo giro com valor">
            <Ranking
              rows={productMix.lowTurnover.map((item) => ({
                name: item.name,
                value: item.quantity,
                detail: formatMoneyFromAmount(item.revenueInCents / 100),
              }))}
            />
          </Panel>
          <Panel title="Adicionais pagos">
            <Ranking
              rows={productMix.choices.map((item) => ({
                name: item.name,
                value: item.quantity,
                detail: formatMoneyFromAmount(item.revenueInCents / 100),
              }))}
            />
          </Panel>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Itens inclusos ou sem preço">
          <Ranking
            rows={productMix.includedItems.map((item) => ({
              name: item.name,
              value: item.quantity,
              detail: "Sem preço próprio na Saipos",
            }))}
          />
        </Panel>
        <Panel title="Escolhas inclusas">
          <Ranking
            rows={productMix.includedChoices.map((item) => ({
              name: item.name,
              value: item.quantity,
              detail: "Incluso no item principal",
            }))}
          />
        </Panel>
      </div>
    </div>
  )
}

function FinanceView({
  summary,
  payments,
  finance,
}: {
  summary: ReturnType<typeof summarizeSales>
  payments: ReturnType<typeof buildPaymentInsights>
  finance: ReturnType<typeof buildCommercialFinanceInsights>
}) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={CircleDollarSign} label="Vendas brutas" value={formatMoneyFromAmount(summary.grossInCents / 100)} />
        <Kpi
          icon={BadgePercent}
          label="Descontos"
          value={formatMoneyFromAmount(summary.discountInCents / 100)}
          detail={formatPercent(summary.grossInCents > 0 ? summary.discountInCents / summary.grossInCents : 0)}
          inverse
        />
        <Kpi
          icon={WalletCards}
          label="Pagamentos lidos"
          value={formatMoneyFromAmount(payments.capturedInCents / 100)}
        />
        <Kpi
          icon={ReceiptText}
          label="NFC-e emitidas"
          value={String(finance.fiscalOrders)}
          detail={formatMoneyFromAmount(finance.fiscalAmountInCents / 100)}
        />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <Panel title="DRE comercial Saipos">
          <FinanceStatement summary={summary} />
        </Panel>
        <Panel title="Pagamentos por valor">
          <CompactRanking rows={payments.rows} money limit={6} />
        </Panel>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Panel title="Receita por canal">
          <CompactRanking rows={finance.partnerRevenue} money limit={6} />
        </Panel>
        <Panel title="Motivos de desconto">
          <CompactRanking rows={finance.discountReasons} money limit={6} />
        </Panel>
        <Panel title="Acréscimos e taxas">
          <CompactRanking rows={finance.increases} money limit={6} />
        </Panel>
      </div>
    </div>
  )
}

function OperationalView({
  summary,
  operational,
}: {
  summary: ReturnType<typeof summarizeSales>
  operational: ReturnType<typeof buildOperationalInsights>
}) {
  const deliveryShare = summary.orders > 0 ? operational.deliveryOrders / summary.orders : 0
  const noDeliveryOrders = Math.max(summary.orders - operational.deliveryOrders, 0)

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          icon={MapPin}
          label="Entregas"
          value={String(operational.deliveryOrders)}
          detail={formatPercent(deliveryShare)}
        />
        <Kpi
          icon={Timer}
          label="Tempo de entrega"
          value={formatMinutes(operational.averageDeliveryMinutes)}
          detail="Média Saipos"
        />
        <Kpi
          icon={Utensils}
          label="Tempo de preparo"
          value={formatMinutes(operational.averagePrepMinutes)}
          detail={`${operational.finishedItems} itens finalizados`}
        />
        <Kpi
          icon={CircleDollarSign}
          label="Taxa média"
          value={formatMoneyFromAmount(operational.averageDeliveryFeeInCents / 100)}
          detail="Delivery"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Movimento por horário">
          <HourHeatmap rows={operational.hours} />
        </Panel>
        <Panel title="Resumo operacional">
          <MetricList
            rows={[
              { label: "Pedidos no período", value: String(summary.orders), strong: true },
              {
                label: "Pedidos com entrega",
                value: `${operational.deliveryOrders} (${formatPercent(deliveryShare)})`,
              },
              { label: "Pedidos sem entrega", value: String(noDeliveryOrders) },
              { label: "Itens removidos", value: String(operational.deletedItems) },
              { label: "Itens com preparo concluído", value: String(operational.finishedItems) },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Praças de entrega">
          <CompactRanking rows={operational.districts} total={operational.deliveryOrders} limit={6} />
        </Panel>
        <Panel title="Responsável pela entrega">
          <DeliveryModeCards rows={operational.deliveryModes} total={operational.deliveryOrders} />
        </Panel>
      </div>
    </div>
  )
}

function RawDataView({
  rawData,
  productReferences,
}: {
  rawData: ReturnType<typeof buildRawDataInsights>
  productReferences: number
}) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          icon={Database}
          label="Vendas carregadas"
          value={String(rawData.sales)}
          detail={`${rawData.validSales} válidas`}
        />
        <Kpi icon={ClipboardList} label="Itens carregados" value={String(rawData.items)} />
        <Kpi icon={PackageSearch} label="Produtos Saipos" value={String(productReferences)} />
        <Kpi
          icon={ReceiptText}
          label="NFC-e no payload"
          value={formatPercent(rawData.validSales > 0 ? rawData.nfce / rawData.validSales : 0)}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
        <Panel title="Cobertura dos dados">
          <MetricList
            rows={[
              {
                label: "Cliente identificado",
                value: formatPercent(rawData.validSales > 0 ? rawData.customers / rawData.validSales : 0),
              },
              {
                label: "Entrega",
                value: formatPercent(rawData.validSales > 0 ? rawData.delivery / rawData.validSales : 0),
              },
              {
                label: "Pagamentos",
                value: formatPercent(rawData.validSales > 0 ? rawData.payments / rawData.validSales : 0),
              },
              {
                label: "SmartPOS",
                value: formatPercent(rawData.validSales > 0 ? rawData.smartpos / rawData.validSales : 0),
              },
              { label: "TEF", value: formatPercent(rawData.validSales > 0 ? rawData.tef / rawData.validSales : 0) },
            ]}
          />
        </Panel>
        <Panel title="Últimas vendas no filtro">
          <RecentSales rows={rawData.recentSales} />
        </Panel>
      </div>
    </div>
  )
}

function RoadmapView({
  title,
  icon: Icon,
  available,
  missing,
}: {
  title: string
  icon: LucideIcon
  available: string
  missing: string[]
}) {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
      <Panel title={title}>
        <Icon className="h-10 w-10 text-lime" />
        <p className="mt-4 text-lg font-black">{available}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área está preparada, mas só será ativada quando a fonte de dados estiver confiável.
        </p>
      </Panel>
      <Panel title="Dados necessários">
        <div className="grid gap-3">
          {missing.map((item) => (
            <Signal key={item} title={item} detail="Pendente para cálculo final." tone="amber" />
          ))}
        </div>
      </Panel>
    </div>
  )
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "--"
  return `${Math.round(value)} min`
}

function FinanceStatement({ summary }: { summary: ReturnType<typeof summarizeSales> }) {
  const discountShare = summary.grossInCents > 0 ? summary.discountInCents / summary.grossInCents : 0
  const cancellationShare = summary.grossInCents > 0 ? summary.canceledInCents / summary.grossInCents : 0

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-lime/20 bg-lime/10 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Resultado do período</p>
        <strong className="mt-3 block text-3xl leading-none text-lime">
          {formatMoneyFromAmount(summary.netInCents / 100)}
        </strong>
        <p className="mt-2 text-xs text-muted-foreground">
          {summary.orders} pedidos válidos · {formatMoneyFromAmount(summary.grossInCents / 100)} em vendas brutas
        </p>
      </div>
      <MetricList
        rows={[
          { label: "Vendas brutas", value: formatMoneyFromAmount(summary.grossInCents / 100) },
          {
            label: "Descontos",
            value: `-${formatMoneyFromAmount(summary.discountInCents / 100)} (${formatPercent(discountShare)})`,
          },
          { label: "Acréscimos e taxas", value: formatMoneyFromAmount(summary.increaseInCents / 100) },
          {
            label: "Cancelamentos",
            value: `-${formatMoneyFromAmount(summary.canceledInCents / 100)} (${formatPercent(cancellationShare)})`,
          },
        ]}
      />
    </div>
  )
}

function MetricList({ rows }: { rows: Array<{ label: string; value: string; strong?: boolean }> }) {
  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="flex min-h-11 items-center justify-between gap-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{row.label}</span>
          <strong className={row.strong ? "text-base text-lime" : ""}>{row.value}</strong>
        </div>
      ))}
    </div>
  )
}

function HourHeatmap({ rows }: { rows: Array<{ name: string; value: number; detail: string }> }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados de horário no período.</p>

  const max = Math.max(...rows.map((row) => row.value), 1)
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  const peak = [...rows].sort((first, second) => second.value - first.value)[0]
  const topHours = [...rows].sort((first, second) => second.value - first.value).slice(0, 5)

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-lime/20 bg-lime/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Pico do período</p>
          <strong className="mt-3 block text-4xl leading-none text-lime">{peak.name}</strong>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {formatQuantity(peak.value)} pedidos, {formatPercent(total > 0 ? peak.value / total : 0)} do movimento.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Mapa de calor
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">{formatQuantity(total)} pedidos</span>
          </div>
          <div className="grid grid-cols-6 gap-2 xl:grid-cols-12">
            {rows.map((row, index) => {
              const intensity = row.value / max
              return (
                <div key={`${row.name}-${index}`} className="grid gap-1 text-center">
                  <div
                    className="h-11 rounded-lg border border-lime/15 bg-lime/10"
                    style={{ opacity: Math.max(0.2, intensity) }}
                    title={`${row.name}: ${formatQuantity(row.value)} pedidos`}
                  />
                  <span className="text-[10px] font-bold text-muted-foreground">{row.name.replace("h", "")}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {topHours.map((row, index) => (
          <div key={`${row.name}-${index}`} className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] font-black uppercase text-muted-foreground">{index + 1}. horário</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <strong className="text-xl text-lime">{row.name}</strong>
              <span className="text-xs font-black">{formatQuantity(row.value)}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{formatPercent(total > 0 ? row.value / total : 0)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompactRanking({
  rows,
  total,
  limit = 5,
  money = false,
}: {
  rows: Array<{ name: string; value: number; detail: string }>
  total?: number
  limit?: number
  money?: boolean
}) {
  const visibleRows = rows.slice(0, limit)
  const max = Math.max(...visibleRows.map((row) => row.value), 1)
  if (visibleRows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>

  return (
    <div className="grid gap-3">
      {visibleRows.map((row, index) => (
        <div key={`${row.name}-${index}`} className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-[10px] font-black text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{row.name}</span>
              <strong className="shrink-0">
                {money
                  ? formatMoneyFromAmount(row.value / 100)
                  : total
                    ? formatPercent(row.value / total)
                    : formatQuantity(row.value)}
              </strong>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-lime"
                style={{ width: `${Math.max(5, (row.value / max) * 100)}%` }}
              />
            </div>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">{row.detail}</span>
        </div>
      ))}
    </div>
  )
}

function DeliveryModeCards({
  rows,
  total,
}: {
  rows: Array<{ name: string; value: number; detail: string }>
  total: number
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados de entrega no período.</p>

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {rows.slice(0, 3).map((row, index) => (
        <div key={`${row.name}-${index}`} className="rounded-xl border border-border bg-background p-4">
          <p className="min-h-10 text-xs font-black uppercase leading-5 text-muted-foreground">{row.name}</p>
          <strong className="mt-3 block text-2xl text-lime">{formatPercent(total > 0 ? row.value / total : 0)}</strong>
          <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>
        </div>
      ))}
    </div>
  )
}

function RecentSales({
  rows,
}: {
  rows: Array<{
    id: string
    saleNumber: number | null
    idSale: string
    partner: string
    customer: string
    district: string
    amountInCents: number
    canceled: boolean
  }>
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem vendas no período.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-3">Venda</th>
            <th>Canal</th>
            <th>Cliente</th>
            <th>Praça</th>
            <th>Status</th>
            <th className="text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="py-3 font-black">{row.saleNumber ? `#${row.saleNumber}` : row.idSale}</td>
              <td>{row.partner}</td>
              <td>{row.customer}</td>
              <td>{row.district}</td>
              <td className={row.canceled ? "text-red-400" : "text-lime"}>{row.canceled ? "Cancelada" : "Válida"}</td>
              <td className="text-right font-black text-lime">{formatMoneyFromAmount(row.amountInCents / 100)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  detail = "Hoje",
  delta,
  inverse = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail?: string
  delta?: number | null
  inverse?: boolean
}) {
  const good = delta === undefined || delta === null || (inverse ? delta <= 0 : delta >= 0)
  return (
    <article className="rounded-2xl border border-border bg-graphite p-5 shadow-[0_18px_70px_rgba(0,0,0,.22)]">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-lime">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <strong className="mt-2 block truncate text-2xl">{value}</strong>
          <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
        </div>
      </div>
      {delta !== undefined ? (
        <p className={`mt-3 text-right text-xs font-black ${good ? "text-lime" : "text-red-400"}`}>
          {formatSignedPercent(delta)}
        </p>
      ) : null}
    </article>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-border bg-graphite p-5 shadow-[0_18px_70px_rgba(0,0,0,.2)]">
      <h2 className="text-sm font-black uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  )
}

function Ranking({
  rows,
  total,
  money = false,
}: {
  rows: Array<{ name: string; value: number; detail: string }>
  total?: number
  money?: boolean
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>
  return (
    <div className="grid gap-4">
      {rows.map((row, index) => (
        <div key={`${row.name}-${index}`}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">
              {index + 1}. {row.name}
            </span>
            <strong>
              {money
                ? formatMoneyFromAmount(row.value / 100)
                : total
                  ? formatPercent(row.value / total)
                  : formatQuantity(row.value)}
            </strong>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-lime"
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProductRows({ rows }: { rows: ReturnType<typeof buildProductMix>["topProducts"] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem produtos Saipos no período.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-3">Produto Saipos</th>
            <th>Qtd.</th>
            <th>Receita</th>
            <th>Curva</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => (
            <tr key={`${row.name}-${index}`}>
              <td className="py-3">
                <strong>{row.name}</strong>
                {row.integrationCode ? (
                  <span className="ml-2 text-xs text-muted-foreground">PDV {row.integrationCode}</span>
                ) : null}
              </td>
              <td>{formatQuantity(row.quantity)}</td>
              <td className="font-black text-lime">{formatMoneyFromAmount(row.revenueInCents / 100)}</td>
              <td>{row.abc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StoreTable({ rows }: { rows: ReturnType<typeof buildStoreRows> }) {
  if (rows.length === 0)
    return (
      <Panel title="Unidades">
        <p className="text-sm text-muted-foreground">Sem vendas para ranking.</p>
      </Panel>
    )
  return (
    <Panel title="Ranking de unidades">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-3">Unidade</th>
              <th>Faturamento</th>
              <th>Pedidos</th>
              <th>Ticket</th>
              <th>Cancel.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, index) => (
              <tr key={row.idStore}>
                <td className="py-3">
                  {index + 1}. {row.name}
                </td>
                <td className="font-black text-lime">{formatMoneyFromAmount(row.revenueInCents / 100)}</td>
                <td>{row.orders}</td>
                <td>{formatMoneyFromAmount(row.averageTicketInCents / 100)}</td>
                <td>{formatPercent(row.cancellationRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function Signal({ title, detail, tone }: { title: string; detail: string; tone: Tone }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p
        className={`text-xs font-black uppercase ${tone === "amber" ? "text-lime" : tone === "purple" ? "text-purple-medium" : "text-lime"}`}
      >
        {title}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}
