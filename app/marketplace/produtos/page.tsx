import { PackageSearch } from "lucide-react"
import Link from "next/link"
import { ProductAudience, type Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireMarketplaceUser } from "@/lib/auth"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"
import { AdminSearch } from "@/components/admin-search"
import { PrivatePageHeader } from "@/components/private-page-header"
import { ProductDetailCard } from "@/components/product-detail-card"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, getSearchQuery, type SearchParams } from "@/lib/pagination"

type MarketplaceProductListItem = Prisma.ProductGetPayload<{ include: { category: true } }>

export default async function MarketplaceProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const user = await requireMarketplaceUser()
  const page = getCurrentPage(resolvedSearchParams)
  const query = getSearchQuery(resolvedSearchParams)
  const categorySlug = getSearchQuery(resolvedSearchParams, "categoria")
  const audience = user.role === "FRANCHISEE" ? ProductAudience.FRANCHISEE : ProductAudience.PUBLIC
  const categories = await prisma.category.findMany({
    where: {
      active: true,
      products: { some: { audience, active: true } },
    },
    include: {
      _count: {
        select: {
          products: { where: { audience, active: true } },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  const filterCategories = [...categories].sort((first, second) => {
    const countComparison = second._count.products - first._count.products
    if (countComparison !== 0) return countComparison

    return first.name.localeCompare(second.name, "pt-BR")
  })
  const selectedCategory = categories.find((category) => category.slug === categorySlug)
  const where: Prisma.ProductWhereInput = {
    audience,
    active: true,
    category: { active: true, ...(selectedCategory ? { slug: selectedCategory.slug } : {}) },
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { packageLabel: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  }
  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { category: { name: "asc" } }, { featured: "desc" }, { name: "asc" }],
  })
  const sortedProducts = products.sort(compareMarketplaceProducts)
  const pagination = getPagination(page, sortedProducts.length)
  const paginatedProducts = sortedProducts.slice(pagination.skip, pagination.skip + pagination.take)

  return (
    <main>
      <PrivatePageHeader
        eyebrow={`Olá, ${user.name}`}
        title={
          <>
            Produtos da <span className="text-lime neon-glow">Factory.</span>
          </>
        }
        description="Consulte itens disponíveis para reposição, confira embalagens e adicione direto ao pedido."
        icon={PackageSearch}
      >
        <div className="w-fit rounded-2xl border border-lime/20 bg-lime/10 px-5 py-4">
          <p className="text-2xl font-black text-lime">{sortedProducts.length}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">produtos ativos</p>
        </div>
      </PrivatePageHeader>

      <div className="mx-auto max-w-7xl px-4 py-14 md:py-18">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime">Catálogo exclusivo</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">Itens disponíveis</h2>
          </div>
          <AdminSearch
            containerId="marketplace-products-list"
            placeholder="Buscar produto, categoria ou embalagem..."
            queryParam="q"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <CategoryFilterLink
            active={!selectedCategory}
            href={categoryFilterHref(resolvedSearchParams, null)}
            label="Todas"
            count={categories.reduce((total, category) => total + category._count.products, 0)}
          />
          {filterCategories.map((category) => (
            <CategoryFilterLink
              key={category.id}
              active={selectedCategory?.id === category.id}
              href={categoryFilterHref(resolvedSearchParams, category.slug)}
              label={category.name}
              count={category._count.products}
            />
          ))}
        </div>

        {paginatedProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            O catálogo ainda não possui produtos ativos.
          </div>
        ) : (
          <div id="marketplace-products-list" className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {paginatedProducts.map((product) => (
              <div
                key={product.id}
                data-search={`${product.name} ${product.description ?? ""} ${product.category.name} ${product.packageLabel} ${product.unit}`}
              >
                <ProductDetailCard
                  product={adaptMarketplaceProduct(product)}
                  commerce={{
                    context: "marketplace",
                    id: product.id,
                    unit: product.unit,
                    packageLabel: product.packageLabel,
                    minimumQuantity: product.minimumQuantity,
                  }}
                />
              </div>
            ))}
          </div>
        )}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          searchParams={resolvedSearchParams}
        />
      </div>
    </main>
  )
}

function categoryFilterHref(searchParams: SearchParams | undefined, categorySlug: string | null) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "page" || key === "categoria" || value === undefined) continue
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
    else params.set(key, value)
  }

  if (categorySlug) params.set("categoria", categorySlug)

  const query = params.toString()
  return query ? `/marketplace/produtos?${query}` : "/marketplace/produtos"
}

function CategoryFilterLink({
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

function getMarketplaceProductLine(product: MarketplaceProductListItem) {
  return adaptMarketplaceProduct(product).category === "CONGELADO" ? 0 : 1
}

function compareMarketplaceProducts(first: MarketplaceProductListItem, second: MarketplaceProductListItem) {
  const lineComparison = getMarketplaceProductLine(first) - getMarketplaceProductLine(second)
  if (lineComparison !== 0) return lineComparison

  const categoryOrderComparison = first.category.sortOrder - second.category.sortOrder
  if (categoryOrderComparison !== 0) return categoryOrderComparison

  const categoryNameComparison = first.category.name.localeCompare(second.category.name, "pt-BR")
  if (categoryNameComparison !== 0) return categoryNameComparison

  if (first.featured !== second.featured) return first.featured ? -1 : 1

  return first.name.localeCompare(second.name, "pt-BR")
}
