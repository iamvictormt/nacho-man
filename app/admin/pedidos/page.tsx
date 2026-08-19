import { CalendarDays, CreditCard, MessageCircle, PackageCheck, ReceiptText, Truck, WalletCards } from "lucide-react"
import Link from "next/link"
import type { OrderStatus, PaymentMethod, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminInlineActionForm } from "@/components/admin-inline-action-form"
import { AdminSearch } from "@/components/admin-search"
import { AdminFieldGrid, AdminInput, AdminSelect } from "@/components/admin-form-fields"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { AdminManageModal } from "@/components/admin-manage-modal"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, getSearchQuery, type SearchParams } from "@/lib/pagination"
import {
  addOrderProductItemAction,
  cancelOrderAction,
  deleteOrderAction,
  removeOrderItemAction,
  updateOrderFulfillmentMethodAction,
  updateOrderItemQuantityAction,
  updateOrderPaymentMethodAction,
  updateOrderStatusAction,
} from "./actions"
import { getPaymentDiscountLabel, getPaymentMethodLabel } from "@/lib/payment-method"
import { formatOrderCode } from "@/lib/order-number"
import { getOrderItemCategoryName, sortOrderItemsByCategory } from "@/lib/order-items"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import {
  formatFactoryPickupScheduleAt,
  getOrderFulfillmentLabel,
  orderFulfillmentMethods,
} from "@/lib/order-fulfillment"
import { formatBrazilDateTime } from "@/lib/date-format"
import { OrderStatusForm } from "./order-status-form"

