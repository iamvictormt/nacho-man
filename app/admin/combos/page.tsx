import { Plus } from "lucide-react"
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
import { getCurrentPage, getPagination, type SearchParams } from "@/lib/pagination"

export default async function CombosPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const page = getCurrentPage(resolvedSearchParams)
  const totalCombos = await prisma.combo.count()
  const pagination = getPagination(page, totalCombos)
  const [products, combos] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.combo.findMany({
      include: { items: { include: { product: true } }, _count: { select: { orderItems: true } } },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ])
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Ofertas montadas</p>
          <h1 className="mt-3 text-4xl font-black uppercase">Combos</h1>
          <p className="mt-3 text-sm text-muted-foreground">Crie e organize ofertas para os franqueados.</p>
        </div>
        <AdminModal
          id="create-combo"
          title="Criar combo"
          size="lg"
          trigger={
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-[10px] font-black text-background md:w-auto">
              <Plus className="h-4 w-4" /> NOVO COMBO
            </button>
          }
        >
          <ComboForm
            action={createComboAction}
            products={products}
            submit="CRIAR COMBO"
            modalId="create-combo"
            successMessage="Combo criado com sucesso."
          />
        </AdminModal>
      </div>
      <div className="mt-8 flex justify-end">
        <AdminSearch containerId="combos-grid" placeholder="Buscar combo ou produto..." />
      </div>
      <div id="combos-grid" className="mt-6">
        <AdminDataList
          headers={["Combo", "Composição", "Preço", "Pedidos", "Status", "Ações"]}
          template="minmax(200px,1.3fr) minmax(210px,1.5fr) 110px 90px 90px 72px"
          isEmpty={combos.length === 0}
          emptyTitle="Nenhum combo criado"
          emptyDescription="Monte o primeiro combo para oferecer uma seleção pronta aos franqueados."
        >
          {combos.map((combo) => (
            <AdminDataRow
              key={combo.id}
              template="minmax(200px,1.3fr) minmax(210px,1.5fr) 110px 90px 90px 72px"
              search={`${combo.name} ${combo.items.map((item) => item.product.name).join(" ")}`}
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
                  {combo.items
                    .slice(0, 2)
                    .map((item) => `${item.quantity}x ${item.product.name}`)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-[9px] uppercase text-muted-foreground">{combo.items.length} produtos</p>
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
}: {
  action: (formData: FormData) => Promise<void>
  products: { id: string; name: string }[]
  submit: string
  modalId: string
  successMessage: string
  combo?: {
    id: string
    name: string
    priceInCents: number
    description: string | null
    items: { productId: string; quantity: number }[]
  }
}) {
  const quantities = Object.fromEntries(combo?.items.map((item) => [item.productId, item.quantity]) ?? [])
  return (
    <AdminActionForm
      action={action}
      submitLabel={submit}
      successMessage={successMessage}
      modalId={modalId}
      className="space-y-4 pt-2"
    >
      {combo && <input type="hidden" name="id" value={combo.id} />}
      <AdminFieldGrid columns="wide-first">
        <AdminInput name="name" label="Nome" defaultValue={combo?.name} required />
        <AdminInput
          name="price"
          label="Preço (R$)"
          mask="money"
          defaultValue={combo ? moneyInput(combo.priceInCents) : ""}
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
      <ComboProductSelector products={products} initialQuantities={quantities} />
    </AdminActionForm>
  )
}
function moneyInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}
