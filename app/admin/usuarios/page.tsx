import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock3, Mail, MapPinned, Store, UsersRound } from "lucide-react"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentPage, getPagination, getSearchQuery, type SearchParams } from "@/lib/pagination"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminDataLabel, AdminDataList, AdminDataRow } from "@/components/admin-data-list"
import { AdminFieldGrid, AdminInput } from "@/components/admin-form-fields"
import { AdminInlineActionForm } from "@/components/admin-inline-action-form"
import { AdminLocationFields } from "@/components/admin-location-fields"
import { AdminManageModal } from "@/components/admin-manage-modal"
import { AdminSearch } from "@/components/admin-search"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { PaginationControls } from "@/components/pagination-controls"
import {
  deleteUserAction,
  rejectFranchiseeUserAction,
  toggleCommonUserAction,
  toggleFranchiseeUserAction,
  updateCommonUserAction,
  updateFranchiseeUserAction,
} from "./actions"
import { TemporaryPasswordResetForm } from "./temporary-password-reset-form"

type UsersPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams
  const view = getView(resolvedSearchParams)
  const page = getCurrentPage(resolvedSearchParams)
  const query = getSearchQuery(resolvedSearchParams)
  const userWhere: Prisma.UserWhereInput =
    view === "clientes"
      ? {
          role: "USER",
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                  { businessProfile: { tradeName: { contains: query, mode: "insensitive" } } },
                  { businessProfile: { legalName: { contains: query, mode: "insensitive" } } },
                  { businessProfile: { document: { contains: query, mode: "insensitive" } } },
                  { businessProfile: { email: { contains: query, mode: "insensitive" } } },
                  { businessProfile: { city: { contains: query, mode: "insensitive" } } },
                  { businessProfile: { state: { contains: query, mode: "insensitive" } } },
                ],
              }
            : {}),
        }
      : {
          role: "FRANCHISEE",
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                  { franchise: { tradeName: { contains: query, mode: "insensitive" } } },
                  { franchise: { document: { contains: query, mode: "insensitive" } } },
                  { franchise: { whatsapp: { contains: query, mode: "insensitive" } } },
                  { franchise: { addresses: { some: { city: { contains: query, mode: "insensitive" } } } } },
                  { franchise: { addresses: { some: { state: { contains: query, mode: "insensitive" } } } } },
                ],
              }
            : {}),
        }

  const [franchiseeTotal, pendingFranchisees, activeFranchisees, commonTotal, activeCommonUsers, inactiveCommonUsers] =
    await Promise.all([
      prisma.user.count({ where: { role: "FRANCHISEE" } }),
      prisma.user.count({ where: { role: "FRANCHISEE", active: false } }),
      prisma.user.count({ where: { role: "FRANCHISEE", active: true } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", active: true } }),
      prisma.user.count({ where: { role: "USER", active: false } }),
    ])

  const filteredUsers = await prisma.user.count({ where: userWhere })
  const pagination = getPagination(page, filteredUsers)
  const [commonUsers, franchiseeUsers] =
    view === "clientes"
      ? [
          await prisma.user.findMany({
            where: userWhere,
            select: {
              id: true,
              name: true,
              email: true,
              active: true,
              mustChangePassword: true,
              createdAt: true,
              businessProfile: true,
              _count: { select: { orders: true } },
            },
            orderBy: [{ active: "desc" }, { createdAt: "desc" }],
            skip: pagination.skip,
            take: pagination.take,
          }),
          [],
        ]
      : [
          [],
          await prisma.user.findMany({
            where: userWhere,
            select: {
              id: true,
              name: true,
              email: true,
              active: true,
              mustChangePassword: true,
              createdAt: true,
              franchise: {
                select: {
                  tradeName: true,
                  document: true,
                  whatsapp: true,
                  active: true,
                  addresses: { select: { city: true, state: true }, take: 1 },
                  _count: { select: { orders: true } },
                },
              },
              _count: { select: { orders: true } },
            },
            orderBy: [{ active: "asc" }, { createdAt: "desc" }],
            skip: pagination.skip,
            take: pagination.take,
          }),
        ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Cadastros e acessos</p>
          <h1 className="mt-3 text-4xl font-black uppercase">Usuários</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Escolha entre franqueados e clientes comuns para acompanhar cadastros, status de acesso e histórico de
            pedidos.
          </p>
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <UserTypeCard
          href="/admin/usuarios?tipo=franqueados"
          active={view === "franqueados"}
          icon={Store}
          title="Franqueados"
          description="Usuários que solicitaram acesso como franqueados e seus dados de franquia."
          detail={`${franchiseeTotal} usuários · ${pendingFranchisees} pendentes`}
        />
        <UserTypeCard
          href="/admin/usuarios?tipo=clientes"
          active={view === "clientes"}
          icon={UsersRound}
          title="Não franqueados"
          description="Clientes comuns que compram no marketplace sem vínculo com unidade franqueada."
          detail={`${commonTotal} clientes · ${activeCommonUsers} ativos`}
        />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {view === "franqueados" ? (
          <>
            <StatCard label="Franqueados" value={franchiseeTotal} detail="usuários cadastrados" icon={Store} />
            <StatCard label="Ativos" value={activeFranchisees} detail="com acesso liberado" icon={CheckCircle2} />
            <StatCard label="Pendentes" value={pendingFranchisees} detail="aguardando aprovação" icon={Clock3} />
          </>
        ) : (
          <>
            <StatCard label="Clientes" value={commonTotal} detail="contas comuns" icon={UsersRound} />
            <StatCard label="Ativos" value={activeCommonUsers} detail="podem comprar" icon={CheckCircle2} />
            <StatCard label="Inativos" value={inactiveCommonUsers} detail="acesso bloqueado" icon={Clock3} />
          </>
        )}
      </section>

      <div className="mt-8 flex justify-end">
        <AdminSearch
          containerId="users-grid"
          placeholder={
            view === "franqueados" ? "Buscar franqueado, e-mail, unidade ou CNPJ..." : "Buscar cliente ou e-mail..."
          }
          queryParam="q"
        />
      </div>

      <div id="users-grid" className="mt-6">
        {view === "franqueados" ? (
          <FranchiseUsersList users={franchiseeUsers} />
        ) : (
          <CommonUsersList users={commonUsers} />
        )}
      </div>

      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        searchParams={resolvedSearchParams}
      />
    </main>
  )
}

type FranchiseeUser = {
  id: string
  name: string
  email: string
  active: boolean
  mustChangePassword: boolean
  createdAt: Date
  franchise: {
    tradeName: string
    document: string | null
    whatsapp: string | null
    active: boolean
    addresses: { city: string; state: string }[]
    _count: { orders: number }
  } | null
  _count: { orders: number }
}

function FranchiseUsersList({ users }: { users: FranchiseeUser[] }) {
  return (
    <AdminDataList
      headers={["Franqueado", "Unidade", "Pedidos", "Cadastro", "Status", "Ações"]}
      template="minmax(210px,1.35fr) minmax(220px,1.25fr) 90px 120px 100px 72px"
      isEmpty={users.length === 0}
      emptyTitle="Nenhum usuário franqueado cadastrado"
      emptyDescription="Quando alguém solicitar cadastro como franqueado, ele aparecerá nesta lista."
    >
      {users.map((user) => {
        const franchise = user.franchise
        const address = franchise?.addresses[0]
        const hasOrderHistory = user._count.orders > 0 || (franchise?._count.orders ?? 0) > 0
        const location = address ? `${address.city} - ${address.state}` : "Localização não informada"
        return (
          <AdminDataRow
            key={user.id}
            template="minmax(210px,1.35fr) minmax(220px,1.25fr) 90px 120px 100px 72px"
            search={`${user.name} ${user.email} ${franchise?.tradeName ?? ""} ${franchise?.document ?? ""} ${franchise?.whatsapp ?? ""}`}
            inactive={!user.active}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-sm font-black text-lime">
                {getInitials(user.name)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black uppercase">{user.name}</h2>
                <p className="mt-1 truncate text-[9px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="min-w-0">
              <AdminDataLabel>Unidade</AdminDataLabel>
              <p className="mt-1 truncate text-xs font-bold xl:mt-0">
                {franchise?.tradeName ?? "Unidade não vinculada"}
              </p>
              <p className="mt-1 flex items-center gap-1 truncate text-[9px] text-muted-foreground">
                <MapPinned className="h-3 w-3 shrink-0" />
                {location}
              </p>
            </div>
            <div>
              <AdminDataLabel>Pedidos</AdminDataLabel>
              <p className="mt-1 text-xs font-bold xl:mt-0">{user._count.orders}</p>
            </div>
            <div>
              <AdminDataLabel>Cadastro</AdminDataLabel>
              <p className="mt-1 text-xs font-bold xl:mt-0">{formatDate(user.createdAt)}</p>
            </div>
            <StatusPill active={user.active} activeText="Ativo" inactiveText="Pendente" />
            <div className="xl:justify-self-end">
              <AdminManageModal
                id={`view-franchisee-${user.id}`}
                title="Editar franqueado"
                description="Atualize os dados do usuário e da unidade vinculada."
                ariaLabel={`Ver dados de ${user.name}`}
                size="md"
              >
                <FranchiseeEditForm user={user} modalId={`view-franchisee-${user.id}`} />
                <PasswordResetPanel userId={user.id} mustChangePassword={user.mustChangePassword} />
                <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
                  <AdminInlineActionForm
                    action={toggleFranchiseeUserAction}
                    label={user.active ? "DESATIVAR" : "APROVAR"}
                    successMessage={user.active ? "Franqueado desativado." : "Franqueado aprovado."}
                  >
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="active" value={String(user.active)} />
                  </AdminInlineActionForm>
                  {!user.active && (
                    <DeleteActionDialog
                      action={rejectFranchiseeUserAction}
                      fields={{ id: user.id }}
                      title="Reprovar cadastro?"
                      description="O usuário franqueado pendente será recusado. Se ele ainda não tiver pedidos ou outros acessos vinculados, o cadastro e a unidade criada na solicitação serão removidos."
                      label="Reprovar"
                      successMessage="Cadastro reprovado."
                    />
                  )}
                  <DeleteActionDialog
                    action={deleteUserAction}
                    fields={{ id: user.id }}
                    title={hasOrderHistory ? "Arquivar usuário?" : "Excluir usuário?"}
                    description={
                      hasOrderHistory
                        ? "Este usuário ou a unidade possui pedidos. O acesso e a unidade serão desativados para preservar o histórico."
                        : "O usuário, a unidade vinculada e o endereço serão excluídos definitivamente."
                    }
                    label={hasOrderHistory ? "Arquivar" : "Excluir"}
                    successMessage={hasOrderHistory ? "Usuário arquivado." : "Usuário excluído."}
                  />
                </div>
              </AdminManageModal>
            </div>
          </AdminDataRow>
        )
      })}
    </AdminDataList>
  )
}

function CommonUsersList({
  users,
}: {
  users: {
    id: string
    name: string
    email: string
    active: boolean
    mustChangePassword: boolean
    createdAt: Date
    businessProfile: {
      legalName: string
      tradeName: string
      document: string
      email: string
      phone: string | null
      city: string
      state: string
    } | null
    _count: { orders: number }
  }[]
}) {
  return (
    <AdminDataList
      headers={["Cliente", "E-mail", "Pedidos", "Cadastro", "Status", "Ações"]}
      template="minmax(200px,1.35fr) minmax(220px,1.25fr) 90px 120px 100px 72px"
      isEmpty={users.length === 0}
      emptyTitle="Nenhum cliente comum cadastrado"
      emptyDescription="Quando clientes não franqueados criarem conta, eles aparecerão nesta lista."
    >
      {users.map((user) => {
        const hasOrderHistory = user._count.orders > 0

        return (
          <AdminDataRow
            key={user.id}
            template="minmax(200px,1.35fr) minmax(220px,1.25fr) 90px 120px 100px 72px"
            search={`${user.name} ${user.email} ${user.businessProfile?.tradeName ?? ""} ${user.businessProfile?.legalName ?? ""} ${user.businessProfile?.document ?? ""}`}
            inactive={!user.active}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-sm font-black text-lime">
                {getInitials(user.name)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black uppercase">{user.name}</h2>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  {user.businessProfile?.tradeName ?? "Cliente comum"}
                </p>
              </div>
            </div>
            <div className="min-w-0">
              <AdminDataLabel>E-mail</AdminDataLabel>
              <p className="mt-1 flex items-center gap-2 truncate text-xs font-bold xl:mt-0">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {user.businessProfile?.email ?? user.email}
              </p>
              <p className="mt-1 truncate text-[9px] text-muted-foreground">
                {user.businessProfile?.document ? formatDocument(user.businessProfile.document) : user.email}
              </p>
            </div>
            <div>
              <AdminDataLabel>Pedidos</AdminDataLabel>
              <p className="mt-1 text-xs font-bold xl:mt-0">{user._count.orders}</p>
            </div>
            <div>
              <AdminDataLabel>Cadastro</AdminDataLabel>
              <p className="mt-1 text-xs font-bold xl:mt-0">{formatDate(user.createdAt)}</p>
            </div>
            <StatusPill active={user.active} activeText="Ativo" inactiveText="Inativo" />
            <div className="xl:justify-self-end">
              <AdminManageModal
                id={`edit-common-user-${user.id}`}
                title="Editar cliente"
                description="Atualize os dados do cliente comum."
                ariaLabel={`Editar cliente ${user.name}`}
                size="sm"
              >
                <CommonUserEditForm user={user} modalId={`edit-common-user-${user.id}`} />
                <PasswordResetPanel userId={user.id} mustChangePassword={user.mustChangePassword} />
                <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
                  <AdminInlineActionForm
                    action={toggleCommonUserAction}
                    label={user.active ? "DESATIVAR" : "ATIVAR"}
                    successMessage={user.active ? "Cliente desativado." : "Cliente ativado."}
                  >
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="active" value={String(user.active)} />
                  </AdminInlineActionForm>
                  <DeleteActionDialog
                    action={deleteUserAction}
                    fields={{ id: user.id }}
                    title={hasOrderHistory ? "Arquivar usuário?" : "Excluir usuário?"}
                    description={
                      hasOrderHistory
                        ? "Este usuário possui pedidos. O acesso será desativado para preservar o histórico."
                        : "O usuário e seus dados comerciais serão excluídos definitivamente."
                    }
                    label={hasOrderHistory ? "Arquivar" : "Excluir"}
                    successMessage={hasOrderHistory ? "Usuário arquivado." : "Usuário excluído."}
                  />
                </div>
              </AdminManageModal>
            </div>
          </AdminDataRow>
        )
      })}
    </AdminDataList>
  )
}

function FranchiseeEditForm({ user, modalId }: { user: FranchiseeUser; modalId: string }) {
  const franchise = user.franchise
  const address = franchise?.addresses[0]

  return (
    <AdminActionForm
      action={updateFranchiseeUserAction}
      submitLabel="SALVAR ALTERAÇÕES"
      successMessage="Franqueado atualizado."
      modalId={modalId}
      className="space-y-5"
    >
      <input type="hidden" name="id" value={user.id} />
      <div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.14em] text-lime">Dados do usuário</p>
        <AdminFieldGrid columns="equal">
          <AdminInput name="name" label="Nome" defaultValue={user.name} required />
          <AdminInput name="email" label="E-mail" mask="email" defaultValue={user.email} required />
        </AdminFieldGrid>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.14em] text-lime">Dados da unidade</p>
        <AdminInput name="tradeName" label="Nome da unidade" defaultValue={franchise?.tradeName ?? ""} required />
        <AdminFieldGrid className="mt-5" columns="equal">
          <AdminInput name="document" label="CNPJ" mask="cnpj" defaultValue={franchise?.document ?? ""} />
          <AdminInput name="whatsapp" label="WhatsApp" mask="phone" defaultValue={franchise?.whatsapp ?? ""} />
        </AdminFieldGrid>
        <AdminLocationFields defaultState={address?.state ?? ""} defaultCity={address?.city ?? ""} />
      </div>
      <div className="grid gap-3 rounded-xl border border-border bg-graphite p-4 sm:grid-cols-2">
        <DetailRow label="Pedidos do usuário" value={String(user._count.orders)} />
        <DetailRow label="Pedidos da unidade" value={String(franchise?._count.orders ?? 0)} />
        <DetailRow label="Cadastro" value={formatLongDate(user.createdAt)} />
        <DetailRow label="Status" value={user.active ? "Ativo" : "Pendente de aprovação"} />
      </div>
    </AdminActionForm>
  )
}

function CommonUserEditForm({
  user,
  modalId,
}: {
  user: {
    id: string
    name: string
    email: string
    active: boolean
    mustChangePassword: boolean
    createdAt: Date
    businessProfile: {
      legalName: string
      tradeName: string
      document: string
      email: string
      phone: string | null
      city: string
      state: string
    } | null
    _count: { orders: number }
  }
  modalId: string
}) {
  const businessProfile = user.businessProfile
  return (
    <AdminActionForm
      action={updateCommonUserAction}
      submitLabel="SALVAR ALTERAÇÕES"
      successMessage="Cliente atualizado."
      modalId={modalId}
      className="space-y-5"
    >
      <input type="hidden" name="id" value={user.id} />
      <AdminFieldGrid columns="equal">
        <AdminInput name="name" label="Nome" defaultValue={user.name} required />
        <AdminInput name="email" label="E-mail" mask="email" defaultValue={user.email} required />
      </AdminFieldGrid>
      <div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.14em] text-lime">Dados comerciais</p>
        <AdminFieldGrid columns="equal">
          <AdminInput name="legalName" label="Razão social" defaultValue={businessProfile?.legalName ?? ""} required />
          <AdminInput name="tradeName" label="Nome fantasia" defaultValue={businessProfile?.tradeName ?? ""} required />
        </AdminFieldGrid>
        <AdminFieldGrid className="mt-5" columns="equal">
          <AdminInput
            name="document"
            label="CNPJ"
            mask="cnpj"
            defaultValue={businessProfile?.document ?? ""}
            required
          />
          <AdminInput
            name="businessEmail"
            label="E-mail comercial"
            mask="email"
            defaultValue={businessProfile?.email ?? ""}
            required
          />
        </AdminFieldGrid>
        <AdminFieldGrid className="mt-5" columns="equal">
          <AdminInput
            name="phone"
            label="WhatsApp comercial"
            mask="phone"
            defaultValue={businessProfile?.phone ?? ""}
          />
        </AdminFieldGrid>
        <AdminLocationFields defaultState={businessProfile?.state ?? ""} defaultCity={businessProfile?.city ?? ""} />
      </div>
      <div className="grid gap-3 rounded-xl border border-border bg-graphite p-4 sm:grid-cols-2">
        <DetailRow label="Pedidos" value={String(user._count.orders)} />
        <DetailRow label="Cadastro" value={formatLongDate(user.createdAt)} />
        <DetailRow label="Status" value={user.active ? "Ativo" : "Inativo"} />
      </div>
    </AdminActionForm>
  )
}

