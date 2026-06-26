import { MapPinned, Plus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminModal } from "@/components/admin-modal"
import { AdminSearch } from "@/components/admin-search"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { AdminInlineActionForm } from "@/components/admin-inline-action-form"
import { AdminFieldGrid, AdminInput } from "@/components/admin-form-fields"
import { AdminLocationFields } from "@/components/admin-location-fields"
import { createFranchiseAction, deleteFranchiseAction, toggleFranchiseAction, updateFranchiseAction } from "./actions"
import { AdminDataLabel, AdminDataList, AdminDataRow } from "@/components/admin-data-list"
import { AdminManageModal } from "@/components/admin-manage-modal"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, type SearchParams } from "@/lib/pagination"

export default async function FranchisesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const page = getCurrentPage(resolvedSearchParams)
  const [totalFranchises, activeCount] = await Promise.all([
    prisma.franchise.count(),
    prisma.franchise.count({ where: { active: true } }),
  ])
  const pagination = getPagination(page, totalFranchises)
  const franchises = await prisma.franchise.findMany({
    include: {
      users: { select: { id: true, name: true, email: true }, orderBy: { createdAt: "asc" } },
      addresses: { select: { id: true, city: true, state: true }, take: 1 },
      _count: { select: { orders: true, users: true } },
    },
    orderBy: [{ active: "desc" }, { tradeName: "asc" }],
    skip: pagination.skip,
    take: pagination.take,
  })
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Rede Nacho Man</p>
          <h1 className="mt-3 text-4xl font-black uppercase">Unidades franqueadas</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {totalFranchises} unidades · {activeCount} ativas
          </p>
        </div>
        <AdminModal
          id="create-franchise"
          title="Cadastrar unidade"
          description="Crie a unidade e o primeiro acesso ao marketplace."
          size="md"
          trigger={
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-[10px] font-black text-background md:w-auto">
              <Plus className="h-4 w-4" /> NOVA UNIDADE
            </button>
          }
        >
          <FranchiseForm
            action={createFranchiseAction}
            submit="CRIAR UNIDADE E ACESSO"
            modalId="create-franchise"
            successMessage="Unidade cadastrada com sucesso."
          />
        </AdminModal>
      </div>
      <div className="mt-8 flex justify-end">
        <AdminSearch containerId="franchises-grid" placeholder="Buscar unidade, responsável ou CNPJ..." />
      </div>
      <div id="franchises-grid" className="mt-6">
        <AdminDataList
          headers={["Unidade", "Responsável", "Contato", "Pedidos", "Status", "Ações"]}
          template="minmax(200px,1.3fr) minmax(160px,1fr) minmax(160px,1fr) 90px 90px 72px"
          isEmpty={franchises.length === 0}
          emptyTitle="Nenhuma unidade cadastrada"
          emptyDescription="Cadastre a primeira unidade para liberar acesso ao marketplace e aos pedidos."
        >
          {franchises.map((franchise, index) => {
            const user = franchise.users[0]
            const address = franchise.addresses[0]
            const location = address ? `${address.city} — ${address.state}` : "Não cadastrada"
            return (
              <AdminDataRow
                key={franchise.id}
                template="minmax(200px,1.3fr) minmax(160px,1fr) minmax(160px,1fr) 90px 90px 72px"
                search={`${franchise.tradeName} ${user?.name ?? ""} ${user?.email ?? ""} ${franchise.document ?? ""}`}
                inactive={!franchise.active}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${index % 2 ? "border-purple-medium/30 bg-purple-medium/10 text-purple-medium" : "border-lime/20 bg-lime/10 text-lime"}`}
                  >
                    {getInitials(franchise.tradeName)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="mt-1 truncate text-sm font-black uppercase">{franchise.tradeName}</h2>
                    <p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                      <MapPinned className="h-3 w-3" />
                      {location}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <AdminDataLabel>Responsável</AdminDataLabel>
                  <p className="mt-1 flex items-center gap-2 truncate text-xs font-bold xl:mt-0">
                    {user?.name ?? "Não informado"}
                  </p>
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">{user?.email ?? "Sem e-mail"}</p>
                </div>
                <div className="min-w-0">
                  <AdminDataLabel>Contato</AdminDataLabel>
                  <p className="mt-1 flex items-center gap-2 truncate text-xs font-bold xl:mt-0">
                    {formatPhone(franchise.whatsapp)}
                  </p>
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">{formatDocument(franchise.document)}</p>
                </div>
                <div>
                  <AdminDataLabel>Pedidos</AdminDataLabel>
                  <p className="mt-1 text-xs font-bold xl:mt-0">{franchise._count.orders}</p>
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase ${franchise.active ? "border-lime/25 bg-lime/10 text-lime" : "border-red-400/25 bg-red-500/10 text-red-300"}`}
                  >
                    {franchise.active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                {user ? (
                  <AdminManageModal
                    id={`manage-franchise-${franchise.id}`}
                    title="Gerenciar unidade"
                    size="md"
                    ariaLabel={`Gerenciar unidade ${franchise.tradeName}`}
                  >
                    <FranchiseForm
                      action={updateFranchiseAction}
                      submit="SALVAR ALTERAÇÕES"
                      modalId={`manage-franchise-${franchise.id}`}
                      successMessage="Unidade atualizada."
                      franchise={franchise}
                      user={user}
                    />
                    <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 min-[420px]:flex-row">
                      <AdminInlineActionForm
                        action={toggleFranchiseAction}
                        label={franchise.active ? "DESATIVAR" : "ATIVAR"}
                        successMessage={franchise.active ? "Unidade desativada." : "Unidade ativada."}
                      >
                        <input type="hidden" name="id" value={franchise.id} />
                        <input type="hidden" name="active" value={String(franchise.active)} />
                      </AdminInlineActionForm>
                      <DeleteActionDialog
                        action={deleteFranchiseAction}
                        fields={{ id: franchise.id }}
                        title={franchise._count.orders ? "Arquivar unidade?" : "Excluir unidade?"}
                        description={
                          franchise._count.orders
                            ? "A unidade possui pedidos e será desativada."
                            : "A unidade e seus acessos serão excluídos definitivamente."
                        }
                        label={franchise._count.orders ? "Arquivar" : "Excluir"}
                        successMessage={franchise._count.orders ? "Unidade arquivada." : "Unidade excluída."}
                      />
                    </div>
                  </AdminManageModal>
                ) : (
                  <span />
                )}
              </AdminDataRow>
            )
          })}
        </AdminDataList>
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

