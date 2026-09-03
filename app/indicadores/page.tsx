import Link from "next/link"
import {
  AlertTriangle,
  BadgePercent,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Database,
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
import { SaiposDashboardContentShell } from "@/components/saipos-dashboard-content-shell"
import { SaiposDashboardFilterMenu } from "@/components/saipos-dashboard-filter-menu"
import { SaiposAdminExitButton } from "@/components/saipos-admin-exit-button"
import { SaiposExportLink } from "@/components/saipos-export-link"
import { SaiposMobileMenu } from "@/components/saipos-mobile-menu"
import { IndicatorsListModal } from "@/components/indicators-list-modal"
import { requireIndicatorsAccess } from "@/lib/auth"
import {
  buildAlerts,
  buildDailyRevenue,
  buildEstimatedCmv,
  buildHref,
  buildProductMix,
  buildSaleTypeDistribution,
  buildStoreRows,
  getKnownStoreNames,
  getPartnerLabel,
  getPaymentLabel,
  groupBy,
  isCanceled,
  percentChange,
  summarizeSales,
  topEntries,
  type SaiposDashboardAlert,
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
  getSaiposStockCmv,
  getSaiposStoreOptionsSource,
} from "@/lib/saipos/dashboard-queries"
import {
  addUtcDays,
  buildSamePeriodPreviousMonth,
  buildPeriodFromMode,
  diffUtcDays,
  getComparisonAnchorDate,
  getPeriodMode,
  getPreviousPeriodAnchorDate,
  getSearchParam,
  getSelectedAnchorDate,
  toBrazilDateInputValue,
  toDateInputValue,
  toPeriodStart,
  toWeekInputValue,
  type PageSearchParams,
  type SaiposPeriodMode,
} from "@/lib/saipos/period"
import { formatMoneyFromAmount, formatPercent, formatQuantity, formatSignedPercent } from "@/lib/saipos/formatters"

type DashboardTab =
  | "resumo"
  | "vendas"
  | "alertas"
  | "ticket"
  | "financeiro"
  | "operacional"
  | "projecao"
  | "produtos"
  | "semanal"
  | "mensal"
  | "brutos"

const tabs: Array<{ id: DashboardTab; label: string; icon: LucideIcon; active: boolean }> = [
  { id: "resumo", label: "Resumo Executivo", icon: BarChart3, active: true },
  { id: "alertas", label: "Alertas", icon: AlertTriangle, active: true },
  { id: "vendas", label: "Vendas e Clientes", icon: Users, active: true },
  { id: "ticket", label: "Ticket Médio", icon: TrendingUp, active: true },
  { id: "financeiro", label: "Financeiro & CMV", icon: WalletCards, active: true },
  { id: "operacional", label: "Operacional", icon: Utensils, active: true },
  { id: "projecao", label: "Projeção de Vendas", icon: CircleDollarSign, active: true },
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

function buildExportHref(searchParams: PageSearchParams) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value)
  }

  const query = params.toString()
  return query ? `/api/indicadores/export?${query}` : "/api/indicadores/export"
}

function getMonthBoundaryPeriod(period: { start: string }) {
  const start = toPeriodStart(period.start)
  const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))

  return {
    start: toDateInputValue(monthStart),
    end: toDateInputValue(monthEnd),
  }
}

function countScheduledOpenDays(period: { start: string; end: string }, openDaysPerWeek: number) {
  const closedDaysPerWeek = Math.max(0, 7 - openDaysPerWeek)
  const closedWeekdays = Array.from({ length: closedDaysPerWeek }, (_, index) => index)
  let current = toPeriodStart(period.start)
  const end = toPeriodStart(period.end)
  let days = 0

  while (current <= end) {
    if (!closedWeekdays.includes(current.getUTCDay())) days += 1
    current = addUtcDays(current, 1)
  }

  return days
}

function buildSalesProjection(sales: Awaited<ReturnType<typeof getSaiposDashboardSales>>, period: { start: string; end: string }) {
  const validSales = sales.filter((sale) => !isCanceled(sale))
  const summary = summarizeSales(sales)
  const monthPeriod = getMonthBoundaryPeriod(period)
  const daysElapsed = diffUtcDays(toPeriodStart(period.start), toPeriodStart(period.end))
  const daysInMonth = diffUtcDays(toPeriodStart(monthPeriod.start), toPeriodStart(monthPeriod.end))
  const activeDays = new Set(
    validSales.map((sale) => (sale.shiftDate ? toDateInputValue(sale.shiftDate) : toBrazilDateInputValue(sale.createdAtSaipos)))
  ).size
  const buildScenario = (openDaysPerWeek: number) => {
    const openDaysElapsed = countScheduledOpenDays(period, openDaysPerWeek)
    const openDaysInMonth = countScheduledOpenDays(monthPeriod, openDaysPerWeek)
    const averageDailyGrossInCents = openDaysElapsed > 0 ? summary.grossInCents / openDaysElapsed : 0
    const projectedGrossInCents = Math.round(averageDailyGrossInCents * openDaysInMonth)

    return {
      openDaysPerWeek,
      openDaysElapsed,
      openDaysInMonth,
      averageDailyGrossInCents,
      projectedGrossInCents,
      remainingOpenDays: Math.max(openDaysInMonth - openDaysElapsed, 0),
      projectedRemainingInCents: Math.max(projectedGrossInCents - summary.grossInCents, 0),
    }
  }

  return {
    period,
    monthPeriod,
    daysElapsed,
    daysInMonth,
    activeDays,
    grossInCents: summary.grossInCents,
    orders: summary.orders,
    primary: buildScenario(6),
    scenarios: [buildScenario(5), buildScenario(6), buildScenario(7)],
  }
}

