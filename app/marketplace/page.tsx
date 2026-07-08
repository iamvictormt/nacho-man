import Link from "next/link"
import {
  ArrowRight,
  Gift,
  type LucideIcon,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireMarketplaceUser } from "@/lib/auth"
import { formatMoneyFromCents } from "@/lib/money"
import { getPaymentDiscountSettings, getStoreWhatsAppNumber } from "@/lib/site-settings"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"
import { MarketplaceComboCard } from "@/components/marketplace-combo-card"
import { PrivatePageHeader } from "@/components/private-page-header"
import { ProductDetailCard } from "@/components/product-detail-card"
import { formatOrderCode } from "@/lib/order-number"

const statusLabels: Record<string, string> = {
  AWAITING_SERVICE: "Aguardando atendimento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  PICKING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

const activeOrderStatuses = ["AWAITING_SERVICE", "AWAITING_PAYMENT", "PAYMENT_CONFIRMED", "PICKING", "SHIPPED"] as const

function discountForRole(percent: number, franchiseeOnly: boolean, role: string) {
  return franchiseeOnly && role !== "FRANCHISEE" ? 0 : percent
}

export default async function MarketplacePage() {
  const user = await requireMarketplaceUser()
  const [whatsappNumber, paymentDiscounts] = await Promise.all([getStoreWhatsAppNumber(), getPaymentDiscountSettings()])
  const pixDiscountPercent = discountForRole(
    paymentDiscounts.pixDiscountPercent,
    paymentDiscounts.pixFranchiseeOnly,
    user.role
  )
  const cardDiscountPercent = discountForRole(
    paymentDiscounts.cardDiscountPercent,
    paymentDiscounts.cardFranchiseeOnly,
    user.role
  )
  const boletoDiscountPercent = discountForRole(
    paymentDiscounts.boletoDiscountPercent,
    paymentDiscounts.boletoFranchiseeOnly,
    user.role
  )
  const paymentDiscountSummary = [
    pixDiscountPercent > 0 ? `PIX com ${pixDiscountPercent}% OFF` : null,
    cardDiscountPercent > 0 ? `cartão com ${cardDiscountPercent}% OFF` : null,
    user.role === "FRANCHISEE" && boletoDiscountPercent > 0
      ? `boleto com ${boletoDiscountPercent}% OFF`
      : user.role === "FRANCHISEE"
        ? "boleto disponível"
        : null,
  ]
    .filter(Boolean)
    .join(" - ")
  const now = new Date()
  const showCombos = user.role === "FRANCHISEE"
  const audience = user.role === "FRANCHISEE" ? "FRANCHISEE" : "PUBLIC"
  const orderOwnerWhere = user.role === "FRANCHISEE" ? { franchiseId: user.franchiseId! } : { userId: user.id }
  const activeComboWhere = {
    active: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  }

  const [products, combos, productCount, comboCount, activeOrderCount, recentOrders] = await Promise.all([
    prisma.product.findMany({
      where: { audience, active: true, category: { active: true } },
      include: { category: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 3,
    }),
    showCombos
      ? prisma.combo.findMany({
          where: activeComboWhere,
          include: { options: { include: { product: { select: { name: true, image: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
    prisma.product.count({ where: { audience, active: true, category: { active: true } } }),
    showCombos ? prisma.combo.count({ where: activeComboWhere }) : Promise.resolve(0),
    prisma.order.count({
      where: { ...orderOwnerWhere, status: { in: [...activeOrderStatuses] } },
    }),
    prisma.order.findMany({
      where: orderOwnerWhere,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ])

  const lastOrder = recentOrders[0]

  return (
    <main>
      <PrivatePageHeader
        eyebrow={`Olá, ${user.name}`}
        title={
          <>
            Painel da <span className="text-lime neon-glow">Factory.</span>
          </>
        }
        description={
          showCombos
            ? "Acompanhe sua reposição, veja pedidos em andamento e acesse rapidamente produtos e combos disponíveis para sua unidade."
            : "Acompanhe seus pedidos em andamento e acesse rapidamente os produtos disponíveis."
        }
        icon={ShoppingBag}
      >
        <div className="flex max-w-xs items-center gap-3 rounded-2xl border border-lime/20 bg-lime/10 p-4">
          <ShieldCheck className="h-6 w-6 shrink-0 text-lime" />
          <div>
            <p className="text-xs font-black uppercase">{paymentDiscountSummary || "Pagamento pelo WhatsApp"}</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Desconto aplicado automaticamente ao pedido.
            </p>
          </div>
        </div>
      </PrivatePageHeader>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 md:py-16">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStat
            icon={PackageSearch}
            label="Produtos ativos"
            value={String(productCount)}
            href="/marketplace/produtos"
          />
          {showCombos && (
            <DashboardStat icon={Gift} label="Combos ativos" value={String(comboCount)} href="/marketplace/combos" />
          )}
          <DashboardStat
            icon={Truck}
            label="Pedidos em andamento"
            value={String(activeOrderCount)}
            href="/marketplace/pedidos"
          />
          <DashboardStat
            icon={ReceiptText}
            label="Último pedido"
            value={lastOrder ? formatOrderCode(lastOrder.number) : "Nenhum"}
            href="/marketplace/pedidos"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-border bg-graphite p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime">Ações rápidas</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">O que você pode precisar</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <QuickLink
                href="/marketplace/produtos"
                title="Ver produtos"
                text="Buscar itens de reposição por nome, categoria ou embalagem."
              />
              {showCombos && (
                <QuickLink
                  href="/marketplace/combos"
                  title="Ver combos"
                  text="Aproveitar ofertas montadas com vários produtos."
                />
              )}
              <QuickLink
                href="/marketplace/pedidos"
                title="Meus pedidos"
                text="Conferir status, valores e itens já solicitados."
              />
              <QuickLink
                href={buildWhatsAppUrl(whatsappNumber)}
                title="Falar com suporte"
                text="Tirar dúvidas com o time Nacho Factory."
                external
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime">Histórico</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">Pedidos recentes</h2>
              </div>
              <Link
                href="/marketplace/pedidos"
                className="text-[10px] font-black uppercase tracking-wider text-lime hover:text-foreground"
              >
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <article key={order.id} className="rounded-xl border border-border bg-graphite p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-lime">
                        {formatOrderCode(order.number)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-muted-foreground">
                        {statusLabels[order.status] ?? order.status}
                      </p>
                      <p className="mt-2 line-clamp-1 text-xs text-foreground/70">
                        {order.items.map((item) => `${item.quantity}x ${item.name}`).join(" · ")}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-lime">{formatMoneyFromCents(order.totalInCents)}</p>
                  </div>
                </article>
              ))}
              {recentOrders.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Você ainda não enviou pedidos.
                </div>
              )}
            </div>
          </div>
        </section>

        {showCombos && combos.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Condições especiais"
              title={
                <>
                  Combos da <span className="text-lime">Factory</span>
                </>
              }
              href="/marketplace/combos"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {combos.map((combo) => (
                <MarketplaceComboCard key={combo.id} combo={combo} />
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Catálogo exclusivo"
              title={
                <>
                  Produtos em <span className="text-lime">destaque</span>
                </>
              }
              href="/marketplace/produtos"
            />
            <div className="mt-8 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => (
                <ProductDetailCard
                  key={product.id}
                  product={adaptMarketplaceProduct(product)}
                  commerce={{
                    context: "marketplace",
                    id: product.id,
                    unit: product.unit,
                    packageLabel: product.packageLabel,
                    minimumQuantity: product.minimumQuantity,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function DashboardStat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-background p-5 transition hover:border-lime/35 hover:bg-graphite"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-lime/25 bg-lime/10">
          <Icon className="h-5 w-5 text-lime" />
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-lime" />
      </div>
      <p className="mt-5 text-3xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
    </Link>
  )
}

function QuickLink({ href, title, text, external }: { href: string; title: string; text: string; external?: boolean }) {
  const className =
    "group block rounded-xl border border-border bg-background p-4 transition hover:border-lime/35 hover:bg-lime/5"
  const content = (
    <>
      <span className="flex items-center justify-between gap-3 text-xs font-black uppercase text-foreground">
        {title}
        <ArrowRight className="h-4 w-4 text-lime transition group-hover:translate-x-1" />
      </span>
      <span className="mt-2 block text-xs leading-5 text-muted-foreground">{text}</span>
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

function SectionHeader({ eyebrow, title, href }: { eyebrow: string; title: React.ReactNode; href: string }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-lime">
          <span className="h-px w-8 bg-lime/70" />
          {eyebrow}
        </p>
        <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.035em] md:text-5xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-[10px] font-black uppercase tracking-wider text-foreground transition hover:border-lime/35 hover:text-lime"
      >
        Ver todos
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
