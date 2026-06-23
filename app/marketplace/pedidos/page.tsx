import { requireFranchisee } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"

const statusLabels: Record<string, string> = {
  AWAITING_SERVICE: "Aguardando atendimento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  PICKING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

export default async function FranchiseOrdersPage() {
  const user = await requireFranchisee()
  const orders = await prisma.order.findMany({
    where: { franchiseId: user.franchiseId! },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Histórico</p>
      <h1 className="mt-3 text-3xl font-black uppercase">Meus pedidos</h1>

      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-border bg-graphite p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-lime">
                  NF-{String(order.number).padStart(5, "0")}
                </p>
                <p className="mt-2 text-xs font-bold uppercase text-muted-foreground">
                  {statusLabels[order.status] ?? order.status}
                </p>
                <ul className="mt-4 space-y-1 text-xs text-foreground/75">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} {item.unit} · {item.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:text-right">
                <p className="text-xl font-black text-lime">{formatMoneyFromCents(order.totalInCents)}</p>
                <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                  {order.paymentMethod === "PIX" ? "PIX com 4%" : "Cartão"}
                </p>
              </div>
            </div>
          </article>
        ))}
        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Você ainda não enviou nenhum pedido.
          </div>
        )}
      </div>
    </main>
  )
}