export default async function IndicatorsPage({ searchParams }: { searchParams?: Promise<PageSearchParams> }) {
  const user = await requireIndicatorsAccess()
  const resolvedSearchParams = (await searchParams) ?? {}
  const yesterday = addUtcDays(toPeriodStart(toBrazilDateInputValue(new Date())), -1)
  const maxDate = toDateInputValue(yesterday)
  const selectedStore = getSearchParam(resolvedSearchParams, "store") ?? "all"
  const activeTab = getTab(resolvedSearchParams)
  const comparisonTab = activeTab === "semanal" || activeTab === "mensal"
  const projectionTab = activeTab === "projecao"
  const selectedMode =
    activeTab === "semanal"
      ? "week"
      : activeTab === "mensal" || projectionTab
        ? "month"
        : getPeriodMode(resolvedSearchParams)
  const selectedDate = getSelectedAnchorDate(selectedMode, resolvedSearchParams, yesterday)
  const period = buildPeriodFromMode(selectedMode, selectedDate, yesterday)
  const equivalentDays = diffUtcDays(toPeriodStart(period.start), toPeriodStart(period.end))
  const samePeriodPreviousMonth = buildSamePeriodPreviousMonth(period)
  const previousPeriodAnchorDate = getPreviousPeriodAnchorDate(selectedMode, toPeriodStart(period.start))
  const requestedComparisonDate = getComparisonAnchorDate(selectedMode, resolvedSearchParams, previousPeriodAnchorDate)
  const requestedComparisonPeriod = buildPeriodFromMode(
    selectedMode,
    requestedComparisonDate,
    yesterday,
    equivalentDays
  )
  const comparisonPeriod =
    requestedComparisonPeriod.start === period.start && requestedComparisonPeriod.end === period.end
      ? buildPeriodFromMode(selectedMode, previousPeriodAnchorDate, yesterday, equivalentDays)
      : requestedComparisonPeriod
  const periodStart = toPeriodStart(period.start)
  const comparisonPeriodStart = toPeriodStart(comparisonPeriod.start)
  const comparisonMaxDate = toDateInputValue(addUtcDays(periodStart, -1))
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

  const [
    sales,
    comparisonSales,
    previousMonthSales,
    productItems,
    allProductItems,
    productReferences,
    stockCmv,
    storeOptionsSource,
  ] =
    await Promise.all([
      getSaiposDashboardSales({ period, selectedStore }),
      getSaiposDashboardSales({ period: comparisonPeriod, selectedStore }),
      getSaiposDashboardSales({ period: samePeriodPreviousMonth, selectedStore }),
      getSaiposDashboardItems({ period, selectedStore }),
      getSaiposDashboardItems({ period, selectedStore, includeDeleted: true }),
      getSaiposProductReferences({ selectedStore }),
      getSaiposStockCmv({ period, selectedStore }),
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
  const comparisonDailyRevenue = buildDailyRevenue(comparisonSales, comparisonPeriod)
  const previousMonthDailyRevenue = buildDailyRevenue(previousMonthSales, samePeriodPreviousMonth)
  const storeRows = buildStoreRows({ sales, comparisonSales, knownStoreNames })
  const saleTypes = buildSaleTypeDistribution(validSales)
  const partners = topEntries(groupBy(validSales, getPartnerLabel), Number.MAX_SAFE_INTEGER)
  const paymentTypes = topEntries(groupBy(validSales, getPaymentLabel), Number.MAX_SAFE_INTEGER)
  const productMix = buildProductMix(productItems, productReferences)
  const estimatedCmv = buildEstimatedCmv(stockCmv)
  const paymentInsights = buildPaymentInsights(sales)
  const financeInsights = buildCommercialFinanceInsights(sales)
  const operationalInsights = buildOperationalInsights(sales, allProductItems)
  const customerInsights = buildCustomerInsights(sales)
  const rawDataInsights = buildRawDataInsights(sales, allProductItems)
  const salesProjection = buildSalesProjection(sales, period)
  const alerts = buildAlerts({
    summary,
    customerCoverage: validSales.length > 0 ? customerInsights.uniqueCustomers / validSales.length : 0,
    dailyRevenue,
    storeRows,
    saleTypes,
    productMix,
    operational: operationalInsights,
    payments: paymentInsights,
    periodMode: selectedMode,
  })
  const mobileTabs = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    href: buildIndicatorsHref(resolvedSearchParams, { tab: tab.id }),
    icon: tab.id,
    selected: tab.id === activeTab,
  }))

  return (
    <main className="min-h-screen touch-pan-y overflow-x-hidden bg-background text-foreground">
      <SaiposMobileMenu tabs={mobileTabs} />
      <div className="min-h-screen xl:block">
        <aside className="hidden border-border bg-graphite/95 backdrop-blur xl:fixed xl:inset-y-0 xl:left-0 xl:z-30 xl:block xl:w-[280px] xl:overflow-hidden xl:border-r">
          <div className="flex h-dvh min-h-0 flex-col gap-6 p-5">
            <div className="grid min-w-0 gap-4">
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background p-3">
                <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-12 w-auto shrink-0" />
                <span className="min-w-0">
                  <strong className="block text-xs uppercase text-lime">Indicadores</strong>
                  <span className="block truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Saipos BI
                  </span>
                </span>
              </div>
              <SaiposAdminExitButton />
            </div>

            <nav className="grid gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const selected = tab.id === activeTab
                return (
                  <Link
                    key={tab.id}
                    href={buildIndicatorsHref(resolvedSearchParams, { tab: tab.id })}
                    data-saipos-loading="content"
                    className={`flex min-h-12 min-w-0 items-center gap-3 rounded-xl border px-3 text-sm transition ${
                      selected
                        ? "border-lime/30 bg-lime/10 text-lime"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{tab.label}</span>
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

        <section className="min-w-0 max-w-full touch-pan-y overflow-x-hidden px-3 py-5 sm:px-4 md:px-7 xl:ml-[280px]">
          <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Nacho Man BI</p>
              <h1 className="mt-2 text-2xl font-black uppercase leading-tight sm:text-3xl">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h1>
              <PeriodSummary
                period={period.label}
                comparisonPeriod={comparisonTab ? comparisonPeriod.label : null}
                userName={user.name}
              />
            </div>
            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:flex sm:w-auto">
              <SaiposDashboardFilterMenu
                activeTab={activeTab}
                selectedStore={selectedStore}
                storeOptions={storeOptions}
                selectedMode={selectedMode}
                periodInputs={periodInputs}
                comparisonPeriodInputs={comparisonPeriodInputs}
                maxDate={maxDate}
                comparisonMaxDate={comparisonMaxDate}
                comparisonEnabled={comparisonTab}
                lockedMode={comparisonTab || projectionTab ? selectedMode : undefined}
              />
              <SaiposExportLink href={buildExportHref(resolvedSearchParams)} />
            </div>
          </header>

          <SaiposDashboardContentShell>
            {activeTab === "resumo" ? (
              <ExecutiveView
                summary={summary}
                storeRows={storeRows}
                dailyRevenue={dailyRevenue}
                previousMonthDailyRevenue={previousMonthDailyRevenue}
                saleTypes={saleTypes}
                alerts={alerts}
                customers={customerInsights}
                operational={operationalInsights}
                payments={paymentInsights}
                estimatedCmv={estimatedCmv}
              />
            ) : null}
            {activeTab === "alertas" ? (
              <AlertsView alerts={alerts} periodLabel={period.label} periodMode={selectedMode} />
            ) : null}
            {activeTab === "vendas" ? (
              <SalesView
                summary={summary}
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
              <FinanceView
                summary={summary}
                payments={paymentInsights}
                finance={financeInsights}
                estimatedCmv={estimatedCmv}
              />
            ) : null}
            {activeTab === "operacional" ? (
              <OperationalView summary={summary} operational={operationalInsights} />
            ) : null}
            {activeTab === "projecao" ? (
              <SalesProjectionView projection={salesProjection} periodLabel={period.label} selectedStore={selectedStore} />
            ) : null}
            {activeTab === "semanal" ? (
              <ComparisonView
                title="Comparativo semanal"
                periodLabel={period.label}
                comparisonLabel={comparisonPeriod.label}
                summary={summary}
                comparisonSummary={comparisonSummary}
                dailyRevenue={dailyRevenue}
                comparisonDailyRevenue={comparisonDailyRevenue}
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
                comparisonDailyRevenue={comparisonDailyRevenue}
                storeRows={storeRows}
              />
            ) : null}
            {activeTab === "brutos" ? (
              <RawDataView rawData={rawDataInsights} productReferences={productReferences.length} />
            ) : null}
          </SaiposDashboardContentShell>

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
  dailyRevenue,
  previousMonthDailyRevenue,
  saleTypes,
  alerts,
  customers,
  operational,
  payments,
  estimatedCmv,
}: {
  summary: ReturnType<typeof summarizeSales>
  storeRows: ReturnType<typeof buildStoreRows>
  dailyRevenue: ReturnType<typeof buildDailyRevenue>
  previousMonthDailyRevenue: ReturnType<typeof buildDailyRevenue>
  saleTypes: ReturnType<typeof buildSaleTypeDistribution>
  alerts: SaiposDashboardAlert[]
  customers: ReturnType<typeof buildCustomerInsights>
  operational: ReturnType<typeof buildOperationalInsights>
  payments: ReturnType<typeof buildPaymentInsights>
  estimatedCmv: ReturnType<typeof buildEstimatedCmv>
}) {
  const activeDays = dailyRevenue.filter((day) => day.orders > 0)
  const bestDay = [...activeDays].sort((first, second) => second.netInCents - first.netInCents)[0]
  const weakestDay = [...activeDays].sort((first, second) => first.netInCents - second.netInCents)[0]
  const topStore = storeRows[0]
  const topStoreShare = topStore && summary.netInCents > 0 ? topStore.revenueInCents / summary.netInCents : 0
  const customerCoverage = summary.orders > 0 ? customers.uniqueCustomers / summary.orders : 0
  const deliveryShare = summary.orders > 0 ? operational.deliveryOrders / summary.orders : 0
  const hasUnitComparison = storeRows.length > 1
  const criticalAlerts = alerts.filter((alert) => alert.severity === "Atenção").slice(0, 3)
  const visibleAlerts = criticalAlerts.length > 0 ? criticalAlerts : alerts.slice(0, 3)
  const estimatedCmvRate =
    summary.netInCents > 0 && estimatedCmv.estimatedCostInCents > 0
      ? estimatedCmv.estimatedCostInCents / summary.netInCents
      : null

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
          value={formatMoneyFromAmount(summary.canceledInCents / 100)}
          detail={formatCancellationDetail(summary)}
          inverse
        />
        <Kpi
          icon={BadgePercent}
          label="% CMV"
          value={estimatedCmvRate === null ? "--%" : formatPercent(estimatedCmvRate)}
          detail={
            estimatedCmvRate === null
              ? "Endpoint de estoque Saipos sem dados"
              : estimatedCmv.source === "stock"
                ? `${formatMoneyFromAmount(estimatedCmv.estimatedCostInCents / 100)} · ${estimatedCmv.movementCount} movimentos`
                : `${formatMoneyFromAmount(estimatedCmv.estimatedCostInCents / 100)} estimado · ${formatPercent(estimatedCmv.revenueCoverage)} cobertura`
          }
          inverse
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.78fr_1.22fr]">
        <Panel title="Faturamento por canal">
          <div className="flex min-h-[360px] items-center justify-center">
            <SaiposDistributionChart data={saleTypes} />
          </div>
        </Panel>
        <Panel title="Evolução do faturamento">
          <SaiposRevenueChart data={dailyRevenue} comparisonData={previousMonthDailyRevenue} />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Leitura rápida">
          <QuickReadPanel
            bestDay={bestDay}
            weakestDay={weakestDay}
            summary={summary}
            hasUnitComparison={hasUnitComparison}
            topStore={topStore}
            topStoreShare={topStoreShare}
            customerCoverage={customerCoverage}
            deliveryShare={deliveryShare}
            splitPaymentOrders={payments.splitPaymentOrders}
          />
        </Panel>
        <Panel title="Saúde operacional e clientes">
          <MetricList
            rows={[
              {
                label: "Clientes identificáveis",
                value: formatPercent(customerCoverage),
                strong: customerCoverage >= 0.6,
              },
              { label: "Peso do delivery", value: formatPercent(deliveryShare) },
              { label: "Tempo médio de entrega", value: formatMinutes(operational.averageDeliveryMinutes) },
              { label: "Tempo médio de preparo", value: formatMinutes(operational.averagePrepMinutes) },
              { label: "Itens removidos", value: String(operational.deletedItems) },
              { label: "Itens finalizados", value: String(operational.finishedItems) },
            ]}
          />
        </Panel>
      </div>
      <Panel title="Principais sinais">
        <div className="grid gap-3 md:grid-cols-3">
          {visibleAlerts.map((alert) => (
            <ExecutiveSignal key={alert.title} alert={alert} />
          ))}
        </div>
      </Panel>
      <StoreTable rows={storeRows} />
    </div>
  )
}

function ExecutiveSignal({ alert }: { alert: SaiposDashboardAlert }) {
  const toneClass =
    alert.severity === "Atenção"
      ? "border-lime/30 bg-lime/10 text-lime"
      : alert.severity === "Oportunidade"
        ? "border-purple-medium/30 bg-purple-medium/10 text-purple-medium"
        : "border-border bg-background text-muted-foreground"

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase leading-5 text-foreground">{alert.title}</p>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${toneClass}`}>
          {alert.metric}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{alert.detail}</p>
    </div>
  )
}

function AlertsView({
  alerts,
  periodLabel,
  periodMode,
}: {
  alerts: SaiposDashboardAlert[]
  periodLabel: string
  periodMode: SaiposPeriodMode
}) {
  const attention = alerts.filter((alert) => alert.severity === "Atenção")
  const opportunities = alerts.filter((alert) => alert.severity === "Oportunidade")
  const stable = alerts.filter((alert) => alert.severity === "Estável")
  const visibleAlerts = selectRelevantAlerts(alerts, periodMode)
  const modeLabel =
    periodMode === "day"
      ? "operação do dia"
      : periodMode === "week"
        ? "ritmo semanal"
        : periodMode === "month"
          ? "visão mensal"
          : "visão anual"

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={AlertTriangle} label="Sinais relevantes" value={String(visibleAlerts.length)} detail={periodLabel} />
        <Kpi icon={BadgePercent} label="Atenção" value={String(attention.length)} detail={modeLabel} inverse />
        <Kpi icon={TrendingUp} label="Oportunidades" value={String(opportunities.length)} detail={modeLabel} />
        <Kpi
          icon={Store}
          label="Detectados"
          value={String(alerts.length)}
          detail={`${stable.length} sinais estáveis`}
        />
      </div>

      <div className="grid gap-4">
        <Panel title={`Prioridades do período · ${periodLabel}`}>
          <PriorityBoard alerts={visibleAlerts} />
        </Panel>
      </div>
    </div>
  )
}

