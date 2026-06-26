import { Package, PackagePlus, Plus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminModal } from "@/components/admin-modal"
import { AdminSearch } from "@/components/admin-search"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { AdminInlineActionForm } from "@/components/admin-inline-action-form"
import { AdminCheckbox, AdminFieldGrid, AdminInput, AdminSelect, AdminTextarea } from "@/components/admin-form-fields"
import { AdminProductCategoryField } from "@/components/admin-product-category-field"
import { AdminProductImageUpload } from "@/components/admin-product-image-upload"
import { createProductAction, deleteProductAction, toggleProductAction, updateProductAction } from "./actions"
import { AdminDataLabel, AdminDataList, AdminDataRow } from "@/components/admin-data-list"
import { AdminManageModal } from "@/components/admin-manage-modal"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, type SearchParams } from "@/lib/pagination"

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const page = getCurrentPage(resolvedSearchParams)
  const totalProducts = await prisma.product.count()
  const pagination = getPagination(page, totalProducts)
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, _count: { select: { orderItems: true, comboItems: true } } },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <PageTitle />
        <AdminModal
          id="create-product"
          title="Cadastrar produto"
          description="Preencha as informações exibidas aos franqueados."
          size="lg"
          trigger={
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-[10px] font-black text-background md:w-auto">
              <Plus className="h-4 w-4" /> NOVO PRODUTO
            </button>
          }
        >
          <ProductForm
            action={createProductAction}
            categories={categories}
            submitLabel="CADASTRAR PRODUTO"
            modalId="create-product"
            successMessage="Produto cadastrado com sucesso."
          />
        </AdminModal>
      </div>

      <div className="mt-8 flex justify-end">
        <AdminSearch containerId="products-grid" placeholder="Buscar produto ou categoria..." />
      </div>
      <div id="products-grid" className="mt-6">
        <AdminDataList
          headers={["Produto", "Embalagem", "Preço", "Uso", "Status", "Ações"]}
          template="minmax(220px,1.5fr) minmax(160px,1fr) 110px 110px 90px 72px"
          isEmpty={products.length === 0}
          emptyTitle="Nenhum produto cadastrado"
          emptyDescription="Cadastre o primeiro produto para disponibilizar itens no marketplace da rede."
        >
          {products.map((product) => {
            const used = product._count.orderItems > 0 || product._count.comboItems > 0
            return (
              <AdminDataRow
                key={product.id}
                template="minmax(220px,1.5fr) minmax(160px,1fr) 110px 110px 90px 72px"
                search={`${product.name} ${product.category.name} ${product.sku ?? ""}`}
                inactive={!product.active}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-lime/20 bg-lime/10">
                      {product.image ? (
                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-lime" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-purple-medium">{product.category.name}</p>
                      <h2 className="mt-1 truncate text-sm font-black uppercase">{product.name}</h2>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">{product.sku || "Sem SKU"}</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <AdminDataLabel>Embalagem</AdminDataLabel>
                  <p className="mt-1 truncate text-xs font-bold xl:mt-0">{product.packageLabel}</p>
                  <p className="mt-1 text-[9px] uppercase text-muted-foreground">Mínimo {product.minimumQuantity}</p>
                </div>
                <div>
                  <AdminDataLabel>Preço</AdminDataLabel>
                  <p className="mt-1 text-base font-black text-lime xl:mt-0">
                    {formatMoneyFromCents(product.priceInCents)}
                  </p>
                </div>
                <div>
                  <AdminDataLabel>Uso</AdminDataLabel>
                  <p className="mt-1 text-xs font-bold xl:mt-0">{product._count.orderItems} pedidos</p>
                  <p className="mt-1 text-[9px] text-purple-medium">{product._count.comboItems} combos</p>
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase ${product.active ? "border-lime/25 bg-lime/10 text-lime" : "border-red-400/25 bg-red-500/10 text-red-300"}`}
                  >
                    {product.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <AdminManageModal
                  id={`manage-product-${product.id}`}
                  title="Gerenciar produto"
                  size="lg"
                  ariaLabel={`Gerenciar produto ${product.name}`}
                >
                  <ProductForm
                    action={updateProductAction}
                    categories={categories}
                    submitLabel="SALVAR ALTERAÇÕES"
                    product={product}
                    modalId={`manage-product-${product.id}`}
                    successMessage="Produto atualizado com sucesso."
                  />
                  <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 min-[420px]:flex-row">
                    <AdminInlineActionForm
                      action={toggleProductAction}
                      label={product.active ? "DESATIVAR" : "ATIVAR"}
                      successMessage={product.active ? "Produto desativado." : "Produto ativado."}
                    >
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="active" value={String(product.active)} />
                    </AdminInlineActionForm>
                    <DeleteActionDialog
                      action={deleteProductAction}
                      fields={{ id: product.id }}
                      title={used ? "Arquivar produto?" : "Excluir produto?"}
                      description={
                        used
                          ? "Este produto possui vínculos e será desativado."
                          : "Esta ação excluirá o produto definitivamente."
                      }
                      label={used ? "Arquivar" : "Excluir"}
                      successMessage={used ? "Produto arquivado." : "Produto excluído."}
                    />
                  </div>
                </AdminManageModal>
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

function ProductForm({
  action,
  submitLabel,
  product,
  categories,
  modalId,
  successMessage,
}: {
  action: (formData: FormData) => Promise<void>
  categories: { id: string; name: string }[]
  submitLabel: string
  modalId: string
  successMessage: string
  product?: {
    id: string
    name: string
    description: string | null
    image: string | null
    sku: string | null
    priceInCents: number
    unit: string
    packageLabel: string
    minimumQuantity: number
    featured: boolean
    category: { name: string }
  }
}) {
  return (
    <AdminActionForm
      action={action}
      submitLabel={submitLabel}
      successMessage={successMessage}
      modalId={modalId}
      className="space-y-4 pt-2"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="flex items-center gap-3">
        <PackagePlus className="h-5 w-5 text-lime" />
        <h2 className="font-black uppercase">{product ? "Dados do produto" : "Novo produto"}</h2>
      </div>
      <AdminInput name="name" label="Nome" defaultValue={product?.name} required />
      <AdminFieldGrid columns="wide-first">
        <AdminProductCategoryField categories={categories} defaultValue={product?.category.name ?? ""} />
        <AdminInput name="sku" label="SKU" defaultValue={product?.sku ?? ""} />
      </AdminFieldGrid>
      <AdminTextarea
        name="description"
        label="Descrição"
        rows={3}
        defaultValue={product?.description ?? ""}
        placeholder="Descreva o produto para os franqueados"
      />
      <AdminFieldGrid columns="equal">
        <AdminInput
          name="price"
          label="Preço (R$)"
          mask="money"
          defaultValue={product ? moneyInput(product.priceInCents) : ""}
          required
        />
        <AdminSelect name="unit" label="Unidade" defaultValue={product?.unit ?? "KG"}>
          <option value="KG">KG</option>
          <option value="UND">UND</option>
          <option value="CX">CAIXA</option>
        </AdminSelect>
      </AdminFieldGrid>
      <AdminFieldGrid columns="wide-first">
        <AdminInput name="packageLabel" label="Embalagem" defaultValue={product?.packageLabel} required />
        <AdminInput
          name="minimumQuantity"
          label="Qtd. mínima"
          mask="integer"
          defaultValue={product?.minimumQuantity ?? 1}
          required
        />
      </AdminFieldGrid>
      <AdminProductImageUpload defaultValue={product?.image ?? ""} />
      <AdminCheckbox
        name="featured"
        label="Destacar no marketplace"
        description="Exibe o produto com prioridade no catálogo."
        defaultChecked={product?.featured}
      />
    </AdminActionForm>
  )
}
function PageTitle() {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Catálogo</p>
      <h1 className="mt-3 text-4xl font-black uppercase">Produtos</h1>
      <p className="mt-3 text-sm text-muted-foreground">Gerencie os itens disponíveis no Marketplace da rede.</p>
    </div>
  )
}
function moneyInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}