function PasswordResetPanel({
  userId,
  mustChangePassword,
}: {
  userId: string
  mustChangePassword: boolean
}) {
  return (
    <section className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-200">Reset de senha</p>
          <p className="mt-2 text-xs leading-5 text-amber-100/80">
            Gere uma senha temporária para passar ao usuário. No próximo acesso, ele será obrigado a cadastrar uma nova
            senha.
          </p>
        </div>
        <span className="inline-flex min-h-7 shrink-0 items-center rounded-full border border-amber-300/25 px-3 text-[9px] font-black uppercase text-amber-100">
          {mustChangePassword ? "Troca pendente" : "Sem troca pendente"}
        </span>
      </div>
      <TemporaryPasswordResetForm userId={userId} />
    </section>
  )
}

function UserTypeCard({
  href,
  active,
  icon: Icon,
  title,
  description,
  detail,
}: {
  href: string
  active: boolean
  icon: typeof UsersRound
  title: string
  description: string
  detail: string
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 transition ${
        active
          ? "border-lime/35 bg-lime/[0.055] shadow-[0_0_32px_rgba(239,255,13,.08)]"
          : "border-border bg-graphite hover:border-lime/25 hover:bg-lime/[0.025]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            active
              ? "border-lime/25 bg-lime/10 text-lime"
              : "border-purple-medium/30 bg-purple-medium/10 text-purple-medium"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-lime" />
      </div>
      <h2 className="mt-5 text-lg font-black uppercase">{title}</h2>
      <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-lime">{detail}</p>
    </Link>
  )
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: number
  detail: string
  icon: typeof UsersRound
}) {
  return (
    <article className="rounded-2xl border border-border bg-graphite p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-lime/15 bg-lime/5 text-lime">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-black">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
    </article>
  )
}

function StatusPill({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean
  activeText: string
  inactiveText: string
}) {
  return (
    <div>
      <span
        className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase ${
          active ? "border-lime/25 bg-lime/10 text-lime" : "border-red-400/25 bg-red-500/10 text-red-300"
        }`}
      >
        {active ? activeText : inactiveText}
      </span>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-graphite px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

function getView(searchParams?: SearchParams) {
  const rawView = Array.isArray(searchParams?.tipo) ? searchParams?.tipo[0] : searchParams?.tipo
  return rawView === "clientes" ? "clientes" : "franqueados"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date)
}

function formatDocument(value: string) {
  const d = value.replace(/\D/g, "")
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : value
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