function FranchiseForm({
  action,
  submit,
  modalId,
  successMessage,
  franchise,
  user,
}: {
  action: (formData: FormData) => Promise<void>
  submit: string
  modalId: string
  successMessage: string
  franchise?: {
    id: string
    tradeName: string
    document: string | null
    whatsapp: string | null
    addresses: { id: string; city: string; state: string }[]
  }
  user?: { id: string; name: string; email: string }
}) {
  const address = franchise?.addresses[0]
  return (
    <AdminActionForm
      action={action}
      submitLabel={submit}
      successMessage={successMessage}
      modalId={modalId}
      className="pt-2"
    >
      {franchise && (
        <>
          <input type="hidden" name="id" value={franchise.id} />
          <input type="hidden" name="userId" value={user?.id} />
        </>
      )}
      {address && <input type="hidden" name="addressId" value={address.id} />}
      <AdminInput name="tradeName" label="Nome da unidade" defaultValue={franchise?.tradeName} required />
      <AdminFieldGrid columns="equal">
        <AdminInput name="document" label="CNPJ" mask="cnpj" defaultValue={franchise?.document ?? ""} />
        <AdminInput name="whatsapp" label="WhatsApp" mask="phone" defaultValue={franchise?.whatsapp ?? ""} />
      </AdminFieldGrid>
      <div className="border-t border-border pt-6">
        <p className="mb-5 text-[10px] font-black uppercase text-purple-medium">Endereço principal</p>
        <AdminLocationFields defaultCity={address?.city ?? ""} defaultState={address?.state ?? ""} />
      </div>
      <div className="border-t border-border pt-6">
        <p className="mb-5 text-[10px] font-black uppercase text-purple-medium">Acesso principal</p>
        <AdminFieldGrid columns="equal">
          <AdminInput name="userName" label="Responsável" defaultValue={user?.name} required />
          <AdminInput name="email" label="E-mail" mask="email" defaultValue={user?.email} required />
        </AdminFieldGrid>
        {!franchise && <AdminInput className="mt-6" name="password" label="Senha inicial" minLength={8} required />}
      </div>
    </AdminActionForm>
  )
}
function formatPhone(phone: string | null) {
  if (!phone) return "Não informado"
  const d = phone.replace(/\D/g, "").replace(/^55/, "")
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : phone
}
function formatDocument(value: string | null) {
  if (!value) return "Não informado"
  const d = value.replace(/\D/g, "")
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : value
}
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