const statusLabels: Record<string, string> = {
  AWAITING_SERVICE: "Aguardando atendimento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pedido faturado",
  PICKING: "Em separação",
  INVOICED: "Pedido faturado",
  READY_FOR_PICKUP: "Pronto para retirada",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

const statusClasses: Record<string, string> = {
  AWAITING_SERVICE: "border-purple-medium/30 bg-purple-medium/10 text-purple-medium",
  AWAITING_PAYMENT:
    "border-orange-700/25 bg-orange-100 text-orange-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  PAYMENT_CONFIRMED: "border-lime/30 bg-lime/10 text-lime",
  PICKING: "border-cyan-700/25 bg-cyan-100 text-cyan-900 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
  INVOICED: "border-lime/30 bg-lime/10 text-lime",
  READY_FOR_PICKUP: "border-purple-medium/30 bg-purple-medium/10 text-purple-medium",
  SHIPPED:
    "border-blue-700/25 bg-blue-100 text-blue-900 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300",
  DELIVERED: "border-lime/30 bg-lime/10 text-lime",
  CANCELLED: "border-red-400/30 bg-red-500/10 text-red-300",
}

const editableStatusLabels = Object.entries(statusLabels).filter(
  ([status]) => status !== "CANCELLED" && status !== "PAYMENT_CONFIRMED"
)
const paymentMethods = ["PIX", "CARD", "BOLETO"] as const

function getOrderStatusFilter(searchParams?: SearchParams) {
  const status = getSearchQuery(searchParams, "status") as OrderStatus
  return Object.keys(statusLabels).includes(status) ? status : null
}

export default async function AdminOrdersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const page = getCurrentPage(resolvedSearchParams)
  const query = getSearchQuery(resolvedSearchParams)
  const statusFilter = getOrderStatusFilter(resolvedSearchParams)
  const orderWhere = getOrderWhere(query, statusFilter)
  const totalOrders = await prisma.order.count({ where: orderWhere })
  const pagination = getPagination(page, totalOrders, 10)
  const [orders, awaiting, inProgress, availableProducts, statusRows] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      include: {
        franchise: true,
        user: { include: { businessProfile: true } },
        items: { include: { product: { include: { category: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.order.count({ where: { status: { in: ["AWAITING_SERVICE", "AWAITING_PAYMENT"] } } }),
    prisma.order.count({
      where: { status: { in: ["PAYMENT_CONFIRMED", "PICKING", "INVOICED", "READY_FOR_PICKUP", "SHIPPED"] } },
    }),
    prisma.product.findMany({
      where: { active: true, category: { active: true } },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { category: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ])
  const statusCounts = Object.fromEntries(statusRows.map((row) => [row.status, row._count._all]))
  const statusFilterTotal = statusRows.reduce((total, row) => total + row._count._all, 0)

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

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <OrderStatusFilterChips
          searchParams={resolvedSearchParams}
          selectedStatus={statusFilter}
          statusCounts={statusCounts}
          total={statusFilterTotal}
        />
        <AdminSearch containerId="orders-list" placeholder="Buscar número, unidade ou status..." queryParam="q" />
      </div>

      {orders.length > 0 ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
          <div className="hidden grid-cols-[minmax(180px,0.85fr)_minmax(260px,1.2fr)_150px_220px_72px] gap-8 border-b border-border bg-graphite px-5 py-3 xl:grid">
            {["Pedido", "Itens", "Total", "Status", "Ações"].map((label) => (
              <p key={label} className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
            ))}
          </div>

          <div id="orders-list" className="divide-y divide-border">
            {orders.map((order) => {
              const number = formatOrderCode(order.number)
              const sortedItems = sortOrderItemsByCategory(order.items)
              const preview = sortedItems.slice(0, 2)
              const buyerName = order.franchise?.tradeName ?? order.user?.name ?? "Cliente Nacho Man"
              return (
                <article
                  key={order.id}
                  data-search={`${number} ${buyerName} ${statusLabels[order.status]}`}
                  className="group relative grid gap-4 px-4 py-5 transition hover:bg-graphite/55 sm:grid-cols-2 sm:px-5 xl:grid-cols-[minmax(180px,0.85fr)_minmax(260px,1.2fr)_150px_220px_72px] xl:items-center xl:gap-8"
                >
                  <span
                    className={`absolute inset-y-4 left-0 w-0.5 rounded-full ${order.status === "CANCELLED" ? "bg-red-400" : "bg-lime"}`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ReceiptText className="h-4 w-4 text-lime" />
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime">{number}</p>
                    </div>
                    <h2 className="mt-2 truncate text-xs font-black uppercase leading-4">{buyerName}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-purple-medium" />
                      {formatBrazilDateTime(order.createdAt)}
                    </p>
                    {order.scheduledPickupAt && (
                      <p className="mt-1 text-[10px] font-bold leading-4 text-lime">
                        Retirada {formatFactoryPickupScheduleAt(order.scheduledPickupAt)}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-muted-foreground xl:hidden">Itens</p>
                    <p className="mt-1 truncate text-xs font-bold text-foreground/80 xl:mt-0">
                      {preview.map((item) => `${item.quantity}x ${item.name}`).join(" · ")}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase text-purple-medium">
                      {sortedItems.length} {sortedItems.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground xl:hidden">Total</p>
                    <p className="mt-1 text-base font-black text-lime xl:mt-0">
                      {formatMoneyFromCents(order.totalInCents)}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 text-[10px] font-bold text-foreground/80">
                      {order.paymentMethod === "PIX" && <WalletCards className="h-4 w-4 text-lime" />}
                      {order.paymentMethod === "CARD" && <CreditCard className="h-4 w-4 text-purple-medium" />}
                      {order.paymentMethod === "BOLETO" && <ReceiptText className="h-4 w-4 text-purple-medium" />}
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </p>
                  </div>
                  <div>
                    <OrderStatusForm
                      orderId={order.id}
                      orderNumber={number}
                      currentStatus={order.status}
                      currentStatusLabel={statusLabels[order.status] ?? order.status}
                      options={editableStatusLabels.map(([value, label]) => ({ value, label }))}
                      statusClassNames={statusClasses}
                    />
                  </div>
                  <AdminManageModal
                    id={`manage-order-${order.id}`}
                    title={`Pedido ${number}`}
                    description={buyerName}
                    size="xl"
                    ariaLabel={`Gerenciar pedido ${number}`}
                  >
                    <OrderManagement
                      order={{ ...order, items: sortedItems }}
                      modalId={`manage-order-${order.id}`}
                      availableProducts={availableProducts}
                    />
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
  availableProducts,
}: {
  order: {
    id: string
    number: number
    status: string
    paymentMethod: string
    fulfillmentMethod: string
    subtotalInCents: number
    promotionDiscountInCents: number
    couponDiscountInCents: number
    pixDiscountInCents: number
    totalInCents: number
    notes: string | null
    scheduledPickupAt: Date | null
    franchiseId: string | null
    franchise: {
      tradeName: string
      whatsapp: string | null
    } | null
    user: {
      name: string
      email: string
      businessProfile: {
        phone: string | null
      } | null
    } | null
    items: {
      id: string
      name: string
      quantity: number
      unit: string
      unitPriceInCents: number
      totalInCents: number
      selectedOptions: unknown
      product?: {
        stockQuantity?: number | null
        category?: {
          name: string
          sortOrder: number
        } | null
      } | null
    }[]
  }
  modalId: string
  availableProducts: {
    id: string
    name: string
    unit: string
    audience: string
    minimumQuantity: number
    stockQuantity: number | null
    category: {
      name: string
    }
  }[]
}) {
  const number = formatOrderCode(order.number)
  const paymentDiscountLabel = getPaymentDiscountLabel(order.paymentMethod)
  const defaultEditableStatus = order.status === "CANCELLED" ? undefined : order.status
  const canRemoveItems = order.status !== "CANCELLED" && order.items.length > 1
  const ownerWhatsApp = getOrderOwnerWhatsApp(order)
  const ownerName = order.franchise?.tradeName ?? order.user?.name ?? "cliente"
  const ownerWhatsAppMessage = `Olá, ${ownerName}! Aqui é a Nacho Factory sobre o pedido ${number}.`
  const orderAudience = order.franchiseId ? "FRANCHISEE" : "PUBLIC"
  const productsForOrder = availableProducts.filter((product) => product.audience === orderAudience)
  return (
    <div className="space-y-7 pt-1">
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-graphite/45 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Contato do pedido</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ownerWhatsApp ? `Falar com ${ownerName}` : "Este pedido não tem WhatsApp cadastrado."}
          </p>
        </div>
        {ownerWhatsApp && (
          <a
            href={buildWhatsAppUrl(ownerWhatsApp, ownerWhatsAppMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-[10px] font-black uppercase text-white shadow-[0_0_0_rgba(37,211,102,0)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_24px_rgba(37,211,102,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <MessageCircle className="h-4 w-4" />
            Chamar no WhatsApp
          </a>
        )}
      </section>
      <section>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Itens do pedido</p>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-graphite/45">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 px-4 py-4 transition hover:bg-background/45 min-[720px]:grid-cols-[minmax(0,1fr)_minmax(220px,auto)] min-[720px]:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-purple-medium/25 bg-purple-medium/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-purple-medium">
                    {getOrderItemCategoryName(item) ?? "Combo"}
                  </span>
                  {typeof item.product?.stockQuantity === "number" && item.product.stockQuantity > 0 && (
                    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                      Estoque {item.product.stockQuantity}
                    </span>
                  )}
                  {item.product?.stockQuantity === 0 && (
                    <span className="rounded-full border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-red-300">
                      Sem estoque
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-black uppercase leading-5 text-foreground">{item.name}</p>
                <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <p className="text-lg font-black leading-none text-lime">{formatMoneyFromCents(item.totalInCents)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {item.quantity} {item.unit} x {formatMoneyFromCents(item.unitPriceInCents)}
                  </p>
                </div>
                <SelectedOptionsList value={item.selectedOptions} />
              </div>
              <div className="w-full rounded-xl border border-border bg-background/55 p-3 min-[720px]:w-[236px]">
                {order.status !== "CANCELLED" && (
                  <AdminInlineActionForm
                    action={updateOrderItemQuantityAction}
                    label="Salvar qtd"
                    successMessage="Quantidade atualizada."
                    alignWithField
                    className="w-full min-[420px]:w-full"
                    buttonClassName="h-12 min-w-0 flex-1 px-4 text-[10px] hover:bg-lime hover:shadow-[0_0_24px_rgba(239,255,13,.25)] min-[420px]:w-auto"
                  >
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <AdminInput
                      name="quantity"
                      label="Qtd"
                      mask="integer"
                      min={1}
                      max={999}
                      defaultValue={item.quantity}
                      className="w-16"
                    />
                  </AdminInlineActionForm>
                )}
                {canRemoveItems && (
                  <div className={order.status !== "CANCELLED" ? "mt-2" : ""}>
                    <DeleteActionDialog
                      action={removeOrderItemAction}
                      fields={{ orderId: order.id, itemId: item.id }}
                      title="Remover item do pedido?"
                      description={`O item ${item.name} será removido e os totais do pedido ${number} serão recalculados.`}
                      label="Remover item"
                      successMessage="Item removido do pedido."
                      triggerClassName="min-h-10 w-full justify-center border-red-400/20 bg-red-500/[0.03] text-[8px] min-[420px]:w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {order.status !== "CANCELLED" && (
          <div className="mt-4 rounded-xl border border-border bg-graphite/45 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Adicionar produto</p>
            <AdminActionForm
              action={addOrderProductItemAction}
              submitLabel="ADICIONAR AO PEDIDO"
              successMessage="Produto adicionado ao pedido."
              className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px] md:items-start"
              submitClassName="mt-0 h-12 w-full"
              alignSubmitWithField
            >
              <input type="hidden" name="orderId" value={order.id} />
              <AdminFieldGrid columns="wide-first" className="gap-4 md:gap-4">
                <AdminSelect name="productId" label="Produto" required placeholder="Selecione um produto">
                  {productsForOrder.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.category.name} - {product.name}
                      {typeof product.stockQuantity === "number" ? ` (Estoque ${product.stockQuantity})` : ""}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput
                  name="quantity"
                  label="Quantidade"
                  mask="integer"
                  min={1}
                  max={999}
                  defaultValue={1}
                  required
                />
              </AdminFieldGrid>
            </AdminActionForm>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="rounded-xl border border-border bg-graphite/45 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Atualizar operação</p>
            <div className="mt-4 space-y-4">
              <AdminActionForm
                action={updateOrderStatusAction}
                submitLabel="SALVAR STATUS"
                successMessage="Status atualizado com sucesso."
                modalId={modalId}
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start"
                submitClassName="mt-0 h-12 w-full"
                alignSubmitWithField
              >
                <input type="hidden" name="orderId" value={order.id} />
                <AdminSelect name="status" label="Status do pedido" defaultValue={defaultEditableStatus}>
                  {editableStatusLabels.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </AdminSelect>
              </AdminActionForm>
              <AdminActionForm
                action={updateOrderPaymentMethodAction}
                submitLabel="SALVAR PAGAMENTO"
                successMessage="Forma de pagamento atualizada."
                modalId={modalId}
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start"
                submitClassName="mt-0 h-12 w-full"
                alignSubmitWithField
              >
                <input type="hidden" name="orderId" value={order.id} />
                <AdminSelect name="paymentMethod" label="Forma de pagamento" defaultValue={order.paymentMethod}>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {getPaymentMethodLabel(method)}
                    </option>
                  ))}
                </AdminSelect>
              </AdminActionForm>
              <AdminActionForm
                action={updateOrderFulfillmentMethodAction}
                submitLabel="SALVAR ENTREGA"
                successMessage="Tipo de entrega atualizado."
                modalId={modalId}
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start"
                submitClassName="mt-0 h-12 w-full"
                alignSubmitWithField
              >
                <input type="hidden" name="orderId" value={order.id} />
                <AdminSelect
                  name="fulfillmentMethod"
                  label="Entrega ou retirada"
                  defaultValue={order.fulfillmentMethod}
                >
                  {orderFulfillmentMethods.map((method) => (
                    <option key={method} value={method}>
                      {getOrderFulfillmentLabel(method)}
                    </option>
                  ))}
                </AdminSelect>
              </AdminActionForm>
              {order.scheduledPickupAt && (
                <div className="rounded-xl border border-lime/25 bg-lime/10 p-4 text-xs font-bold leading-5 text-lime">
                  Retirada agendada para {formatFactoryPickupScheduleAt(order.scheduledPickupAt)}
                </div>
              )}
            </div>
          </div>
          {order.status !== "CANCELLED" && (
            <div className="mt-4 flex justify-end border-t border-border pt-4">
              <DeleteActionDialog
                action={cancelOrderAction}
                fields={{ orderId: order.id }}
                title="Cancelar pedido?"
                description={`O pedido ${number} será marcado como cancelado. Ele continuará no histórico e poderá ser excluído depois se necessário.`}
                label="CANCELAR PEDIDO"
                successMessage="Pedido cancelado."
              />
            </div>
          )}
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
            {order.paymentMethod === "PIX" && <WalletCards className="h-4 w-4 text-lime" />}
            {order.paymentMethod === "CARD" && <CreditCard className="h-4 w-4 text-purple-medium" />}
            {order.paymentMethod === "BOLETO" && <ReceiptText className="h-4 w-4 text-purple-medium" />}
            Pagamento via {getPaymentMethodLabel(order.paymentMethod)}
          </p>
          <p className="mt-2 flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
            <Truck className="h-4 w-4 text-purple-medium" />
            {getOrderFulfillmentLabel(order.fulfillmentMethod)}
          </p>
          {order.scheduledPickupAt && (
            <p className="mt-2 text-[10px] font-bold leading-4 text-lime">
              {formatFactoryPickupScheduleAt(order.scheduledPickupAt)}
            </p>
          )}
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

function OrderStatusFilterChips({
  searchParams,
  selectedStatus,
  statusCounts,
  total,
}: {
  searchParams?: SearchParams
  selectedStatus: OrderStatus | null
  statusCounts: Record<string, number>
  total: number
}) {
  const visibleStatuses = Object.entries(statusLabels).filter(
    ([status]) => (statusCounts[status] ?? 0) > 0 || selectedStatus === status
  )

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filtrar pedidos por status atual">
      <OrderStatusFilterLink
        active={!selectedStatus}
        href={adminOrderStatusHref(searchParams, null)}
        label="Todos"
        count={total}
      />
      {visibleStatuses.map(([status, label]) => (
        <OrderStatusFilterLink
          key={status}
          active={selectedStatus === status}
          href={adminOrderStatusHref(searchParams, status)}
          label={label}
          count={statusCounts[status] ?? 0}
        />
      ))}
    </nav>
  )
}

function adminOrderStatusHref(searchParams: SearchParams | undefined, status: string | null) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "page" || key === "status" || value === undefined) continue
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
    else params.set(key, value)
  }

  if (status) params.set("status", status)
  const query = params.toString()

  return query ? `/admin/pedidos?${query}` : "/admin/pedidos"
}

function OrderStatusFilterLink({
  active,
  href,
  label,
  count,
}: {
  active: boolean
  href: string
  label: string
  count: number
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-wider transition ${
        active
          ? "border-lime bg-lime text-background"
          : "border-border bg-graphite text-muted-foreground hover:border-lime/40 hover:text-lime"
      }`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[9px] ${active ? "bg-background/15" : "bg-background"}`}>
        {count}
      </span>
    </Link>
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

function getOrderWhere(query: string, statusFilter: OrderStatus | null): Prisma.OrderWhereInput {
  const statusWhere: Prisma.OrderWhereInput | null = statusFilter ? { status: statusFilter } : null
  if (!query) return statusWhere ?? {}

  const normalizedQuery = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  const statusMatches = Object.entries(statusLabels)
    .filter(([status, label]) => `${status} ${label}`.toLowerCase().includes(normalizedQuery))
    .map(([status]) => status as OrderStatus)
  const paymentMatches = paymentMethods.filter((method) =>
    `${method} ${getPaymentMethodLabel(method)}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(normalizedQuery)
  ) as PaymentMethod[]
  const number = Number(query.replace(/\D/g, ""))

  const filters: Prisma.OrderWhereInput[] = [
    { franchise: { tradeName: { contains: query, mode: "insensitive" } } },
    { user: { name: { contains: query, mode: "insensitive" } } },
    { user: { email: { contains: query, mode: "insensitive" } } },
    { items: { some: { name: { contains: query, mode: "insensitive" } } } },
  ]

  if (Number.isInteger(number) && number > 0) filters.push({ number })
  if (statusMatches.length > 0) filters.push({ status: { in: statusMatches } })
  if (paymentMatches.length > 0) filters.push({ paymentMethod: { in: paymentMatches } })

  const queryWhere: Prisma.OrderWhereInput = { OR: filters }
  return statusWhere ? { AND: [statusWhere, queryWhere] } : queryWhere
}

function getOrderOwnerWhatsApp(order: {
  franchise: { whatsapp: string | null } | null
  user: { businessProfile: { phone: string | null } | null } | null
}) {
  const rawPhone = order.franchise?.whatsapp ?? order.user?.businessProfile?.phone
  const digits = String(rawPhone ?? "").replace(/\D/g, "")
  if (!digits) return null

  return digits.startsWith("55") ? digits : `55${digits}`
}
