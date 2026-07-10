import type { Prisma } from "@prisma/client"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { ComboProductSelector } from "@/components/combo-product-selector"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminModal } from "@/components/admin-modal"
import { AdminSearch } from "@/components/admin-search"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { AdminInlineActionForm } from "@/components/admin-inline-action-form"
import { AdminFieldGrid, AdminInput, AdminTextarea } from "@/components/admin-form-fields"
import { createComboAction, deleteComboAction, toggleComboAction, updateComboAction } from "./actions"
import { AdminDataLabel, AdminDataList, AdminDataRow } from "@/components/admin-data-list"
import { AdminManageModal } from "@/components/admin-manage-modal"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, getSearchQuery, type SearchParams } from "@/lib/pagination"

const COMBO_AUDIENCES = {
  FRANCHISEE: {
    label: "Franqueados",
    description: "Combos exibidos no marketplace interno.",
    emptyDescription: "Monte o primeiro combo para oferecer uma seleção pronta aos franqueados.",
  },
  PUBLIC: {
    label: "Não franqueados",
    description: "Combos exibidos para clientes não franqueados no marketplace.",
    emptyDescription: "Monte o primeiro combo para disponibilizar aos clientes não franqueados.",
  },
} as const

type ComboAudienceValue = keyof typeof COMBO_AUDIENCES

function getComboAudience(searchParams?: SearchParams): ComboAudienceValue {
  const rawAudience = Array.isArray(searchParams?.audience) ? searchParams?.audience[0] : searchParams?.audience
  return rawAudience === "PUBLIC" ? "PUBLIC" : "FRANCHISEE"
}

