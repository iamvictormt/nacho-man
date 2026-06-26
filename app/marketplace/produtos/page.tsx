import { PackageSearch } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireFranchisee } from "@/lib/auth"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"
import { AdminSearch } from "@/components/admin-search"
import { PrivatePageHeader } from "@/components/private-page-header"
import { ProductDetailCard } from "@/components/product-detail-card"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, type SearchParams } from "@/lib/pagination"

export default async function MarketplaceProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const user = await requireFranchisee()
  const page = getCurrentPage(resolvedSearchParams)
  const where = { audience: "FRANCHISEE" as const, active: true, category: { active: true } }
  const totalProducts = await prisma.product.count({ where })
  const pagination = getPagination(page, totalProducts)
  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    skip: pagination.skip,
    take: pagination.take,
  })

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
          <p className="text-2xl font-black text-lime">{totalProducts}</p>
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
          />
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            O catálogo ainda não possui produtos ativos.
          </div>
        ) : (
          <div id="marketplace-products-list" className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => (
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