function selectRelevantAlerts(alerts: SaiposDashboardAlert[], periodMode: SaiposPeriodMode) {
  const priorityWords: Record<SaiposPeriodMode, string[]> = {
    day: ["Plantão", "diária", "Entrega", "Preparo", "Horário", "Pico", "Cancelamento", "Pagamento"],
    week: ["semana", "Dia", "Faturamento", "Pico", "Delivery", "Unidade", "Cancelamento", "Ritmo"],
    month: ["mensal", "mês", "Mix", "Descontos", "Ticket", "Canal", "Produto", "Curva", "Unidade"],
    year: ["anual", "ano", "Curva", "Canal", "Mix", "Unidade", "Ticket", "Descontos", "Receita"],
  }
  const scoreAlert = (alert: SaiposDashboardAlert) => {
    const severityScore = alert.severity === "Atenção" ? 300 : alert.severity === "Oportunidade" ? 200 : 80
    const text = `${alert.title} ${alert.detail}`
    const modeScore = priorityWords[periodMode].reduce((score, word) => score + (text.includes(word) ? 30 : 0), 0)
    return severityScore + modeScore
  }
  const ordered = [...alerts].sort((first, second) => scoreAlert(second) - scoreAlert(first))
  const attention = ordered.filter((alert) => alert.severity === "Atenção").slice(0, 6)
  const opportunities = ordered.filter((alert) => alert.severity === "Oportunidade").slice(0, 10 - attention.length)
  const stableWhitelist = new Set([
    "Operação estável",
    "Alto volume operacional",
    "Ticket médio forte",
    "Entrega em bom ritmo",
  ])
  const stable =
    attention.length + opportunities.length < 4
      ? alerts.filter((alert) => alert.severity === "Estável" && stableWhitelist.has(alert.title)).slice(0, 4)
      : []
  const selected = [...attention, ...opportunities, ...stable]
  return selected.length > 0 ? selected.slice(0, 10) : alerts.slice(0, 1)
}

function PriorityBoard({ alerts }: { alerts: SaiposDashboardAlert[] }) {
  const severityWeight: Record<SaiposDashboardAlert["severity"], number> = {
    Atenção: 0,
    Oportunidade: 1,
    Estável: 2,
  }
  const orderedAlerts = [...alerts].sort(
    (first, second) => severityWeight[first.severity] - severityWeight[second.severity]
  )
  const featuredAlert = orderedAlerts[0]
  const secondaryAlerts = orderedAlerts.filter((alert) => alert.title !== featuredAlert?.title)

  if (!featuredAlert) {
    return (
      <div className="rounded-xl border border-border bg-background p-5">
        <p className="text-sm text-muted-foreground">Sem alertas para o período selecionado.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <Signal alert={featuredAlert} featured />
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {secondaryAlerts.map((alert) => (
          <Signal key={alert.title} alert={alert} />
        ))}
      </div>
    </div>
  )
}

function QuickReadPanel({
  bestDay,
  weakestDay,
  summary,
  hasUnitComparison,
  topStore,
  topStoreShare,
  customerCoverage,
  deliveryShare,
  splitPaymentOrders,
}: {
  bestDay: ReturnType<typeof buildDailyRevenue>[number] | undefined
  weakestDay: ReturnType<typeof buildDailyRevenue>[number] | undefined
  summary: ReturnType<typeof summarizeSales>
  hasUnitComparison: boolean
  topStore: ReturnType<typeof buildStoreRows>[number] | undefined
  topStoreShare: number
  customerCoverage: number
  deliveryShare: number
  splitPaymentOrders: number
}) {
  const secondaryRows = [
    hasUnitComparison
      ? {
          label: "Unidade mais forte",
          value: topStore ? formatPercent(topStoreShare) : "--",
          detail: topStore?.name ?? "Sem ranking",
        }
      : {
          label: "Ticket médio",
          value: formatMoneyFromAmount(summary.averageTicketInCents / 100),
          detail: `${summary.orders} pedidos válidos`,
        },
    hasUnitComparison
      ? {
          label: "Clientes identificáveis",
          value: formatPercent(customerCoverage),
          detail: "Base reconhecida",
        }
      : {
          label: "Cancelamentos",
          value: formatMoneyFromAmount(summary.canceledInCents / 100),
          detail: formatCancellationDetail(summary),
        },
    {
      label: "Delivery",
      value: formatPercent(deliveryShare),
      detail: "Peso no período",
    },
    {
      label: "Pagamentos divididos",
      value: String(splitPaymentOrders),
      detail: "Pedidos com múltiplos meios",
    },
  ]

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-lime/25 bg-lime/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime">Melhor dia</p>
          <strong className="mt-2 block text-2xl leading-tight">
            {bestDay ? formatMoneyFromAmount(bestDay.netInCents / 100) : "--"}
          </strong>
          <p className="mt-2 text-xs text-muted-foreground">
            {bestDay ? `${bestDay.label} · ${bestDay.orders} pedidos` : "Sem venda no período"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Dia mais fraco</p>
          <strong className="mt-2 block text-2xl leading-tight">
            {weakestDay ? formatMoneyFromAmount(weakestDay.netInCents / 100) : "--"}
          </strong>
          <p className="mt-2 text-xs text-muted-foreground">
            {weakestDay ? `${weakestDay.label} · ${weakestDay.orders} pedidos` : "Sem venda no período"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {secondaryRows.map((row) => (
          <div key={row.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{row.label}</p>
            <strong className="mt-2 block break-words text-xl leading-tight text-lime">{row.value}</strong>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{row.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SalesView({
  summary,
  partners,
  paymentTypes,
  customers,
  operational,
}: {
  summary: ReturnType<typeof summarizeSales>
  partners: Array<{ name: string; value: number }>
  paymentTypes: Array<{ name: string; value: number }>
  customers: ReturnType<typeof buildCustomerInsights>
  operational: ReturnType<typeof buildOperationalInsights>
}) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          icon={Users}
          label="Clientes estimados"
          value={String(customers.uniqueCustomers)}
          detail="Período analisado"
        />
        <Kpi
          icon={RefreshCw}
          label="Recorrentes"
          value={String(customers.recurringCustomers)}
          detail="Período analisado"
        />
        <Kpi
          icon={CreditCard}
          label="Com telefone"
          value={formatPercent(summary.orders > 0 ? customers.phoneCustomers / summary.orders : 0)}
          detail="Pedidos válidos"
        />
        <Kpi
          icon={MapPin}
          label="Pedidos delivery"
          value={formatPercent(summary.orders > 0 ? operational.deliveryOrders / summary.orders : 0)}
          detail="Pedidos válidos"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Canal de venda">
          <div className="flex min-h-[420px] items-center justify-center">
            <SaiposDistributionChart data={partners} showPercentLabels />
          </div>
        </Panel>
        <Panel title="Origem do pedido">
          <Ranking
            rows={partners.map((item) => ({ ...item, detail: `${item.value} pedidos` }))}
            total={summary.orders}
            modalTitle="Origem do pedido"
          />
        </Panel>
        <Panel title="Formas de pagamento">
          <Ranking
            rows={paymentTypes.map((item) => ({ ...item, detail: `${item.value} pedidos` }))}
            total={summary.orders}
            modalTitle="Formas de pagamento"
          />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Cadastro dos clientes">
          <CustomerProfilePanel summary={summary} customers={customers} />
        </Panel>
        <Panel title="Bairros de entrega">
          <Ranking rows={operational.districts} total={operational.deliveryOrders} modalTitle="Bairros de entrega" />
        </Panel>
      </div>
    </div>
  )
}

function CustomerProfilePanel({
  summary,
  customers,
}: {
  summary: ReturnType<typeof summarizeSales>
  customers: ReturnType<typeof buildCustomerInsights>
}) {
  const actionableRate = summary.orders > 0 ? customers.actionableCustomers / summary.orders : 0
  const uniqueRate = summary.orders > 0 ? customers.uniqueCustomers / summary.orders : 0
  const phoneRate = summary.orders > 0 ? customers.phoneCustomers / summary.orders : 0
  const documentRate = summary.orders > 0 ? customers.documentCustomers / summary.orders : 0
  const missingActionable = Math.max(summary.orders - customers.actionableCustomers, 0)
  const repeatRate = customers.uniqueCustomers > 0 ? customers.recurringCustomers / customers.uniqueCustomers : 0

  const rows = [
    {
      label: "Contato acionável",
      value: actionableRate,
      detail: `${customers.actionableCustomers} pedidos com telefone, documento ou e-mail`,
    },
    {
      label: "Identificação única",
      value: uniqueRate,
      detail: `${customers.uniqueCustomers} clientes reconhecidos no período`,
    },
    {
      label: "Com telefone",
      value: phoneRate,
      detail: `${customers.phoneCustomers} pedidos com telefone`,
    },
    {
      label: "Com documento",
      value: documentRate,
      detail: `${customers.documentCustomers} pedidos com CPF/CNPJ`,
    },
  ]

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-lime/25 bg-lime/10 p-4">
          <p className="text-[10px] font-black uppercase text-lime">Base útil</p>
          <strong className="mt-2 block text-2xl">{formatPercent(actionableRate)}</strong>
          <p className="mt-1 text-xs text-muted-foreground">acionável</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Sem contato</p>
          <strong className="mt-2 block text-2xl">{missingActionable}</strong>
          <p className="mt-1 text-xs text-muted-foreground">pedidos</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Recorrência</p>
          <strong className="mt-2 block text-2xl">{formatPercent(repeatRate)}</strong>
          <p className="mt-1 text-xs text-muted-foreground">{customers.recurringCustomers} clientes</p>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <strong>{formatPercent(row.value)}</strong>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-lime" style={{ width: `${Math.max(4, row.value * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>
          </div>
        ))}
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
      orders: day.orders,
      revenueInCents: day.netInCents,
    }))
    .filter((day) => day.orders > 0)
  const bestDay = [...ticketRows].sort((first, second) => second.value - first.value)[0]
  const lowestDay = [...ticketRows].sort((first, second) => first.value - second.value)[0]
  const averageTicket = summary.averageTicketInCents

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
          value={formatMoneyFromAmount(summary.canceledInCents / 100)}
          detail={formatCancellationDetail(summary)}
          inverse
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[.7fr_1.3fr]">
        <Panel title="Leitura do ticket">
          <TicketReadout
            averageTicket={averageTicket}
            bestDay={bestDay}
            lowestDay={lowestDay}
            activeDays={ticketRows.length}
            revenueInCents={summary.netInCents}
          />
        </Panel>
        <Panel title="Ticket por dia">
          <TicketDayList rows={ticketRows} averageTicket={averageTicket} showAverageDiff={ticketRows.length > 1} />
        </Panel>
      </div>

      <StoreTable rows={storeRows} />
    </div>
  )
}

