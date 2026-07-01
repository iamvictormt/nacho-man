import { CalendarDays, CreditCard, PackageCheck, ReceiptText, WalletCards } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminSearch } from "@/components/admin-search"
import { AdminSelect } from "@/components/admin-form-fields"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { AdminManageModal } from "@/components/admin-manage-modal"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, type SearchParams } from "@/lib/pagination"
import { deleteOrderAction, updateOrderStatusAction } from "./actions"

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
  DELIVERED: "border-lime/30 bg-lime/10 text-lime",
  CANCELLED: "border-red-400/30 bg-red-500/10 text-red-300",
}

export default async function AdminOrdersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const page = getCurrentPage(resolvedSearchParams)
  const totalOrders = await prisma.order.count()
  const pagination = getPagination(page, totalOrders, 10)
  const [orders, awaiting, inProgress] = await Promise.all([
    prisma.order.findMany({
      include: { franchise: true, user: true, items: true },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.order.count({ where: { status: { in: ["AWAITING_SERVICE", "AWAITING_PAYMENT"] } } }),
    prisma.order.count({ where: { status: { in: ["PAYMENT_CONFIRMED", "PICKING", "SHIPPED"] } } }),
  ])

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Operação</p>
          <h1 className="mt-3 text-4xl font-black uppercase">Pedidos</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Acompanhe pagamentos, separação e entrega dos pedidos da rede.
          </p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:gap-3 md:w-auto">
          <Summary value={totalOrders} label="Total" />
          <Summary value={awaiting} label="Aguardando" accent="purple" />
          <Summary value={inProgress} label="Em andamento" />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <AdminSearch containerId="orders-list" placeholder="Buscar número, unidade ou status..." />
      </div>

      {orders.length > 0 ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
          <div className="hidden grid-cols-[minmax(200px,1.35fr)_minmax(160px,1fr)_110px_110px_145px_72px] gap-5 border-b border-border bg-graphite px-5 py-3 xl:grid">
            {["Pedido", "Itens", "Total", "Pagamento", "Status", "Ações"].map((label) => (
              <p key={label} className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
            ))}
          </div>

          <div id="orders-list" className="divide-y divide-border">
            {orders.map((order) => {
              const number = `NF-${String(order.number).padStart(5, "0")}`
              const preview = order.items.slice(0, 2)
              const buyerName = order.franchise?.tradeName ?? order.user?.name ?? "Cliente Nacho Man"
              return (
                <article
                  key={order.id}
                  data-search={`${number} ${buyerName} ${statusLabels[order.status]}`}
                  className="group relative grid gap-4 px-4 py-5 transition hover:bg-graphite/55 sm:grid-cols-2 sm:px-5 xl:grid-cols-[minmax(200px,1.35fr)_minmax(160px,1fr)_110px_110px_145px_72px] xl:items-center"
                >
                  <span
                    className={`absolute inset-y-4 left-0 w-0.5 rounded-full ${order.status === "CANCELLED" ? "bg-red-400" : "bg-lime"}`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ReceiptText className="h-4 w-4 text-lime" />
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime">{number}</p>
                    </div>
                    <h2 className="mt-2 truncate text-sm font-black uppercase">{buyerName}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-purple-medium" />
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-muted-foreground xl:hidden">Itens</p>
                    <p className="mt-1 truncate text-xs font-bold text-foreground/80 xl:mt-0">
                      {preview.map((item) => `${item.quantity}x ${item.name}`).join(" · ")}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase text-purple-medium">
                      {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground xl:hidden">Total</p>
                    <p className="mt-1 text-base font-black text-lime xl:mt-0">
                      {formatMoneyFromCents(order.totalInCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground xl:hidden">Pagamento</p>
                    <p className="mt-1 flex items-center gap-2 text-xs font-bold xl:mt-0">
                      {order.paymentMethod === "PIX" ? (
                        <WalletCards className="h-4 w-4 text-lime" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-purple-medium" />
                      )}
                      {order.paymentMethod === "PIX" ? "PIX" : "Cartao"}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${statusClasses[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <AdminManageModal
                    id={`manage-order-${order.id}`}
                    title={`Pedido ${number}`}
                    description={buyerName}
                    size="xl"
                    ariaLabel={`Gerenciar pedido ${number}`}
                  >
                    <OrderManagement order={order} modalId={`manage-order-${order.id}`} />
                  </AdminManageModal>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-graphite/35 text-center">
          <PackageCheck className="h-12 w-12 text-muted" />
          <h2 className="mt-5 font-black uppercase">Nenhum pedido recebido</h2>
          <p className="mt-2 text-sm text-muted-foreground">Os pedidos enviados pelos franqueados aparecerão aqui.</p>
        </div>
      )}
      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        searchParams={resolvedSearchParams}
      />
    </main>
  )
}

function OrderManagement({
  order,
  modalId,
}: {
  order: {
    id: string
    number: number
    status: string
    paymentMethod: string
    subtotalInCents: number
    promotionDiscountInCents: number
    couponDiscountInCents: number
    pixDiscountInCents: number
    totalInCents: number
    notes: string | null
    items: {
      id: string
      name: string
      quantity: number
      unit: string
      unitPriceInCents: number
      totalInCents: number
    }[]
  }
  modalId: string
}) {
  const number = `NF-${String(order.number).padStart(5, "0")}`
  const paymentDiscountLabel = order.paymentMethod === "PIX" ? "Desconto PIX" : "Desconto cartao"
  return (
    <div className="space-y-7 pt-1">
      <section>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Itens do pedido</p>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-graphite/45">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 px-4 py-3.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase">{item.name}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {item.quantity} {item.unit} × {formatMoneyFromCents(item.unitPriceInCents)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-black text-lime">{formatMoneyFromCents(item.totalInCents)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Atualizar operação</p>
          <AdminActionForm
            action={updateOrderStatusAction}
            submitLabel="SALVAR NOVO STATUS"
            successMessage="Status atualizado com sucesso."
            modalId={modalId}
            className="mt-4"
          >
            <input type="hidden" name="orderId" value={order.id} />
            <AdminSelect name="status" label="Status do pedido" defaultValue={order.status}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </AdminSelect>
          </AdminActionForm>
          {order.notes && (
            <div className="mt-5 rounded-xl border border-border bg-graphite/50 p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Observações</p>
              <p className="mt-2 text-xs leading-5 text-foreground/80">{order.notes}</p>
            </div>
          )}
        </div>
        <div className="h-fit rounded-xl border border-border bg-graphite/55 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-medium">Resumo financeiro</p>
          <div className="mt-4 space-y-2.5 text-xs">
            <SummaryLine label="Subtotal" value={order.subtotalInCents} />
            {order.promotionDiscountInCents > 0 && (
              <SummaryLine label="Promoções" value={-order.promotionDiscountInCents} />
            )}
            {order.couponDiscountInCents > 0 && <SummaryLine label="Cupom" value={-order.couponDiscountInCents} />}
            {order.pixDiscountInCents > 0 && (
              <SummaryLine label={paymentDiscountLabel} value={-order.pixDiscountInCents} />
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base font-black">
              <span>Total</span>
              <span className="text-lime">{formatMoneyFromCents(order.totalInCents)}</span>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
            {order.paymentMethod === "PIX" ? (
              <WalletCards className="h-4 w-4 text-lime" />
            ) : (
              <CreditCard className="h-4 w-4 text-purple-medium" />
            )}
            {order.paymentMethod === "PIX" ? "Pagamento via PIX" : "Pagamento via cartao"}
          </p>
        </div>
      </section>
      {order.status === "CANCELLED" && (
        <div className="flex justify-end border-t border-border pt-5">
          <DeleteActionDialog
            action={deleteOrderAction}
            fields={{ orderId: order.id }}
            title="Excluir pedido cancelado?"
            description={`O pedido ${number} será removido definitivamente.`}
            successMessage="Pedido excluído."
          />
        </div>
      )}
    </div>
  )
}

function Summary({ value, label, accent = "lime" }: { value: number; label: string; accent?: "lime" | "purple" }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-graphite px-2.5 py-3 text-center sm:min-w-24 sm:px-4 sm:text-left">
      <p
        className={`text-lg font-black leading-none sm:text-xl ${accent === "purple" ? "text-purple-medium" : "text-lime"}`}
      >
        {value}
      </p>
      <p className="mt-1.5 truncate text-[7px] font-black uppercase tracking-wider text-muted-foreground sm:text-[8px]">
        {label}
      </p>
    </div>
  )
}
function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className={value < 0 ? "text-lime" : ""}>
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
