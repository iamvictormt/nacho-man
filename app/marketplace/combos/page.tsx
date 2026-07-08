import { Gift } from "lucide-react"
import { redirect } from "next/navigation"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireMarketplaceUser } from "@/lib/auth"
import { AdminSearch } from "@/components/admin-search"
import { MarketplaceComboCard } from "@/components/marketplace-combo-card"
import { PrivatePageHeader } from "@/components/private-page-header"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, getPagination, getSearchQuery, type SearchParams } from "@/lib/pagination"

export default async function MarketplaceCombosPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const user = await requireMarketplaceUser()
  if (user.role !== "FRANCHISEE") redirect("/marketplace/produtos")

  const page = getCurrentPage(resolvedSearchParams)
  const query = getSearchQuery(resolvedSearchParams)
  const now = new Date()
  const where: Prisma.ComboWhereInput = {
    active: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
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
  const totalCombos = await prisma.combo.count({ where })
  const pagination = getPagination(page, totalCombos)
  const combos = await prisma.combo.findMany({
    where,
    include: { options: { include: { product: { select: { name: true, image: true } } } } },
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
  })

  return (
    <main>
      <PrivatePageHeader
        eyebrow={`Olá, ${user.name}`}
        title={
          <>
            Combos da <span className="text-lime neon-glow">Factory.</span>
          </>
        }
        description="Veja ofertas montadas para facilitar a reposição da sua unidade e adicionar direto ao pedido."
        icon={Gift}
      >
        <div className="w-fit rounded-2xl border border-lime/20 bg-lime/10 px-5 py-4">
          <p className="text-2xl font-black text-lime">{totalCombos}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">combos ativos</p>
        </div>
      </PrivatePageHeader>

      <div className="mx-auto max-w-7xl px-4 py-14 md:py-18">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime">Ofertas montadas</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">Combos disponíveis</h2>
          </div>
          <AdminSearch containerId="marketplace-combos-list" placeholder="Buscar combo ou produto..." queryParam="q" />
        </div>

        {combos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Nenhum combo ativo no momento.
          </div>
        ) : (
          <div id="marketplace-combos-list" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {combos.map((combo) => (
              <div
                key={combo.id}
                data-search={`${combo.name} ${combo.description ?? ""} ${combo.options.map((option) => option.product.name).join(" ")}`}
              >
                <MarketplaceComboCard combo={combo} />
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