function TicketReadout({
  averageTicket,
  bestDay,
  lowestDay,
  activeDays,
  revenueInCents,
}: {
  averageTicket: number
  bestDay: { name: string; value: number; orders: number; revenueInCents: number } | undefined
  lowestDay: { name: string; value: number; orders: number; revenueInCents: number } | undefined
  activeDays: number
  revenueInCents: number
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-lime/20 bg-lime/10 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime">Média do período</p>
        <strong className="mt-2 block text-3xl leading-none text-lime sm:text-4xl">
          {formatMoneyFromAmount(averageTicket / 100)}
        </strong>
        <p className="mt-3 text-sm text-muted-foreground">
          {activeDays} dias com venda · {formatMoneyFromAmount(revenueInCents / 100)}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <TicketExtremeCard
          label="Maior ticket"
          day={bestDay}
          averageTicket={averageTicket}
          showAverageDiff={activeDays > 1}
          positive
        />
        <TicketExtremeCard
          label="Menor ticket"
          day={lowestDay}
          averageTicket={averageTicket}
          showAverageDiff={activeDays > 1}
        />
      </div>
    </div>
  )
}

function TicketExtremeCard({
  label,
  day,
  averageTicket,
  showAverageDiff,
  positive = false,
}: {
  label: string
  day: { name: string; value: number; orders: number; revenueInCents: number } | undefined
  averageTicket: number
  showAverageDiff: boolean
  positive?: boolean
}) {
  const diff = day ? day.value - averageTicket : 0

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <strong className={`mt-2 block text-2xl ${positive ? "text-lime" : "text-foreground"}`}>
        {day ? formatMoneyFromAmount(day.value / 100) : "--"}
      </strong>
      <p className="mt-2 text-xs text-muted-foreground">{day ? `${day.name} · ${day.orders} pedidos` : "Sem venda"}</p>
      {day && showAverageDiff ? (
        <p className={`mt-3 text-xs font-black ${diff >= 0 ? "text-lime" : "text-red-400"}`}>
          {formatSignedMoneyFromCents(diff)} vs média
        </p>
      ) : null}
    </div>
  )
}

