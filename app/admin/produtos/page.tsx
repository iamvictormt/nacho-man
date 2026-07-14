import { Package, PackagePlus } from "lucide-react"
import Link from "next/link"
import type { Prisma } from "@prisma/client"
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
import { getCurrentPage, getPagination, getSearchQuery, type SearchParams } from "@/lib/pagination"

const PRODUCT_AUDIENCES = {
  FRANCHISEE: {
    label: "Franqueados",
    description: "Produtos exibidos no marketplace interno.",
    emptyDescription: "Cadastre o primeiro produto para disponibilizar itens no marketplace da rede.",
  },
  PUBLIC: {
    label: "Não franqueados",
    description: "Produtos exibidos no catálogo público do site.",
    emptyDescription: "Cadastre o primeiro produto para exibir no catálogo público do site.",
  },
} as const

type ProductAudienceValue = keyof typeof PRODUCT_AUDIENCES

function getProductAudience(searchParams?: SearchParams): ProductAudienceValue {
  const rawAudience = Array.isArray(searchParams?.audience) ? searchParams?.audience[0] : searchParams?.audience
  return rawAudience === "PUBLIC" ? "PUBLIC" : "FRANCHISEE"
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const audience = getProductAudience(resolvedSearchParams)
  const query = getSearchQuery(resolvedSearchParams)
  const categorySlug = getSearchQuery(resolvedSearchParams, "categoria")
  const page = getCurrentPage(resolvedSearchParams)
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
  const filterCategories = await prisma.category.findMany({
    where: { products: { some: { audience } } },
    include: {
      _count: {
        select: {
          products: { where: { audience } },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  const sortedFilterCategories = [...filterCategories].sort((first, second) => {
    const countComparison = second._count.products - first._count.products
    if (countComparison !== 0) return countComparison
    return first.name.localeCompare(second.name, "pt-BR")
  })
  const selectedCategory = filterCategories.find((category) => category.slug === categorySlug)
  const productWhere: Prisma.ProductWhereInput = {
    audience,
    ...(selectedCategory ? { category: { slug: selectedCategory.slug } } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { packageLabel: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  }
  const [totalProducts, franchiseeCount, publicCount] = await Promise.all([
    prisma.product.count({ where: productWhere }),
    prisma.product.count({ where: { audience: "FRANCHISEE" } }),
    prisma.product.count({ where: { audience: "PUBLIC" } }),
  ])
  const pagination = getPagination(page, totalProducts)
  const products = await prisma.product.findMany({
    where: productWhere,
    include: { category: true, _count: { select: { orderItems: true, comboItems: true } } },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
  })

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <PageTitle audience={audience} />
        <AdminModal
          id="create-product"
          title="Cadastrar produto"
          description={`Preencha as informações exibidas em ${PRODUCT_AUDIENCES[audience].label.toLowerCase()}.`}
          size="lg"
          triggerLabel="NOVO PRODUTO"
          triggerClassName="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-[10px] font-black text-background md:w-auto"
        >
          <ProductForm
            action={createProductAction}
            categories={categories}
            submitLabel="CADASTRAR PRODUTO"
            modalId="create-product"
            successMessage="Produto cadastrado com sucesso."
            defaultAudience={audience}
          />
        </AdminModal>
      </div>

      <ProductAudienceTabs currentAudience={audience} franchiseeCount={franchiseeCount} publicCount={publicCount} />

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CategoryFilterChips
          audience={audience}
          searchParams={resolvedSearchParams}
          categories={sortedFilterCategories}
          selectedCategoryId={selectedCategory?.id ?? null}
        />
        <AdminSearch containerId="products-grid" placeholder="Buscar produto ou categoria..." queryParam="q" />
      </div>
      <div id="products-grid" className="mt-6">
        <AdminDataList
          headers={["Produto", "Embalagem", "Preço", "Uso", "Catálogo", "Status", "Ações"]}
          template="minmax(220px,1.5fr) minmax(160px,1fr) 110px 100px 120px 90px 72px"
          isEmpty={products.length === 0}
          emptyTitle={`Nenhum produto para ${PRODUCT_AUDIENCES[audience].label.toLowerCase()}`}
          emptyDescription={PRODUCT_AUDIENCES[audience].emptyDescription}
        >
          {products.map((product) => {
            const used = product._count.orderItems > 0 || product._count.comboItems > 0
            return (
              <AdminDataRow
                key={product.id}
                template="minmax(220px,1.5fr) minmax(160px,1fr) 110px 100px 120px 90px 72px"
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
                  <AdminDataLabel>Catálogo</AdminDataLabel>
                  <p className="mt-1 text-xs font-black uppercase xl:mt-0">
                    {PRODUCT_AUDIENCES[product.audience].label}
                  </p>
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
                    defaultAudience={audience}
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
  defaultAudience,
}: {
  action: (formData: FormData) => Promise<void>
  categories: { id: string; name: string; _count: { products: number } }[]
  submitLabel: string
  modalId: string
  successMessage: string
  defaultAudience: ProductAudienceValue
  product?: {
    id: string
    name: string
    description: string | null
    features: string | null
    applications: string | null
    storageInfo: string | null
    usageInfo: string | null
    yieldInfo: string | null
    image: string | null
    sku: string | null
    priceInCents: number
    unit: string
    audience: ProductAudienceValue
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
      <AdminSelect name="audience" label="Catálogo" defaultValue={product?.audience ?? defaultAudience}>
        <option value="FRANCHISEE">Franqueados</option>
        <option value="PUBLIC">Não franqueados</option>
      </AdminSelect>
      <AdminTextarea
        name="description"
        label="Descrição"
        rows={3}
        defaultValue={product?.description ?? ""}
        placeholder="Descreva o produto para o catálogo selecionado"
      />
      <AdminTextarea
        name="features"
        label="Características"
        rows={3}
        defaultValue={product?.features ?? ""}
        placeholder="Uma característica por linha. Ex: PCT, pronto para uso, rende 900 g"
      />
      <AdminTextarea
        name="applications"
        label="Aplicações"
        rows={3}
        defaultValue={product?.applications ?? ""}
        placeholder="Uma aplicação por linha. Ex: Churros, sobremesas, finalização"
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
      <AdminFieldGrid columns="equal">
        <AdminTextarea
          name="storageInfo"
          label="Armazenamento"
          rows={3}
          defaultValue={product?.storageInfo ?? ""}
          placeholder="Ex: Guarde em local seco, fresco e protegido da luz."
        />
        <AdminTextarea
          name="usageInfo"
          label="Uso ou preparo"
          rows={3}
          defaultValue={product?.usageInfo ?? ""}
          placeholder="Ex: Produto pronto para aplicação na operação."
        />
      </AdminFieldGrid>
      <AdminTextarea
        name="yieldInfo"
        label="Rendimento ou benefício"
        rows={3}
        defaultValue={product?.yieldInfo ?? ""}
        placeholder="Ex: Ideal para reposição rápida e uso recorrente."
      />
      <AdminProductImageUpload defaultValue={product?.image ?? ""} />
      <AdminCheckbox
        name="featured"
        label="Destacar no catálogo"
        description="Exibe o produto com prioridade no catálogo selecionado."
        defaultChecked={product?.featured}
      />
    </AdminActionForm>
  )
}
function ProductAudienceTabs({
  currentAudience,
  franchiseeCount,
  publicCount,
}: {
  currentAudience: ProductAudienceValue
  franchiseeCount: number
  publicCount: number
}) {
  const tabs = [
    { value: "FRANCHISEE" as const, count: franchiseeCount },
    { value: "PUBLIC" as const, count: publicCount },
  ]

  return (
    <nav className="mt-8 flex flex-wrap gap-2" aria-label="Catálogo de produtos">
      {tabs.map((tab) => {
        const active = tab.value === currentAudience
        return (
          <Link
            key={tab.value}
            href={`/admin/produtos?audience=${tab.value}`}
            className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-5 text-[10px] font-black uppercase tracking-wider transition ${
              active
                ? "border-lime bg-lime text-background"
                : "border-border bg-graphite text-muted-foreground hover:border-lime/40 hover:text-lime"
            }`}
          >
            {PRODUCT_AUDIENCES[tab.value].label}
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

function CategoryFilterChips({
  audience,
  searchParams,
  categories,
  selectedCategoryId,
}: {
  audience: ProductAudienceValue
  searchParams?: SearchParams
  categories: Array<{ id: string; name: string; slug: string; _count: { products: number } }>
  selectedCategoryId: string | null
}) {
  const total = categories.reduce((sum, category) => sum + category._count.products, 0)

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filtrar produtos por categoria">
      <ProductCategoryFilterLink
        active={!selectedCategoryId}
        href={adminProductCategoryHref(searchParams, audience, null)}
        label="Todas"
        count={total}
      />
      {categories.map((category) => (
        <ProductCategoryFilterLink
          key={category.id}
          active={selectedCategoryId === category.id}
          href={adminProductCategoryHref(searchParams, audience, category.slug)}
          label={category.name}
          count={category._count.products}
        />
      ))}
    </nav>
  )
}

function adminProductCategoryHref(
  searchParams: SearchParams | undefined,
  audience: ProductAudienceValue,
  categorySlug: string | null
) {
  const params = new URLSearchParams()
  params.set("audience", audience)

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "page" || key === "audience" || key === "categoria" || value === undefined) continue
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
    else params.set(key, value)
  }

  if (categorySlug) params.set("categoria", categorySlug)

  return `/admin/produtos?${params.toString()}`
}

function ProductCategoryFilterLink({
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

function PageTitle({ audience }: { audience: ProductAudienceValue }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Catálogo</p>
      <h1 className="mt-3 text-4xl font-black uppercase">Produtos</h1>
      <p className="mt-3 text-sm text-muted-foreground">{PRODUCT_AUDIENCES[audience].description}</p>
    </div>
  )
}
function moneyInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}
