import { KeyRound, UserRound } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireMarketplaceUser } from "@/lib/auth"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminFieldGrid, AdminInput } from "@/components/admin-form-fields"
import { AdminLocationFields } from "@/components/admin-location-fields"
import { PrivatePageHeader } from "@/components/private-page-header"
import { updateMyAccountAction, updateMyPasswordAction } from "./actions"

const activeOrderStatuses = ["AWAITING_SERVICE", "AWAITING_PAYMENT", "PAYMENT_CONFIRMED", "PICKING", "SHIPPED"] as const

const statusLabels: Record<string, string> = {
  AWAITING_SERVICE: "Aguardando atendimento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  PICKING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

export default async function MarketplaceAccountPage() {
  const currentUser = await requireMarketplaceUser()
  const orderOwnerWhere =
    currentUser.role === "FRANCHISEE" && currentUser.franchiseId
      ? { franchiseId: currentUser.franchiseId }
      : { userId: currentUser.id }
  const [user, totalOrders, activeOrders, lastOrder] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        franchise: {
          select: {
            legalName: true,
            tradeName: true,
            document: true,
            whatsapp: true,
            addresses: { select: { city: true, state: true }, take: 1 },
          },
        },
        businessProfile: {
          select: {
            legalName: true,
            tradeName: true,
            document: true,
            email: true,
            phone: true,
            state: true,
            city: true,
          },
        },
        _count: { select: { orders: true } },
      },
    }),
    prisma.order.count({
      where: orderOwnerWhere,
    }),
    prisma.order.count({
      where: { ...orderOwnerWhere, status: { in: [...activeOrderStatuses] } },
    }),
    prisma.order.findFirst({
      where: orderOwnerWhere,
      select: { number: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  if (!user) return null

  const franchise = user.franchise as
    | {
        legalName?: string | null
        tradeName?: string | null
        document?: string | null
        whatsapp?: string | null
        addresses: Array<{ city?: string | null; state?: string | null }>
      }
    | null
  const businessProfile = user.businessProfile as
    | {
        legalName?: string | null
        tradeName?: string | null
        document?: string | null
        email?: string | null
        phone?: string | null
        state?: string | null
        city?: string | null
      }
    | null
  const address = franchise?.addresses[0]
  const isFranchisee = user.role === "FRANCHISEE"
  const showLegacyFranchiseFields = false
  const location = address ? `${address.city} - ${address.state}` : "Não informada"

  return (
    <main>
      <PrivatePageHeader
        eyebrow="Minha conta"
        title={
          <>
            Seus dados na <span className="text-lime neon-glow">Factory.</span>
          </>
        }
        description="Atualize suas informações de acesso e mantenha seus dados comerciais corretos para atendimento e pedidos."
        icon={UserRound}
      />

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-background p-5 md:p-6">
            <AdminActionForm
              action={updateMyAccountAction}
              submitLabel="SALVAR ALTERAÇÕES"
              successMessage="Dados atualizados."
              className="space-y-7"
            >
              <div>
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.16em] text-lime">Dados de acesso</p>
                <AdminFieldGrid columns="equal">
                  <AdminInput name="name" label="Nome" defaultValue={user.name} required />
                  <AdminInput name="email" label="E-mail" mask="email" defaultValue={user.email} required />
                </AdminFieldGrid>
              </div>

              <div className="border-t border-border pt-7">
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.16em] text-lime">
                  {isFranchisee ? "Dados da unidade" : "Dados comerciais"}
                </p>
                <AdminFieldGrid columns="equal">
                  <AdminInput
                    name="legalName"
                    label="Razão social"
                    defaultValue={isFranchisee ? franchise?.legalName ?? "" : businessProfile?.legalName ?? ""}
                    required
                  />
                  <AdminInput
                    name="tradeName"
                    label={isFranchisee ? "Nome da unidade" : "Nome fantasia"}
                    defaultValue={isFranchisee ? franchise?.tradeName ?? "" : businessProfile?.tradeName ?? ""}
                    required
                  />
                </AdminFieldGrid>
                <AdminFieldGrid className="mt-5" columns="equal">
                  <AdminInput
                    name="document"
                    label="CNPJ"
                    mask="cnpj"
                    defaultValue={isFranchisee ? franchise?.document ?? "" : businessProfile?.document ?? ""}
                    required
                  />
                  <AdminInput
                    name="businessEmail"
                    label="E-mail comercial"
                    mask="email"
                    defaultValue={isFranchisee ? user.email : businessProfile?.email ?? ""}
                    required
                  />
                </AdminFieldGrid>
                <AdminFieldGrid className="mt-5" columns="equal">
                  <AdminInput
                    name="whatsapp"
                    label={isFranchisee ? "WhatsApp" : "WhatsApp comercial"}
                    mask="phone"
                    defaultValue={isFranchisee ? franchise?.whatsapp ?? "" : businessProfile?.phone ?? ""}
                  />
                </AdminFieldGrid>
                <AdminLocationFields
                  defaultState={isFranchisee ? address?.state ?? "" : businessProfile?.state ?? ""}
                  defaultCity={isFranchisee ? address?.city ?? "" : businessProfile?.city ?? ""}
                />
              </div>

              {showLegacyFranchiseFields && isFranchisee && (
                <div className="border-t border-border pt-7">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.16em] text-lime">Dados da unidade</p>
                  <AdminInput
                    name="tradeName"
                    label="Nome da unidade"
                    defaultValue={franchise?.tradeName ?? ""}
                    required
                  />
                  <AdminFieldGrid className="mt-5" columns="equal">
                    <AdminInput name="document" label="CNPJ" mask="cnpj" defaultValue={franchise?.document ?? ""} />
                    <AdminInput
                      name="whatsapp"
                      label="WhatsApp"
                      mask="phone"
                      defaultValue={franchise?.whatsapp ?? ""}
                    />
                  </AdminFieldGrid>
                  <AdminLocationFields defaultState={address?.state ?? ""} defaultCity={address?.city ?? ""} />
                </div>
              )}
            </AdminActionForm>
          </section>

          <section className="rounded-2xl border border-border bg-background p-5 md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-lime">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Segurança</p>
                <h2 className="mt-1 text-xl font-black uppercase">Trocar senha</h2>
              </div>
            </div>
            <AdminActionForm
              action={updateMyPasswordAction}
              submitLabel="ALTERAR SENHA"
              successMessage="Senha alterada."
            >
              <AdminFieldGrid columns="three">
                <AdminInput name="currentPassword" label="Senha atual" type="password" required />
                <AdminInput
                  name="newPassword"
                  label="Nova senha"
                  type="password"
                  required
                  minLength={8}
                  hint="Mínimo de 8 caracteres."
                />
                <AdminInput name="confirmPassword" label="Confirmar senha" type="password" required minLength={8} />
              </AdminFieldGrid>
            </AdminActionForm>
          </section>
        </div>

        <aside className="space-y-4 rounded-2xl border border-border bg-graphite p-5 md:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime">Resumo</p>
            <h2 className="mt-2 text-xl font-black uppercase">Conta e pedidos</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AccountMetric label="Total de pedidos" value={String(totalOrders)} />
            <AccountMetric label="Pedidos em andamento" value={String(activeOrders)} />
          </div>
          <div className="space-y-3">
            <AccountDetail label="Tipo" value={isFranchisee ? "Franqueado" : "Cliente comum"} />
            <AccountDetail label="E-mail" value={user.email} />
            <AccountDetail label="Cadastro" value={formatLongDate(user.createdAt)} />
            <AccountDetail label="Última atualização" value={formatLongDate(user.updatedAt)} />
            {lastOrder && (
              <AccountDetail
                label="Último pedido"
                value={`NF-${String(lastOrder.number).padStart(5, "0")} · ${statusLabels[lastOrder.status] ?? lastOrder.status}`}
              />
            )}
            {isFranchisee && (
              <>
                <AccountDetail label="Unidade" value={franchise?.tradeName ?? "Não informada"} />
                <AccountDetail label="Localização" value={location} />
                <AccountDetail label="WhatsApp" value={formatPhone(franchise?.whatsapp)} />
              </>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}

function AccountMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-lime/15 bg-lime/[0.055] px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black text-lime">{value}</p>
    </div>
  )
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold">{value}</p>
    </div>
  )
}

function formatPhone(value?: string | null) {
  const digits = value?.replace(/\D/g, "") ?? ""
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return value || "Não informado"
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}
