import { CalendarDays, ChevronDown, CreditCard, MessageCircle, PackageCheck, ReceiptText, WalletCards } from "lucide-react"
import { requireMarketplaceUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, type SearchParams } from "@/lib/pagination"
import { PrivatePageHeader } from "@/components/private-page-header"
import { getPaymentDiscountLabel, getPaymentMethodInstruction, getPaymentMethodLabel } from "@/lib/payment-method"
import { formatOrderCode } from "@/lib/order-number"
import { getOrderItemCategoryName, sortOrderItemsByCategory } from "@/lib/order-items"
import { getOrderMessageSettings, getStoreWhatsAppNumber } from "@/lib/site-settings"
import { buildWhatsAppUrl } from "@/lib/whatsapp"

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
  const [orders, activeOrders, deliveredOrders, messageSettings, storeWhatsAppNumber] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { coupon: true, items: { include: { product: { include: { category: true } } } } },
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
    getOrderMessageSettings(),
    getStoreWhatsAppNumber(),
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
              <OrderCard
                key={order.id}
                order={order}
                buyerLine={
                  user.role === "FRANCHISEE" && user.franchise
                    ? `Unidade: *${user.franchise.tradeName}*`
                    : `Cliente: *${user.name}*`
                }
                storeWhatsAppNumber={storeWhatsAppNumber}
                whatsappTemplate={messageSettings.whatsappTemplate}
              />
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
  buyerLine,
  storeWhatsAppNumber,
  whatsappTemplate,
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
    coupon: {
      code: string
    } | null
    items: {
      id: string
      name: string
      unit: string
      quantity: number
      unitPriceInCents: number
      totalInCents: number
      selectedOptions: unknown
      product?: {
        category?: {
          name: string
          sortOrder: number
        } | null
      } | null
    }[]
  }
  buyerLine: string
  storeWhatsAppNumber: string
  whatsappTemplate: string
}) {
  const number = formatOrderCode(order.number)
  const discountTotal = order.promotionDiscountInCents + order.couponDiscountInCents + order.pixDiscountInCents
  const progress = progressByStatus[order.status] ?? 12
  const paymentDiscountLabel = getPaymentDiscountLabel(order.paymentMethod)
  const sortedItems = sortOrderItemsByCategory(order.items)
  const whatsappUrl = buildWhatsAppUrl(
    storeWhatsAppNumber,
    buildOrderWhatsAppMessage({
      order: { ...order, items: sortedItems },
      buyerLine,
      orderNumber: number,
      paymentDiscountLabel,
      template: whatsappTemplate,
    })
  )

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
            {order.paymentMethod === "PIX" && <WalletCards className="h-4 w-4 text-lime" />}
            {order.paymentMethod === "CARD" && <CreditCard className="h-4 w-4 text-purple-medium" />}
            {order.paymentMethod === "BOLETO" && <ReceiptText className="h-4 w-4 text-purple-medium" />}
            {order.paymentMethod === "CARD"
              ? "Cartão pelo WhatsApp"
              : order.paymentMethod === "BOLETO"
                ? "Boleto para franqueado"
                : getPaymentMethodLabel(order.paymentMethod)}
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
                  {sortedItems.length} {sortedItems.length === 1 ? "item" : "itens"} neste pedido
                </span>
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-lime transition-transform group-open:rotate-180" />
            </summary>
            <div className="divide-y divide-border border-t border-border">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_110px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase">{item.name}</p>
                    {getOrderItemCategoryName(item) && (
                      <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-purple-medium">
                        {getOrderItemCategoryName(item)}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {item.quantity} {item.unit} x {formatMoneyFromCents(item.unitPriceInCents)}
                    </p>
                    <SelectedOptionsList value={item.selectedOptions} />
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
            {order.pixDiscountInCents > 0 && (
              <SummaryLine label={paymentDiscountLabel} value={-order.pixDiscountInCents} />
            )}
            {discountTotal <= 0 && <p className="text-muted-foreground">Sem descontos aplicados.</p>}
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-[10px] font-black uppercase text-white transition hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar novamente
          </a>
        </div>
      </div>
    </article>
  )
}

function buildOrderWhatsAppMessage({
  order,
  buyerLine,
  orderNumber,
  paymentDiscountLabel,
  template,
}: {
  order: {
    paymentMethod: string
    subtotalInCents: number
    promotionDiscountInCents: number
    couponDiscountInCents: number
    pixDiscountInCents: number
    totalInCents: number
    notes: string | null
    coupon: { code: string } | null
    items: {
      name: string
      unit: string
      quantity: number
      totalInCents: number
      selectedOptions: unknown
      product?: {
        category?: {
          name: string
          sortOrder: number
        } | null
      } | null
    }[]
  }
  buyerLine: string
  orderNumber: string
  paymentDiscountLabel: string
  template: string
}) {
  const itemLines = order.items.map((item, index) => {
    const selectedOptions = formatSelectedOptions(item.selectedOptions)

    return [
      `${index + 1}. ${item.name} - ${item.quantity} ${item.unit} - ${formatMoneyFromCents(item.totalInCents)}`,
      selectedOptions.length > 0 ? `   Sabores: ${selectedOptions.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  })
  const discountLines = [
    order.promotionDiscountInCents > 0 ? `Descontos: -${formatMoneyFromCents(order.promotionDiscountInCents)}` : null,
    order.couponDiscountInCents > 0 && order.coupon
      ? `Cupom ${order.coupon.code}: -${formatMoneyFromCents(order.couponDiscountInCents)}`
      : null,
    order.pixDiscountInCents > 0
      ? `${paymentDiscountLabel}: -${formatMoneyFromCents(order.pixDiscountInCents)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n")

  return renderTemplate(template, {
    pedido: `*${orderNumber}*`,
    cliente: buyerLine,
    itens: itemLines.join("\n"),
    subtotal: formatMoneyFromCents(order.subtotalInCents),
    descontos: discountLines,
    total: `*${formatMoneyFromCents(order.totalInCents)}*`,
    pagamento: getPaymentMethodInstruction(order.paymentMethod),
    observacoes: order.notes ? `Observações: ${order.notes}` : "",
  })
}

function renderTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((message, [key, value]) => message.replaceAll(`{${key}}`, value), template)
}

function SelectedOptionsList({ value }: { value: unknown }) {
  const options = formatSelectedOptions(value)
  if (options.length === 0) return null

  return (
    <ul className="mt-2 space-y-1 text-[10px] font-bold uppercase text-foreground/70">
      {options.map((option) => (
        <li key={option}>{option}</li>
      ))}
    </ul>
  )
}

function formatSelectedOptions(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((option) => {
      if (!option || typeof option !== "object") return null
      const record = option as { name?: unknown; quantity?: unknown }
      const name = typeof record.name === "string" ? record.name : ""
      const quantity = typeof record.quantity === "number" ? record.quantity : 0

      return name && quantity > 0 ? `${quantity}x ${name}` : null
    })
    .filter((option): option is string => Boolean(option))
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