export default async function CombosPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const page = getCurrentPage(resolvedSearchParams)
  const query = getSearchQuery(resolvedSearchParams)
  const audience = getComboAudience(resolvedSearchParams)
  const comboWhere: Prisma.ComboWhereInput = {
    audience,
    ...(query
      ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { options: { some: { product: { name: { contains: query, mode: "insensitive" } } } } },
        ],
      }
      : {}),
  }
  const totalCombos = await prisma.combo.count({ where: comboWhere })
  const pagination = getPagination(page, totalCombos)
  const [products, combos, franchiseeCount, publicCount] = await Promise.all([
    prisma.product.findMany({
      where: { audience: { in: ["FRANCHISEE", "PUBLIC"] }, active: true },
      select: { id: true, name: true, audience: true },
      orderBy: [{ audience: "asc" }, { name: "asc" }],
    }),
    prisma.combo.findMany({
      where: comboWhere,
      include: { options: { include: { product: true } }, _count: { select: { orderItems: true } } },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.combo.count({ where: { audience: "FRANCHISEE" } }),
    prisma.combo.count({ where: { audience: "PUBLIC" } }),
  ])
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Ofertas montadas</p>
          <h1 className="mt-3 text-4xl font-black uppercase">Combos</h1>
          <p className="mt-3 text-sm text-muted-foreground">{COMBO_AUDIENCES[audience].description}</p>
        </div>
        <AdminModal
          id="create-combo"
          title="Criar combo"
          description={`Preencha as informações exibidas em ${COMBO_AUDIENCES[audience].label.toLowerCase()}.`}
          size="lg"
          triggerLabel="NOVO COMBO"
          triggerClassName="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-[10px] font-black text-background md:w-auto"
        >
          <ComboForm
            action={createComboAction}
            products={products}
            submit="CRIAR COMBO"
            modalId="create-combo"
            successMessage="Combo criado com sucesso."
            defaultAudience={audience}
          />
        </AdminModal>
      </div>
      <ComboAudienceTabs currentAudience={audience} franchiseeCount={franchiseeCount} publicCount={publicCount} />
      <div className="mt-8 flex justify-end">
        <AdminSearch containerId="combos-grid" placeholder="Buscar combo ou produto..." queryParam="q" />
      </div>
      <div id="combos-grid" className="mt-6">
        <AdminDataList
          headers={["Combo", "Composição", "Preço", "Pedidos", "Catálogo", "Status", "Ações"]}
          template="minmax(200px,1.3fr) minmax(210px,1.5fr) 110px 90px 120px 90px 72px"
          isEmpty={combos.length === 0}
          emptyTitle={`Nenhum combo para ${COMBO_AUDIENCES[audience].label.toLowerCase()}`}
          emptyDescription={COMBO_AUDIENCES[audience].emptyDescription}
        >
          {combos.map((combo) => (
            <AdminDataRow
              key={combo.id}
              template="minmax(200px,1.3fr) minmax(210px,1.5fr) 110px 90px 120px 90px 72px"
              search={`${combo.name} ${combo.options.map((option) => option.product.name).join(" ")}`}
              inactive={!combo.active}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-purple-medium">Combo comercial</p>
                  <h2 className="mt-1 truncate text-sm font-black uppercase">{combo.name}</h2>
                </div>
              </div>
              <div className="min-w-0">
                <AdminDataLabel>Composição</AdminDataLabel>
                <p className="mt-1 truncate text-xs font-bold xl:mt-0">
                  {combo.options
                    .slice(0, 2)
                    .map((option) => option.product.name)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-[9px] uppercase text-muted-foreground">
                  {combo.totalUnits} unidades · {combo.options.length} opções
                </p>
              </div>
              <div>
                <AdminDataLabel>Preço</AdminDataLabel>
                <p className="mt-1 text-base font-black text-lime xl:mt-0">
                  {formatMoneyFromCents(combo.priceInCents)}
                </p>
              </div>
              <div>
                <AdminDataLabel>Pedidos</AdminDataLabel>
                <p className="mt-1 text-xs font-bold xl:mt-0">{combo._count.orderItems}</p>
              </div>
              <div>
                <AdminDataLabel>Catálogo</AdminDataLabel>
                <p className="mt-1 text-xs font-black uppercase xl:mt-0">
                  {COMBO_AUDIENCES[combo.audience].label}
                </p>
              </div>
              <div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase ${combo.active ? "border-lime/25 bg-lime/10 text-lime" : "border-red-400/25 bg-red-500/10 text-red-300"}`}
                >
                  {combo.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <AdminManageModal
                id={`manage-combo-${combo.id}`}
                title="Gerenciar combo"
                size="lg"
                ariaLabel={`Gerenciar combo ${combo.name}`}
              >
                <ComboForm
                  action={updateComboAction}
                  products={products}
                  submit="SALVAR ALTERAÇÕES"
                  combo={combo}
                  modalId={`manage-combo-${combo.id}`}
                  successMessage="Combo atualizado com sucesso."
                  defaultAudience={audience}
                />
                <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 min-[420px]:flex-row">
                  <AdminInlineActionForm
                    action={toggleComboAction}
                    label={combo.active ? "DESATIVAR" : "ATIVAR"}
                    successMessage={combo.active ? "Combo desativado." : "Combo ativado."}
                  >
                    <input type="hidden" name="id" value={combo.id} />
                    <input type="hidden" name="active" value={String(combo.active)} />
                  </AdminInlineActionForm>
                  <DeleteActionDialog
                    action={deleteComboAction}
                    fields={{ id: combo.id }}
                    title={combo._count.orderItems ? "Arquivar combo?" : "Excluir combo?"}
                    description={
                      combo._count.orderItems
                        ? "O combo já foi utilizado e será desativado."
                        : "Esta ação excluirá o combo definitivamente."
                    }
                    label={combo._count.orderItems ? "Arquivar" : "Excluir"}
                    successMessage={combo._count.orderItems ? "Combo arquivado." : "Combo excluído."}
                  />
                </div>
              </AdminManageModal>
            </AdminDataRow>
          ))}
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

function ComboForm({
  action,
  products,
  submit,
  combo,
  modalId,
  successMessage,
  defaultAudience,
}: {
  action: (formData: FormData) => Promise<void>
  products: { id: string; name: string; audience: ComboAudienceValue }[]
  submit: string
  modalId: string
  successMessage: string
  defaultAudience: ComboAudienceValue
  combo?: {
    id: string
    name: string
    priceInCents: number
    audience: ComboAudienceValue
    totalUnits: number
    description: string | null
    options: { productId: string }[]
  }
}) {
  const quantities = Object.fromEntries(combo?.options.map((option) => [option.productId, 1]) ?? [])
  return (
    <AdminActionForm
      action={action}
      submitLabel={submit}
      successMessage={successMessage}
      modalId={modalId}
      className="space-y-4 pt-2"
    >
      {combo && <input type="hidden" name="id" value={combo.id} />}
      <AdminFieldGrid columns="three">
        <AdminInput name="name" label="Nome" defaultValue={combo?.name} required />
        <AdminInput
          name="price"
          label="Preço (R$)"
          mask="money"
          defaultValue={combo ? moneyInput(combo.priceInCents) : ""}
          required
        />
        <AdminInput
          name="totalUnits"
          label="Unidades do combo"
          mask="integer"
          min={1}
          defaultValue={combo ? String(combo.totalUnits) : ""}
          placeholder="Ex: 6"
          required
        />
      </AdminFieldGrid>
      <AdminTextarea
        name="description"
        label="Descrição"
        rows={3}
        defaultValue={combo?.description ?? ""}
        placeholder="Descreva a composição e a condição do combo"
      />
      <ComboProductSelector
        products={products}
        initialQuantities={quantities}
        initialAudience={combo?.audience ?? defaultAudience}
      />
    </AdminActionForm>
  )
}
function moneyInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}

function ComboAudienceTabs({
  currentAudience,
  franchiseeCount,
  publicCount,
}: {
  currentAudience: ComboAudienceValue
  franchiseeCount: number
  publicCount: number
}) {
  const tabs = [
    { value: "FRANCHISEE" as const, count: franchiseeCount },
    { value: "PUBLIC" as const, count: publicCount },
  ]

  return (
    <nav className="mt-8 flex flex-wrap gap-2" aria-label="Catálogo de combos">
      {tabs.map((tab) => {
        const active = tab.value === currentAudience
        return (
          <Link
            key={tab.value}
            href={`/admin/combos?audience=${tab.value}`}
            className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-5 text-[10px] font-black uppercase tracking-wider transition ${
              active
                ? "border-lime bg-lime text-background"
                : "border-border bg-graphite text-muted-foreground hover:border-lime/40 hover:text-lime"
            }`}
          >
            {COMBO_AUDIENCES[tab.value].label}
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] ${
                active ? "bg-background/15 text-background" : "bg-background text-foreground"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