function TicketDayList({
  rows,
  averageTicket,
  showAverageDiff,
}: {
  rows: Array<{ name: string; value: number; orders: number; revenueInCents: number }>
  averageTicket: number
  showAverageDiff: boolean
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem ticket diário no período.</p>
  const max = Math.max(...rows.map((row) => row.value), 1)
  const maxVisible = 2
  const visibleRows = rows.slice(0, maxVisible)

  return (
    <div className="grid gap-3">
      {visibleRows.map((row) => {
        const diff = row.value - averageTicket
        const width = Math.max(5, (row.value / max) * 100)
        return (
          <div key={row.name} className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">{row.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.orders} pedidos · {formatMoneyFromAmount(row.revenueInCents / 100)}
                </p>
              </div>
              <div className="text-right">
                <strong className="block text-lg text-lime">{formatMoneyFromAmount(row.value / 100)}</strong>
                {showAverageDiff ? (
                  <span className={`text-xs font-black ${diff >= 0 ? "text-lime" : "text-red-400"}`}>
                    {formatSignedMoneyFromCents(diff)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-graphite">
              <div className="h-full rounded-full bg-lime" style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
      {rows.length > maxVisible ? (
        <IndicatorsListModal
          title="Ticket por dia"
          description={`${rows.length} dias com venda no período`}
          columns={[
            { key: "day", label: "Dia" },
            { key: "orders", label: "Pedidos", align: "right" },
            { key: "revenue", label: "Faturamento", align: "right" },
            { key: "ticket", label: "Ticket", align: "right", highlight: true },
            ...(showAverageDiff ? [{ key: "diff", label: "Vs média", align: "right" as const }] : []),
          ]}
          rows={rows.map((row) => ({
            id: row.name,
            cells: {
              day: row.name,
              orders: String(row.orders),
              revenue: formatMoneyFromAmount(row.revenueInCents / 100),
              ticket: formatMoneyFromAmount(row.value / 100),
              diff: formatSignedMoneyFromCents(row.value - averageTicket),
            },
          }))}
        />
      ) : null}
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
  comparisonDailyRevenue,
  storeRows,
}: {
  title: string
  periodLabel: string
  comparisonLabel: string
  summary: ReturnType<typeof summarizeSales>
  comparisonSummary: ReturnType<typeof summarizeSales>
  dailyRevenue: ReturnType<typeof buildDailyRevenue>
  comparisonDailyRevenue: ReturnType<typeof buildDailyRevenue>
  storeRows: ReturnType<typeof buildStoreRows>
}) {
  const revenueDelta = percentChange(summary.netInCents, comparisonSummary.netInCents)
  const orderDelta = percentChange(summary.orders, comparisonSummary.orders)
  const ticketDelta = percentChange(summary.averageTicketInCents, comparisonSummary.averageTicketInCents)
  const revenueDiff = summary.netInCents - comparisonSummary.netInCents
  const orderDiff = summary.orders - comparisonSummary.orders
  const ticketDiff = summary.averageTicketInCents - comparisonSummary.averageTicketInCents
  const cancellationDiff = summary.canceledInCents - comparisonSummary.canceledInCents

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
          value={formatMoneyFromAmount(summary.canceledInCents / 100)}
          detail="Contra referência"
          delta={percentChange(summary.canceledInCents, comparisonSummary.canceledInCents)}
          deltaDisplay={formatSignedMoneyFromCents(cancellationDiff)}
          inverse
        />
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <Panel title={title} className="h-full">
          <div className="grid gap-4 md:grid-cols-2">
            <ComparisonSnapshot label="Período" period={periodLabel} summary={summary} active />
            <ComparisonSnapshot label="Referência" period={comparisonLabel} summary={comparisonSummary} />
          </div>
        </Panel>
        <Panel title="Diagnóstico da variação" className="h-full">
          <MetricList
            rows={[
              {
                label: "Diferença de faturamento",
                value: formatSignedMoneyFromCents(revenueDiff),
                strong: revenueDiff >= 0,
              },
              {
                label: "Variação de faturamento",
                value: formatSignedPercent(revenueDelta, 2),
                strong: (revenueDelta ?? 0) >= 0,
              },
              {
                label: "Diferença de pedidos",
                value: formatSignedNumber(orderDiff),
              },
              {
                label: "Variação de pedidos",
                value: formatSignedPercent(orderDelta, 2),
              },
              {
                label: "Diferença no ticket",
                value: formatSignedMoneyFromCents(ticketDiff),
              },
              {
                label: "Diferença em cancelamentos",
                value: formatSignedMoneyFromCents(cancellationDiff),
              },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Evolução do faturamento">
        <SaiposRevenueChart data={dailyRevenue} comparisonData={comparisonDailyRevenue} />
      </Panel>

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
            { label: "Cancelamentos", value: formatMoneyFromAmount(summary.canceledInCents / 100) },
          ]}
        />
      </div>
    </div>
  )
}

function ProductsView({ productMix }: { productMix: ReturnType<typeof buildProductMix> }) {
  const topProduct = productMix.topProducts[0]
  const abcGroups = (["A", "B", "C"] as const).map((abc) => {
    const items = productMix.rows.filter((item) => item.abc === abc)
    const revenueInCents = items.reduce((total, item) => total + item.revenueInCents, 0)

    return {
      abc,
      items: items.length,
      revenueInCents,
      share: productMix.totalRevenueInCents > 0 ? revenueInCents / productMix.totalRevenueInCents : 0,
    }
  })
  const activeProducts = productMix.rows.filter((item) => item.revenueInCents > 0).length
  const longTailProducts = productMix.rows.filter((item) => item.revenueInCents > 0 && item.share < 0.01).length
  const premiumRows = productMix.rows
    .filter((item) => item.revenueInCents > 0 && item.quantity > 0)
    .sort((first, second) => second.averageUnitPriceInCents - first.averageUnitPriceInCents)
    .slice(0, 8)
    .map((item) => ({
      name: item.name,
      value: item.averageUnitPriceInCents,
      metric: formatMoneyFromAmount(item.averageUnitPriceInCents / 100),
      detail: `${formatQuantity(item.quantity)} vendidos · ${formatMoneyFromAmount(item.revenueInCents / 100)}`,
    }))
  const boosterRows =
    productMix.choices.length > 0
      ? productMix.choices.slice(0, 5).map((item) => ({
          name: item.name,
          value: item.revenueInCents,
          metric: formatMoneyFromAmount(item.revenueInCents / 100),
          detail: `${formatQuantity(item.quantity)} vendido${item.quantity === 1 ? "" : "s"}`,
        }))
      : premiumRows

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={PackageSearch} label="Itens vendidos" value={formatQuantity(productMix.totalQuantity)} />
        <Kpi
          icon={CircleDollarSign}
          label="Receita do mix"
          value={formatMoneyFromAmount(productMix.totalRevenueInCents / 100)}
        />
        <Kpi
          icon={BadgePercent}
          label="Dependência A"
          value={formatPercent(
            productMix.totalRevenueInCents > 0 ? productMix.classARevenueInCents / productMix.totalRevenueInCents : 0
          )}
        />
        <Kpi
          icon={ClipboardList}
          label="Top 3"
          value={formatPercent(productMix.top3RevenueShare)}
          detail="Concentração do mix"
        />
      </div>
      <ProductMixBrief
        topProduct={topProduct}
        abcGroups={abcGroups}
        activeProducts={activeProducts}
        longTailProducts={longTailProducts}
        averageUnitRevenueInCents={productMix.averageUnitRevenueInCents}
      />
      <Panel title="Curva ABC por receita">
        <ProductRows rows={productMix.rows} />
      </Panel>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Baixo giro com valor">
          <ProductInsightList
            tone="quiet"
            rows={productMix.lowTurnover.map((item) => ({
              name: item.name,
              value: item.quantity,
              metric: formatMoneyFromAmount(item.revenueInCents / 100),
              detail: `${formatQuantity(item.quantity)} vendido${item.quantity === 1 ? "" : "s"}`,
            }))}
            modalTitle="Baixo giro com valor"
          />
        </Panel>
        <Panel title="Alto volume, ticket baixo">
          <ProductInsightList
            tone="accent"
            rows={productMix.volumeOpportunities.map((item) => ({
              name: item.name,
              value: item.quantity,
              metric: formatQuantity(item.quantity),
              detail: `Média ${formatMoneyFromAmount(item.averageUnitPriceInCents / 100)} por unidade`,
            }))}
            showBars
            modalTitle="Alto volume, ticket baixo"
          />
        </Panel>
        <Panel title={productMix.choices.length > 0 ? "Adicionais que puxam caixa" : "Maior ticket por unidade"}>
          <ProductInsightList
            rows={boosterRows}
            tone={productMix.choices.length > 0 ? "accent" : "quiet"}
            modalTitle={productMix.choices.length > 0 ? "Adicionais que puxam caixa" : "Maior ticket por unidade"}
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
  estimatedCmv,
}: {
  summary: ReturnType<typeof summarizeSales>
  payments: ReturnType<typeof buildPaymentInsights>
  finance: ReturnType<typeof buildCommercialFinanceInsights>
  estimatedCmv: ReturnType<typeof buildEstimatedCmv>
}) {
  const estimatedCmvRate =
    summary.netInCents > 0 && estimatedCmv.estimatedCostInCents > 0
      ? estimatedCmv.estimatedCostInCents / summary.netInCents
      : null
  const discountRate = summary.grossInCents > 0 ? summary.discountInCents / summary.grossInCents : 0
  const paymentGapInCents = payments.capturedInCents - summary.netInCents
  const paymentGapRate = summary.netInCents > 0 ? Math.abs(paymentGapInCents) / summary.netInCents : 0
  const fiscalCoverage = summary.orders > 0 ? finance.fiscalOrders / summary.orders : 0
  const grossMarginInCents =
    estimatedCmv.estimatedCostInCents > 0 ? summary.netInCents - estimatedCmv.estimatedCostInCents : null

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          icon={CircleDollarSign}
          label="Faturamento líquido"
          value={formatMoneyFromAmount(summary.netInCents / 100)}
          detail={`${summary.orders} pedidos válidos`}
        />
        <Kpi
          icon={BadgePercent}
          label="Descontos"
          value={formatMoneyFromAmount(summary.discountInCents / 100)}
          detail={formatPercent(discountRate)}
          inverse
        />
        <Kpi
          icon={WalletCards}
          label="Pagamentos lidos"
          value={formatMoneyFromAmount(payments.capturedInCents / 100)}
          detail={
            paymentGapRate <= 0.03
              ? "Conciliação próxima"
              : `${formatMoneyFromAmount(paymentGapInCents / 100)} de diferença`
          }
        />
        <Kpi
          icon={ReceiptText}
          label="NFC-e emitidas"
          value={String(finance.fiscalOrders)}
          detail={`${formatPercent(fiscalCoverage)} dos pedidos`}
        />
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <Panel title="DRE comercial Saipos">
          <FinanceStatement summary={summary} estimatedCmv={estimatedCmv} />
        </Panel>
        <Panel title="Leitura financeira">
          <FinancePulse
            summary={summary}
            finance={finance}
            estimatedCmv={estimatedCmv}
            paymentGapInCents={paymentGapInCents}
            grossMarginInCents={grossMarginInCents}
          />
        </Panel>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Panel title="CMV estimado">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-lime/20 bg-lime/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">% CMV</p>
              <strong className="mt-3 block text-3xl leading-none text-lime">
                {estimatedCmvRate === null ? "--%" : formatPercent(estimatedCmvRate)}
              </strong>
              <p className="mt-2 text-xs text-muted-foreground">{estimatedCmv.sourceLabel}</p>
            </div>
            <MetricMiniCard
              label={estimatedCmv.source === "stock" ? "Movimentos CMV" : "Custo calculado"}
              value={formatMoneyFromAmount(estimatedCmv.estimatedCostInCents / 100)}
              detail={
                estimatedCmv.source === "stock"
                  ? `${estimatedCmv.movementCount} movimentos de estoque`
                  : `${formatPercent(estimatedCmv.revenueCoverage)} da receita coberta`
              }
            />
            <MetricMiniCard
              label={estimatedCmv.source === "stock" ? "Ingredientes CMV" : "Itens com custo"}
              value={
                estimatedCmv.source === "stock"
                  ? formatQuantity(estimatedCmv.costCount)
                  : formatQuantity(estimatedCmv.coveredQuantity)
              }
              detail={
                estimatedCmv.source === "stock"
                  ? "Marcados para entrar no CMV"
                  : `${estimatedCmv.costCount} custos ativos`
              }
            />
          </div>
          <CmvExplanation estimatedCmv={estimatedCmv} />
        </Panel>
        <Panel title="Ingredientes com maior custo">
          <CompactRanking rows={estimatedCmv.topIngredients} money limit={6} />
        </Panel>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Pagamentos por valor">
          <CompactRanking rows={payments.rows} money limit={7} />
        </Panel>
        <Panel title="Conciliação rápida">
          <MetricList
            rows={[
              { label: "Faturamento líquido", value: formatMoneyFromAmount(summary.netInCents / 100), strong: true },
              { label: "Pagamentos capturados", value: formatMoneyFromAmount(payments.capturedInCents / 100) },
              {
                label: "Diferença",
                value: `${paymentGapInCents >= 0 ? "+" : "-"}${formatMoneyFromAmount(Math.abs(paymentGapInCents) / 100)}`,
                strong: paymentGapRate <= 0.03,
              },
              { label: "Pagamentos divididos", value: String(payments.splitPaymentOrders) },
              { label: "Cobertura fiscal", value: formatPercent(fiscalCoverage) },
            ]}
          />
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
        <Panel title="Bairros de entrega">
          <CompactRanking rows={operational.districts} total={operational.deliveryOrders} limit={6} />
        </Panel>
        <Panel title="Responsável pela entrega">
          <DeliveryModeCards rows={operational.deliveryModes} total={operational.deliveryOrders} />
        </Panel>
      </div>
    </div>
  )
}

function SalesProjectionView({
  projection,
  periodLabel,
  selectedStore,
}: {
  projection: ReturnType<typeof buildSalesProjection>
  periodLabel: string
  selectedStore: string
}) {
  const progress = projection.primary.openDaysInMonth > 0 ? projection.primary.openDaysElapsed / projection.primary.openDaysInMonth : 0
  const projectedLift =
    projection.grossInCents > 0
      ? (projection.primary.projectedGrossInCents - projection.grossInCents) / projection.grossInCents
      : null
  const storeLabel = selectedStore === "all" ? "Todas as lojas" : `Loja #${selectedStore}`

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Kpi
          icon={CircleDollarSign}
          label="Projeção do mês"
          value={formatMoneyFromAmount(projection.primary.projectedGrossInCents / 100)}
          detail="Bruto estimado"
        />
        <Kpi
          icon={BarChart3}
          label="Vendido até agora"
          value={formatMoneyFromAmount(projection.grossInCents / 100)}
          detail={`${projection.orders} pedidos válidos`}
        />
        <Kpi
          icon={TrendingUp}
          label="Média diária"
          value={formatMoneyFromAmount(projection.primary.averageDailyGrossInCents / 100)}
          detail="Por dia aberto"
        />
        <Kpi
          icon={CalendarDays}
          label="Dias abertos"
          value={`${projection.primary.openDaysElapsed}/${projection.primary.openDaysInMonth}`}
          detail="Base 6 dias/semana"
        />
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Projeção de vendas" className="h-full">
          <div className="grid gap-5">
            <div className="rounded-xl border border-lime/20 bg-lime/10 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Fechamento projetado</p>
              <strong className="mt-3 block text-3xl leading-none text-lime sm:text-4xl">
                {formatMoneyFromAmount(projection.primary.projectedGrossInCents / 100)}
              </strong>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {periodLabel} · {storeLabel} · média de{" "}
                {formatMoneyFromAmount(projection.primary.averageDailyGrossInCents / 100)} por dia aberto.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase text-muted-foreground">
                <span>Avanço do calendário aberto</span>
                <span>{formatPercent(progress, 0)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-lime" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricMiniCard
                label="Ainda a realizar"
                value={formatMoneyFromAmount(projection.primary.projectedRemainingInCents / 100)}
                detail={`${projection.primary.remainingOpenDays} dias abertos restantes`}
              />
              <MetricMiniCard
                label="Crescimento previsto"
                value={projectedLift === null ? "--%" : formatPercent(projectedLift, 0)}
                detail="Sobre o vendido no período"
              />
              <MetricMiniCard
                label="Dias com venda"
                value={`${projection.activeDays}/${projection.daysElapsed}`}
                detail="Movimento real lido"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Cenários de abertura" className="h-full">
          <div className="grid gap-3">
            {projection.scenarios.map((scenario) => (
              <div
                key={scenario.openDaysPerWeek}
                className={`rounded-xl border p-4 ${
                  scenario.openDaysPerWeek === projection.primary.openDaysPerWeek
                    ? "border-lime/30 bg-lime/10"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                      {scenario.openDaysPerWeek} dias por semana
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {scenario.openDaysInMonth} dias abertos no mês
                    </p>
                  </div>
                  <strong className="text-right text-lg text-lime">
                    {formatMoneyFromAmount(scenario.projectedGrossInCents / 100)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Memória do cálculo">
        <MetricList
          rows={[
            { label: "Faturamento bruto acumulado", value: formatMoneyFromAmount(projection.grossInCents / 100), strong: true },
            {
              label: "Média por dia aberto",
              value: formatMoneyFromAmount(projection.primary.averageDailyGrossInCents / 100),
            },
            { label: "Dias abertos considerados", value: String(projection.primary.openDaysInMonth) },
            { label: "Regra padrão", value: "6 dias por semana" },
          ]}
        />
      </Panel>
    </div>
  )
}

function FinancePulse({
  summary,
  finance,
  estimatedCmv,
  paymentGapInCents,
  grossMarginInCents,
}: {
  summary: ReturnType<typeof summarizeSales>
  finance: ReturnType<typeof buildCommercialFinanceInsights>
  estimatedCmv: ReturnType<typeof buildEstimatedCmv>
  paymentGapInCents: number
  grossMarginInCents: number | null
}) {
  const paymentGapRate = summary.netInCents > 0 ? Math.abs(paymentGapInCents) / summary.netInCents : 0
  const fiscalCoverage = summary.orders > 0 ? finance.fiscalOrders / summary.orders : 0
  const cmvRate =
    summary.netInCents > 0 && estimatedCmv.estimatedCostInCents > 0
      ? estimatedCmv.estimatedCostInCents / summary.netInCents
      : null
  const cards = [
    {
      label: "Conciliação",
      value: paymentGapRate <= 0.03 ? "OK" : "Revisar",
      detail:
        paymentGapRate <= 0.03
          ? "Pagamentos próximos do faturamento líquido."
          : `${formatMoneyFromAmount(Math.abs(paymentGapInCents) / 100)} de diferença entre vendas e pagamentos.`,
      tone: paymentGapRate <= 0.03 ? "lime" : "amber",
    },
    {
      label: "Fiscal",
      value: formatPercent(fiscalCoverage),
      detail: `${finance.fiscalOrders} NFC-e em ${summary.orders} pedidos válidos.`,
      tone: fiscalCoverage >= 0.85 ? "lime" : "amber",
    },
    {
      label: "CMV",
      value: cmvRate === null ? "--%" : formatPercent(cmvRate),
      detail:
        cmvRate === null
          ? "Aguardando retorno do estoque Saipos."
          : `${estimatedCmv.movementCount} movimentos compõem o custo.`,
      tone: cmvRate === null ? "amber" : "lime",
    },
    {
      label: "Margem bruta",
      value: grossMarginInCents === null ? "--" : formatMoneyFromAmount(grossMarginInCents / 100),
      detail: grossMarginInCents === null ? "Disponível quando houver CMV." : "Faturamento líquido menos CMV estimado.",
      tone: grossMarginInCents === null || grossMarginInCents >= 0 ? "lime" : "amber",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${
            card.tone === "lime" ? "border-lime/20 bg-lime/5" : "border-amber-400/20 bg-amber-400/5"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
          <strong
            className={`mt-2 block text-2xl leading-none ${card.tone === "lime" ? "text-lime" : "text-amber-300"}`}
          >
            {card.value}
          </strong>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{card.detail}</p>
        </div>
      ))}
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
  const customerCoverage = rawData.validSales > 0 ? rawData.customers / rawData.validSales : 0
  const deliveryCoverage = rawData.validSales > 0 ? rawData.delivery / rawData.validSales : 0
  const paymentCoverage = rawData.validSales > 0 ? rawData.payments / rawData.validSales : 0
  const nfceCoverage = rawData.validSales > 0 ? rawData.nfce / rawData.validSales : 0
  const smartposCoverage = rawData.validSales > 0 ? rawData.smartpos / rawData.validSales : 0
  const tefCoverage = rawData.validSales > 0 ? rawData.tef / rawData.validSales : 0
  const cancellationCount = Math.max(rawData.sales - rawData.validSales, 0)
  const averageItemsPerSale = rawData.validSales > 0 ? rawData.items / rawData.validSales : 0
  const qualityScore =
    rawData.validSales > 0
      ? customerCoverage * 0.2 +
        deliveryCoverage * 0.2 +
        paymentCoverage * 0.25 +
        nfceCoverage * 0.15 +
        smartposCoverage * 0.1 +
        tefCoverage * 0.1
      : 0
  const coverageRows = [
    {
      label: "Cliente identificado",
      value: customerCoverage,
      detail: `${rawData.customers}/${rawData.validSales} vendas`,
    },
    {
      label: "Entrega no payload",
      value: deliveryCoverage,
      detail: `${rawData.delivery}/${rawData.validSales} vendas`,
    },
    { label: "Pagamentos lidos", value: paymentCoverage, detail: `${rawData.payments}/${rawData.validSales} vendas` },
    { label: "NFC-e", value: nfceCoverage, detail: `${rawData.nfce}/${rawData.validSales} vendas` },
    { label: "SmartPOS", value: smartposCoverage, detail: `${rawData.smartpos}/${rawData.validSales} vendas` },
    { label: "TEF", value: tefCoverage, detail: `${rawData.tef}/${rawData.validSales} vendas` },
  ]

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
        <Kpi icon={ReceiptText} label="NFC-e no payload" value={formatPercent(nfceCoverage)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <Panel title="Saúde do payload">
          <div className="grid gap-4">
            <div className="rounded-xl border border-lime/20 bg-lime/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime">Qualidade estimada</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <strong className="text-3xl leading-none text-lime sm:text-4xl">{formatPercent(qualityScore)}</strong>
                <span className="text-right text-xs leading-5 text-muted-foreground">
                  Base calculada com cliente, entrega, pagamento e dados fiscais.
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-lime" style={{ width: `${Math.max(4, qualityScore * 100)}%` }} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <RawMiniStat label="Canceladas" value={String(cancellationCount)} detail="fora das válidas" />
              <RawMiniStat
                label="Itens por venda"
                value={formatQuantity(averageItemsPerSale)}
                detail="média do filtro"
              />
              <RawMiniStat
                label="Receita bruta"
                value={formatMoneyFromAmount(rawData.grossInCents / 100)}
                detail="vendas válidas"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Cobertura dos dados">
          <RawCoverageGrid rows={coverageRows} />
        </Panel>
      </div>

      <div className="grid gap-4">
        <Panel title="Últimas vendas no filtro">
          <RecentSales rows={rawData.recentSales} />
        </Panel>
      </div>
    </div>
  )
}

function RawMiniStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <strong className="mt-2 block break-words text-xl leading-tight">{value}</strong>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function RawCoverageGrid({ rows }: { rows: Array<{ label: string; value: number; detail: string }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{row.label}</p>
              <p className="mt-2 text-xs text-muted-foreground">{row.detail}</p>
            </div>
            <strong className="text-lg text-lime">{formatPercent(row.value)}</strong>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-graphite">
            <div className="h-full rounded-full bg-lime" style={{ width: `${Math.max(4, row.value * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatSignedNumber(value: number) {
  const sign = value > 0 ? "+" : ""
  return `${sign}${formatQuantity(value)}`
}

function formatSignedMoneyFromCents(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}${formatMoneyFromAmount(Math.abs(value) / 100)}`
}

function formatCancellationDetail(summary: ReturnType<typeof summarizeSales>) {
  const zeroed = summary.canceledOrdersWithoutValue > 0 ? ` · ${summary.canceledOrdersWithoutValue} zerados` : ""
  return `${formatPercent(summary.cancellationRate)} · ${summary.canceledOrdersWithValue} com valor${zeroed}`
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "--"
  return `${Math.round(value)} min`
}

function FinanceStatement({
  summary,
  estimatedCmv,
}: {
  summary: ReturnType<typeof summarizeSales>
  estimatedCmv: ReturnType<typeof buildEstimatedCmv>
}) {
  const discountShare = summary.grossInCents > 0 ? summary.discountInCents / summary.grossInCents : 0
  const cancellationShare = summary.grossInCents > 0 ? summary.canceledInCents / summary.grossInCents : 0
  const cmvShare =
    summary.netInCents > 0 && estimatedCmv.estimatedCostInCents > 0
      ? estimatedCmv.estimatedCostInCents / summary.netInCents
      : null
  const grossMarginInCents =
    estimatedCmv.estimatedCostInCents > 0 ? summary.netInCents - estimatedCmv.estimatedCostInCents : null
  const compositionMax = Math.max(summary.grossInCents, summary.netInCents, 1)

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-lime/20 bg-lime/10 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Resultado do período</p>
        <strong className="mt-3 block text-2xl leading-none text-lime sm:text-3xl">
          {formatMoneyFromAmount(summary.netInCents / 100)}
        </strong>
        <p className="mt-2 text-xs text-muted-foreground">
          {summary.orders} pedidos válidos · {formatMoneyFromAmount(summary.grossInCents / 100)} em vendas brutas
        </p>
      </div>
      <div className="grid gap-3">
        <DreBar label="Vendas brutas" value={summary.grossInCents} max={compositionMax} tone="neutral" />
        <DreBar
          label="Descontos"
          value={summary.discountInCents}
          max={compositionMax}
          tone="danger"
          suffix={formatPercent(discountShare)}
        />
        <DreBar
          label="Cancelamentos com valor"
          value={summary.canceledInCents}
          max={compositionMax}
          tone="danger"
          suffix={formatPercent(cancellationShare)}
        />
        <DreBar label="Faturamento líquido" value={summary.netInCents} max={compositionMax} tone="lime" />
        {estimatedCmv.estimatedCostInCents > 0 ? (
          <DreBar
            label="CMV estimado"
            value={estimatedCmv.estimatedCostInCents}
            max={compositionMax}
            tone="amber"
            suffix={cmvShare === null ? undefined : formatPercent(cmvShare)}
          />
        ) : null}
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
            label: "Cancelamentos com valor",
            value: `-${formatMoneyFromAmount(summary.canceledInCents / 100)} (${formatPercent(cancellationShare)})`,
          },
          {
            label: "CMV estimado",
            value:
              cmvShare === null
                ? "Sem estoque CMV da Saipos"
                : `-${formatMoneyFromAmount(estimatedCmv.estimatedCostInCents / 100)} (${formatPercent(cmvShare)})`,
          },
          {
            label: "Margem bruta estimada",
            value: grossMarginInCents === null ? "--" : formatMoneyFromAmount(grossMarginInCents / 100),
            strong: grossMarginInCents !== null && grossMarginInCents > 0,
          },
        ]}
      />
    </div>
  )
}

function DreBar({
  label,
  value,
  max,
  tone,
  suffix,
}: {
  label: string
  value: number
  max: number
  tone: "lime" | "amber" | "danger" | "neutral"
  suffix?: string
}) {
  const toneClass = {
    lime: "bg-lime",
    amber: "bg-amber-300",
    danger: "bg-red-400",
    neutral: "bg-muted-foreground",
  }[tone]

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <strong className={tone === "lime" ? "text-lime" : tone === "danger" ? "text-red-300" : "text-foreground"}>
          {formatMoneyFromAmount(value / 100)}
          {suffix ? <span className="ml-2 text-muted-foreground">{suffix}</span> : null}
        </strong>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${Math.max(3, (value / max) * 100)}%` }} />
      </div>
    </div>
  )
}

function CmvExplanation({ estimatedCmv }: { estimatedCmv: ReturnType<typeof buildEstimatedCmv> }) {
  const hasStockData = estimatedCmv.estimatedCostInCents > 0

  return (
    <div
      className={`mt-4 rounded-xl border p-4 ${hasStockData ? "border-lime/20 bg-lime/5" : "border-amber-400/25 bg-amber-400/5"}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            hasStockData ? "border-lime/30 bg-lime/10 text-lime" : "border-amber-400/30 bg-amber-400/10 text-amber-300"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-foreground">
            {hasStockData ? "CMV calculado pelo estoque Saipos" : "CMV por estoque ainda sem retorno da Saipos"}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {hasStockData
              ? "O valor usa movimentações de ingrediente vinculadas a vendas e marcadas pela Saipos para entrar no CMV."
              : "A integração já consulta o endpoint oficial de movimentação de estoque da Saipos, mas a própria documentação informa que ele está em manutenção e pode não retornar dados. Quando a Saipos liberar movimentos, o sync diário passa a preencher este indicador automaticamente."}
          </p>
          {!hasStockData ? (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Enquanto não houver movimentos de estoque, o painel mantém `--%` para não apresentar um CMV inventado.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MetricMiniCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <strong className="mt-3 block text-2xl leading-none text-foreground">{value}</strong>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function MetricList({ rows }: { rows: Array<{ label: string; value: string; strong?: boolean }> }) {
  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="flex min-h-11 items-start justify-between gap-4 py-2.5 text-sm">
          <span className="min-w-0 text-muted-foreground">{row.label}</span>
          <strong className={`min-w-0 text-right ${row.strong ? "text-base text-lime" : ""}`}>{row.value}</strong>
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
          <strong className="mt-3 block text-3xl leading-none text-lime sm:text-4xl">{peak.name}</strong>
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
        <div
          key={`${row.name}-${index}`}
          className="grid grid-cols-[1.75rem_1fr] items-center gap-3 sm:grid-cols-[1.75rem_1fr_auto]"
        >
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
    <>
      <div className="grid gap-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate">{row.saleNumber ? `#${row.saleNumber}` : row.idSale}</strong>
                <p className="mt-1 text-xs text-muted-foreground">ID {row.idSale}</p>
              </div>
              <strong className="shrink-0 text-right text-lime">
                {formatMoneyFromAmount(row.amountInCents / 100)}
              </strong>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between gap-3">
                <span>Canal</span>
                <strong className="min-w-0 truncate text-right text-foreground">{row.partner}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Cliente</span>
                <strong className="min-w-0 truncate text-right text-foreground">{row.customer}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Bairro</span>
                <strong className="min-w-0 truncate text-right text-foreground">{row.district}</strong>
              </div>
            </div>
            <span
              className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase ${
                row.canceled ? "border-red-400/30 bg-red-400/10 text-red-400" : "border-lime/30 bg-lime/10 text-lime"
              }`}
            >
              {row.canceled ? "Cancelada" : "Válida"}
            </span>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-3">Venda</th>
              <th>Canal</th>
              <th>Cliente</th>
              <th>Bairro</th>
              <th>Status</th>
              <th className="text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="py-3">
                  <strong className="block">{row.saleNumber ? `#${row.saleNumber}` : row.idSale}</strong>
                  <span className="text-xs text-muted-foreground">ID {row.idSale}</span>
                </td>
                <td>
                  <span className="inline-flex max-w-[220px] rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                    <span className="truncate">{row.partner}</span>
                  </span>
                </td>
                <td>
                  <span className="block max-w-[240px] truncate font-medium">{row.customer}</span>
                </td>
                <td>
                  <span className="block max-w-[180px] truncate text-muted-foreground">{row.district}</span>
                </td>
                <td>
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase ${
                      row.canceled
                        ? "border-red-400/30 bg-red-400/10 text-red-400"
                        : "border-lime/30 bg-lime/10 text-lime"
                    }`}
                  >
                    {row.canceled ? "Cancelada" : "Válida"}
                  </span>
                </td>
                <td className="text-right font-black text-lime">{formatMoneyFromAmount(row.amountInCents / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  detail = "Período",
  delta,
  deltaDisplay,
  inverse = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail?: string
  delta?: number | null
  deltaDisplay?: string
  inverse?: boolean
}) {
  const good = delta === undefined || delta === null || (inverse ? delta <= 0 : delta >= 0)
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-graphite p-4 shadow-[0_18px_70px_rgba(0,0,0,.22)] sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-lime sm:h-11 sm:w-11">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <strong className="mt-2 block break-words text-xl leading-tight sm:text-2xl">{value}</strong>
          <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
        </div>
      </div>
      {delta !== undefined ? (
        <p className={`mt-3 text-right text-xs font-black ${good ? "text-lime" : "text-red-400"}`}>
          {deltaDisplay ?? formatSignedPercent(delta)}
        </p>
      ) : null}
    </article>
  )
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <article
      className={`min-w-0 rounded-2xl border border-border bg-graphite p-4 shadow-[0_18px_70px_rgba(0,0,0,.2)] sm:p-5 ${className}`}
    >
      <h2 className="text-sm font-black uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  )
}

function ProductMixBrief({
  topProduct,
  abcGroups,
  activeProducts,
  longTailProducts,
  averageUnitRevenueInCents,
}: {
  topProduct: ReturnType<typeof buildProductMix>["topProducts"][number] | undefined
  abcGroups: Array<{ abc: "A" | "B" | "C"; items: number; revenueInCents: number; share: number }>
  activeProducts: number
  longTailProducts: number
  averageUnitRevenueInCents: number
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-lime/20 bg-[linear-gradient(135deg,rgba(221,255,0,.10),rgba(19,19,19,.9)_36%,rgba(8,8,8,.98))] p-4 shadow-[0_22px_90px_rgba(0,0,0,.26)] sm:p-5">
      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Leitura do mix</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-black uppercase leading-tight sm:text-3xl">
            {topProduct ? topProduct.name : "Sem produto dominante no período"}
          </h2>
          {topProduct ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-lime">
                {formatPercent(topProduct.share)} da receita
              </span>
              <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground">
                {formatQuantity(topProduct.quantity)} vendidos
              </span>
              <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground">
                Média {formatMoneyFromAmount(topProduct.averageUnitPriceInCents / 100)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <ProductMixBriefStat label="Produtos ativos" value={formatQuantity(activeProducts)} />
          <ProductMixBriefStat label="Cauda menor que 1%" value={formatQuantity(longTailProducts)} />
          <ProductMixBriefStat
            label="Média por unidade"
            value={formatMoneyFromAmount(averageUnitRevenueInCents / 100)}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-background">
          {abcGroups.map((group) => (
            <div
              key={group.abc}
              className={group.abc === "A" ? "bg-lime" : group.abc === "B" ? "bg-amber-300" : "bg-muted-foreground/50"}
              style={{ width: `${Math.max(group.share * 100, group.share > 0 ? 3 : 0)}%` }}
            />
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {abcGroups.map((group) => (
            <ProductCurveSummary key={group.abc} group={group} />
          ))}
        </div>
      </div>
    </article>
  )
}

function ProductCurveSummary({
  group,
}: {
  group: { abc: "A" | "B" | "C"; items: number; revenueInCents: number; share: number }
}) {
  const colorClass =
    group.abc === "A"
      ? "border-lime/25 bg-lime/10 text-lime"
      : group.abc === "B"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
        : "border-muted-foreground/20 bg-background/70 text-muted-foreground"

  return (
    <div className={`rounded-xl border p-3 ${colorClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em]">Curva {group.abc}</p>
          <strong className="mt-1 block text-2xl leading-none text-foreground">{formatPercent(group.share)}</strong>
        </div>
        <span className="rounded-full border border-current/20 px-2 py-1 text-xs font-black">
          {formatQuantity(group.items)} itens
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {formatMoneyFromAmount(group.revenueInCents / 100)} em receita
      </p>
    </div>
  )
}

function ProductMixBriefStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 xl:border-l-0 xl:border-t xl:pl-0 xl:pt-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <strong className="mt-1 block break-words text-lg leading-tight">{value}</strong>
    </div>
  )
}

function ProductInsightList({
  rows,
  tone,
  showBars = false,
  maxVisible = 2,
  modalTitle = "Lista completa",
}: {
  rows: Array<{ name: string; value: number; metric: string; detail: string }>
  tone: "quiet" | "accent"
  showBars?: boolean
  maxVisible?: number
  modalTitle?: string
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  const visibleRows = rows.slice(0, maxVisible)

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        {visibleRows.map((row, index) => (
          <div
            key={`${row.name}-${index}`}
            className="rounded-xl border border-border bg-background/70 px-3 py-3 transition-colors hover:border-lime/25 sm:px-4"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold leading-5 text-foreground">
                  <span className="mr-1 text-muted-foreground">{index + 1}.</span>
                  {getRankedProductDisplayName(row.name)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>
              </div>
              <strong
                className={`shrink-0 rounded-lg border px-2 py-1 text-sm font-black ${
                  tone === "accent"
                    ? "border-lime/20 bg-lime/10 text-lime"
                    : "border-border bg-graphite text-foreground"
                }`}
              >
                {row.metric}
              </strong>
            </div>
            {showBars ? (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-graphite">
                <div
                  className="h-full rounded-full bg-lime"
                  style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {rows.length > maxVisible ? (
        <IndicatorsListModal
          title={modalTitle}
          description={`${rows.length} itens no período`}
          columns={[
            { key: "rank", label: "#" },
            { key: "name", label: "Item" },
            { key: "detail", label: "Detalhe" },
            { key: "metric", label: "Valor", align: "right", highlight: tone === "accent" },
          ]}
          rows={rows.map((row, index) => ({
            id: `${row.name}-${index}`,
            cells: {
              rank: String(index + 1),
              name: getRankedProductDisplayName(row.name),
              detail: row.detail,
              metric: row.metric,
            },
          }))}
        />
      ) : null}
    </div>
  )
}

function getRankedProductDisplayName(name: string) {
  return name.replace(/^\s*\d+\.\s+/, "")
}

function Ranking({
  rows,
  total,
  money = false,
  maxVisible = 6,
  modalTitle = "Lista completa",
}: {
  rows: Array<{ name: string; value: number; detail: string; displayValue?: string }>
  total?: number
  money?: boolean
  maxVisible?: number
  modalTitle?: string
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  const visibleRows = rows.slice(0, maxVisible)
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados no período.</p>
  return (
    <div className="grid gap-4">
      {visibleRows.map((row, index) => (
        <div key={`${row.name}-${index}`}>
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 break-words text-muted-foreground sm:truncate">
              {index + 1}. {row.name}
            </span>
            <strong className="shrink-0 text-right">
              {row.displayValue
                ? row.displayValue
                : money
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
      {rows.length > maxVisible ? (
        <IndicatorsListModal
          title={modalTitle}
          description={`${rows.length} registros no período`}
          columns={[
            { key: "name", label: "Nome" },
            { key: "detail", label: "Detalhe" },
            { key: "value", label: money ? "Valor" : total ? "Participação" : "Qtd.", align: "right", highlight: true },
          ]}
          rows={rows.map((row, index) => ({
            id: `${row.name}-${index}`,
            cells: {
              name: `${index + 1}. ${row.name}`,
              detail: row.detail,
              value: row.displayValue
                ? row.displayValue
                : money
                  ? formatMoneyFromAmount(row.value / 100)
                  : total
                    ? formatPercent(row.value / total)
                    : formatQuantity(row.value),
            },
          }))}
        />
      ) : null}
    </div>
  )
}

function ProductRows({ rows }: { rows: ReturnType<typeof buildProductMix>["topProducts"] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem produtos Saipos no período.</p>
  const maxVisible = 10
  const visibleRows = rows.slice(0, maxVisible)
  const maxVisibleRevenue = Math.max(...visibleRows.map((row) => row.revenueInCents), 1)

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 lg:hidden">
        {visibleRows.map((row, index) => (
          <div key={`${row.name}-${index}`} className="rounded-xl border border-border bg-background p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Produto Saipos
                </p>
                <strong className="mt-1 block break-words text-sm leading-5 sm:text-base sm:leading-6">
                  {index + 1}. {getRankedProductDisplayName(row.name)}
                </strong>
                {row.integrationCode ? (
                  <span className="mt-2 inline-flex max-w-full rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">
                    PDV {row.integrationCode}
                  </span>
                ) : null}
              </div>
              <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-lime/20 bg-lime/10 px-2 text-xs font-black text-lime">
                {row.abc}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MobileStat label="Quantidade" value={formatQuantity(row.quantity)} />
              <MobileStat label="Receita" value={formatMoneyFromAmount(row.revenueInCents / 100)} strong />
              <MobileStat label="Participação" value={formatPercent(row.share)} />
              <MobileStat label="Acumulado" value={formatPercent(row.cumulativeShare)} />
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-graphite">
              <div
                className="h-full rounded-full bg-lime"
                style={{ width: `${Math.max(6, (row.revenueInCents / maxVisibleRevenue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-3">Produto Saipos</th>
              <th>Qtd.</th>
              <th>Receita</th>
              <th>Part.</th>
              <th>Acum.</th>
              <th>Curva</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleRows.map((row, index) => (
              <tr key={`${row.name}-${index}`}>
                <td className="py-3 pr-4">
                  <strong className="block">{row.name}</strong>
                  {row.integrationCode ? (
                    <span className="text-xs text-muted-foreground">PDV {row.integrationCode}</span>
                  ) : null}
                  <div className="mt-2 h-1.5 max-w-md overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-lime"
                      style={{ width: `${Math.max(6, (row.revenueInCents / maxVisibleRevenue) * 100)}%` }}
                    />
                  </div>
                </td>
                <td>{formatQuantity(row.quantity)}</td>
                <td className="font-black text-lime">{formatMoneyFromAmount(row.revenueInCents / 100)}</td>
                <td>{formatPercent(row.share)}</td>
                <td>{formatPercent(row.cumulativeShare)}</td>
                <td>
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-lime/20 bg-lime/10 px-2 text-xs font-black text-lime">
                    {row.abc}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxVisible ? (
        <IndicatorsListModal
          title="Curva ABC por receita"
          description={`${rows.length} produtos no período`}
          triggerLabel="Ver todos os produtos"
          columns={[
            { key: "rank", label: "#" },
            { key: "product", label: "Produto" },
            { key: "pdv", label: "PDV" },
            { key: "quantity", label: "Qtd.", align: "right" },
            { key: "revenue", label: "Receita", align: "right", highlight: true },
            { key: "share", label: "Part.", align: "right" },
            { key: "cumulative", label: "Acum.", align: "right" },
            { key: "abc", label: "Curva", align: "right" },
          ]}
          rows={rows.map((row, index) => ({
            id: `${row.integrationCode ?? row.name}-${index}`,
            cells: {
              rank: String(index + 1),
              product: getRankedProductDisplayName(row.name),
              pdv: row.integrationCode ?? "",
              quantity: formatQuantity(row.quantity),
              revenue: formatMoneyFromAmount(row.revenueInCents / 100),
              share: formatPercent(row.share),
              cumulative: formatPercent(row.cumulativeShare),
              abc: row.abc,
            },
          }))}
        />
      ) : null}
    </div>
  )
}

function StoreTable({ rows }: { rows: ReturnType<typeof buildStoreRows> }) {
  if (rows.length <= 1) return null

  if (rows.length === 0)
    return (
      <Panel title="Unidades">
        <p className="text-sm text-muted-foreground">Sem vendas para ranking.</p>
      </Panel>
    )
  const maxVisible = 10
  const visibleRows = rows.slice(0, maxVisible)

  return (
    <Panel title="Ranking de unidades">
      <div className="grid gap-3">
        <div className="grid gap-3 sm:hidden">
          {visibleRows.map((row, index) => (
            <div key={row.idStore} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <strong className="min-w-0 break-words text-sm leading-5">
                  {index + 1}. {row.name}
                </strong>
                <strong className="shrink-0 text-right text-lime">
                  {formatMoneyFromAmount(row.revenueInCents / 100)}
                </strong>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MobileStat label="Pedidos" value={String(row.orders)} />
                <MobileStat label="Ticket" value={formatMoneyFromAmount(row.averageTicketInCents / 100)} />
                <MobileStat label="Cancelamentos" value={formatPercent(row.cancellationRate)} />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[680px] text-left text-sm">
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
              {visibleRows.map((row, index) => (
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
        {rows.length > maxVisible ? (
          <IndicatorsListModal
            title="Ranking de unidades"
            description={`${rows.length} unidades no período`}
            triggerLabel="Ver todas as unidades"
            columns={[
              { key: "store", label: "Unidade" },
              { key: "revenue", label: "Faturamento", align: "right", highlight: true },
              { key: "orders", label: "Pedidos", align: "right" },
              { key: "ticket", label: "Ticket", align: "right" },
              { key: "cancellation", label: "Cancel.", align: "right" },
            ]}
            rows={rows.map((row, index) => ({
              id: String(row.idStore),
              cells: {
                store: `${index + 1}. ${row.name}`,
                revenue: formatMoneyFromAmount(row.revenueInCents / 100),
                orders: String(row.orders),
                ticket: formatMoneyFromAmount(row.averageTicketInCents / 100),
                cancellation: formatPercent(row.cancellationRate),
              },
            }))}
          />
        ) : null}
      </div>
    </Panel>
  )
}

function MobileStat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-graphite/50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <strong className={`mt-1 block break-words text-sm leading-5 ${strong ? "text-lime" : "text-foreground"}`}>
        {value}
      </strong>
    </div>
  )
}

function Signal({ alert, featured = false }: { alert: SaiposDashboardAlert; featured?: boolean }) {
  const isAttention = alert.severity === "Atenção"
  const isOpportunity = alert.severity === "Oportunidade"
  const Icon = isAttention ? AlertTriangle : isOpportunity ? TrendingUp : Store
  const statusClass = isAttention
    ? "border-lime/30 bg-lime/10 text-lime"
    : isOpportunity
      ? "border-purple-medium/30 bg-purple-medium/10 text-purple-medium"
      : "border-border bg-background text-muted-foreground"
  const iconClass = isOpportunity
    ? "border-purple-medium/20 bg-purple-medium/10 text-purple-medium"
    : "border-lime/20 bg-lime/10 text-lime"
  const featuredClass = featured ? "p-4 sm:p-5 md:p-6" : "p-4 sm:p-5"
  const titleClass = featured ? "text-lg leading-6 sm:text-xl sm:leading-7" : "text-sm leading-5"
  const metricClass = featured ? "text-xl sm:text-2xl" : "text-base"

  return (
    <article
      className={`min-w-0 rounded-2xl border border-border bg-graphite shadow-[0_18px_70px_rgba(0,0,0,.2)] ${featuredClass}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:h-11 sm:w-11 ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span
                className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass}`}
              >
                {alert.severity}
              </span>
              <h3 className={`mt-3 font-black uppercase text-foreground ${titleClass}`}>{alert.title}</h3>
            </div>
            <strong className={`min-w-0 shrink-0 text-right font-black text-lime ${metricClass}`}>
              {alert.metric}
            </strong>
          </div>
          <p
            className={`${featured ? "mt-4 text-sm leading-6" : "mt-3 line-clamp-2 text-xs leading-5"} text-muted-foreground`}
          >
            {alert.detail}
          </p>
        </div>
      </div>

      <div className={`${featured ? "mt-5" : "mt-4"} border-t border-border pt-4`}>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Sugestão</p>
        <p
          className={`${featured ? "mt-2 text-sm leading-6" : "mt-1 line-clamp-2 text-xs leading-5"} text-muted-foreground`}
        >
          {alert.action}
        </p>
      </div>
    </article>
  )
}
