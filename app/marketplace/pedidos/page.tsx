import { CalendarDays, ChevronDown, CreditCard, PackageCheck, ReceiptText, WalletCards } from "lucide-react"
import { requireMarketplaceUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, type SearchParams } from "@/lib/pagination"
import { PrivatePageHeader } from "@/components/private-page-header"

const statusLabels: Record<string, string> = {
  AWAITING_SERVICE: "Aguardando atendimento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  PICKING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

const statusClasses: Record<string, string> = {
  AWAITING_SERVICE: "border-purple-medium/30 bg-purple-medium/10 text-purple-medium",
  AWAITING_PAYMENT: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  PAYMENT_CONFIRMED: "border-lime/30 bg-lime/10 text-lime",
  PICKING: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  SHIPPED: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  DELIVERED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  CANCELLED: "border-red-400/30 bg-red-500/10 text-red-300",
}

const progressByStatus: Record<string, number> = {
  AWAITING_SERVICE: 18,
  AWAITING_PAYMENT: 32,
  PAYMENT_CONFIRMED: 48,
  PICKING: 66,
  SHIPPED: 84,
  DELIVERED: 100,
  CANCELLED: 100,
}

export default async function FranchiseOrdersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const user = await requireMarketplaceUser()
  const page = getCurrentPage(resolvedSearchParams)
  const where = user.role === "FRANCHISEE" ? { franchiseId: user.franchiseId! } : { userId: user.id }
  const totalOrders = await prisma.order.count({ where })
  const pagination = getPagination(page, totalOrders, 10)
  const [orders, activeOrders, deliveredOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.order.count({
      where: {
        ...where,
        status: { in: ["AWAITING_SERVICE", "AWAITING_PAYMENT", "PAYMENT_CONFIRMED", "PICKING", "SHIPPED"] },
      },
    }),
    prisma.order.count({ where: { ...where, status: "DELIVERED" } }),
  ])

  return (
    <main>
      <PrivatePageHeader
        eyebrow={`Olá, ${user.name}`}
        title={
          <>
            Meus <span className="text-lime neon-glow">pedidos.</span>
          </>
        }
        description="Acompanhe o histórico da sua unidade, veja o status de cada solicitação e confira os itens enviados para a Factory."
        icon={ReceiptText}
      >
        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
          <SummaryCard value={totalOrders} label="total" />
          <SummaryCard value={activeOrders} label="em andamento" accent="purple" />
          <SummaryCard value={deliveredOrders} label="entregues" />
        </div>
      </PrivatePageHeader>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {orders.length > 0 ? (
          <div className="space-y-5">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-graphite/40 p-10 text-center">
            <PackageCheck className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-5 text-lg font-black uppercase">Nenhum pedido enviado</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Quando você finalizar um pedido no marketplace, ele aparecerá aqui com o status atualizado.
            </p>
          </div>
        )}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          searchParams={resolvedSearchParams}
        />
      </section>
    </main>
  )
}

function OrderCard({
  order,
}: {
  order: {
    number: number
    status: string
    paymentMethod: string
    subtotalInCents: number
    promotionDiscountInCents: number
    couponDiscountInCents: number
    pixDiscountInCents: number
    totalInCents: number
    notes: string | null
    createdAt: Date
    items: {
      id: string
      name: string
      unit: string
      quantity: number
      unitPriceInCents: number
      totalInCents: number
    }[]
  }
}) {
  const number = `NF-${String(order.number).padStart(5, "0")}`
  const discountTotal = order.promotionDiscountInCents + order.couponDiscountInCents + order.pixDiscountInCents
  const progress = progressByStatus[order.status] ?? 12

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-graphite">
      <div className="grid gap-5 border-b border-border p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-lime">
              <ReceiptText className="h-4 w-4" />
              {number}
            </p>
            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${
                statusClasses[order.status] ?? "border-border bg-background text-muted-foreground"
              }`}
            >
              {statusLabels[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-purple-medium" />
            Enviado em {formatDateTime(order.createdAt)}
          </p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-background">
            <div
              className={`h-full rounded-full ${order.status === "CANCELLED" ? "bg-red-400" : "bg-lime"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/45 p-4 md:text-right">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total estimado</p>
          <p className="mt-2 text-2xl font-black text-lime">{formatMoneyFromCents(order.totalInCents)}</p>
          <p className="mt-2 flex items-center gap-2 text-xs font-bold text-muted-foreground md:justify-end">
            {order.paymentMethod === "PIX" ? (
              <WalletCards className="h-4 w-4 text-lime" />
            ) : (
              <CreditCard className="h-4 w-4 text-purple-medium" />
            )}
            {order.paymentMethod === "PIX" ? "PIX com desconto" : "Cartão pelo WhatsApp"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-6">
        <div>
          <details className="group overflow-hidden rounded-xl border border-border bg-background/35">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-purple-medium">
                  Itens do pedido
                </span>
                <span className="mt-1 block text-xs font-bold text-muted-foreground">
                  {order.items.length} {order.items.length === 1 ? "item" : "itens"} neste pedido
                </span>
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-lime transition-transform group-open:rotate-180" />
            </summary>
            <div className="divide-y divide-border border-t border-border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_110px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase">{item.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {item.quantity} {item.unit} x {formatMoneyFromCents(item.unitPriceInCents)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-lime sm:text-right">
                    {formatMoneyFromCents(item.totalInCents)}
                  </p>
                </div>
              ))}
            </div>
          </details>
          {order.notes && (
            <div className="mt-4 rounded-xl border border-border bg-background/35 p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Observações</p>
              <p className="mt-2 text-xs leading-5 text-foreground/80">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="h-fit rounded-xl border border-border bg-background/45 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Resumo</p>
          <div className="mt-4 space-y-2 text-xs">
            <SummaryLine label="Subtotal" value={order.subtotalInCents} />
            {order.promotionDiscountInCents > 0 && (
              <SummaryLine label="Promoções" value={-order.promotionDiscountInCents} />
            )}
            {order.couponDiscountInCents > 0 && <SummaryLine label="Cupom" value={-order.couponDiscountInCents} />}
            {order.pixDiscountInCents > 0 && <SummaryLine label="PIX" value={-order.pixDiscountInCents} />}
            {discountTotal <= 0 && <p className="text-muted-foreground">Sem descontos aplicados.</p>}
          </div>
        </div>
      </div>
    </article>
  )
}

function SummaryCard({ value, label, accent = "lime" }: { value: number; label: string; accent?: "lime" | "purple" }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background/50 px-3 py-3 text-center sm:min-w-28 sm:px-4">
      <p className={`text-xl font-black leading-none ${accent === "purple" ? "text-purple-medium" : "text-lime"}`}>
        {value}
      </p>
      <p className="mt-1.5 truncate text-[8px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4 text-muted-foreground">
      <span>{label}</span>
      <span className={value < 0 ? "text-lime" : "text-foreground"}>
        {value < 0 ? "-" : ""}
        {formatMoneyFromCents(Math.abs(value))}
      </span>
    </div>
  )
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
