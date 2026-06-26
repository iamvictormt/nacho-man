import { Percent, Plus, Ticket } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatMoneyFromCents } from "@/lib/money"
import { AdminActionForm } from "@/components/admin-action-form"
import { AdminModal } from "@/components/admin-modal"
import { AdminSearch } from "@/components/admin-search"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { AdminCheckbox, AdminFieldGrid, AdminInput, AdminSelect } from "@/components/admin-form-fields"
import {
  createCouponAction,
  createPromotionAction,
  deleteCouponAction,
  deletePromotionAction,
  updateCouponAction,
  updatePromotionAction,
} from "./actions"
import { AdminDataLabel, AdminDataList, AdminDataRow } from "@/components/admin-data-list"
import { AdminManageModal } from "@/components/admin-manage-modal"
import { PaginationControls } from "@/components/pagination-controls"
import { getCurrentPage, type SearchParams } from "@/lib/pagination"

const CAMPAIGN_PAGE_SIZE = 6

export default async function CampaignsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const page = getCurrentPage(resolvedSearchParams)
  const [promotionCount, couponCount] = await Promise.all([prisma.promotion.count(), prisma.coupon.count()])
  const totalPages = Math.max(1, Math.ceil(Math.max(promotionCount, couponCount) / CAMPAIGN_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const currentSkip = (currentPage - 1) * CAMPAIGN_PAGE_SIZE
  const [products, coupons, promotions] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.coupon.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      skip: currentSkip,
      take: CAMPAIGN_PAGE_SIZE,
    }),
    prisma.promotion.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
      skip: currentSkip,
      take: CAMPAIGN_PAGE_SIZE,
    }),
  ])
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Campanhas comerciais</p>
          <h1 className="mt-3 text-4xl font-black uppercase">Promoções e cupons</h1>
          <p className="mt-3 text-sm text-muted-foreground">Crie condições comerciais para a rede.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
          <AdminModal
            id="create-promotion"
            title="Criar promoção"
            size="md"
            trigger={
              <button className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-lime/30 px-4 text-[10px] font-black text-lime md:w-auto md:px-5">
                <Plus className="h-4 w-4" /> PROMOÇÃO
              </button>
            }
          >
            <PromotionForm
              action={createPromotionAction}
              products={products}
              submit="CRIAR PROMOÇÃO"
              modalId="create-promotion"
              successMessage="Promoção criada."
            />
          </AdminModal>
          <AdminModal
            id="create-coupon"
            title="Criar cupom"
            size="md"
            trigger={
              <button className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-lime px-4 text-[10px] font-black text-background md:w-auto md:px-5">
                <Plus className="h-4 w-4" /> CUPOM
              </button>
            }
          >
            <CouponForm
              action={createCouponAction}
              submit="CRIAR CUPOM"
              modalId="create-coupon"
              successMessage="Cupom criado."
            />
          </AdminModal>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <AdminSearch containerId="campaign-grid" placeholder="Buscar promoção, cupom ou produto..." />
      </div>
      <div id="campaign-grid" className="mt-6">
        <AdminDataList
          headers={["Campanha", "Aplicação", "Benefício", "Vigência", "Status", "Ações"]}
          template="minmax(200px,1.25fr) minmax(160px,1fr) 110px 160px 90px 72px"
        >
          {promotions.map((item) => (
            <AdminDataRow
              key={`promotion-${item.id}`}
              template="minmax(200px,1.25fr) minmax(160px,1fr) 110px 160px 90px 72px"
              search={`${item.name} ${item.product?.name ?? ""}`}
              inactive={!item.active}
            >
              <CampaignIdentity icon={Percent} type="Promoção" title={item.name} />
              <DataText
                label="Aplicação"
                primary={item.product?.name ?? "Produto"}
                secondary={item.minimumQuantity ? `Mínimo ${item.minimumQuantity}` : "Sem mínimo"}
              />
              <DataText label="Benefício" primary={discountLabel(item.type, item.value)} accent />
              <DataText label="Vigência" primary={formatPeriod(item.startsAt, item.endsAt)} />
              <CampaignStatus active={item.active} />
              <AdminManageModal
                id={`manage-promotion-${item.id}`}
                title="Gerenciar promoção"
                size="md"
                ariaLabel={`Gerenciar promoção ${item.name}`}
              >
                <PromotionForm
                  action={updatePromotionAction}
                  products={products}
                  submit="SALVAR ALTERAÇÕES"
                  item={item}
                  modalId={`manage-promotion-${item.id}`}
                  successMessage="Promoção atualizada."
                />
                <div className="mt-6 border-t border-border pt-5">
                  <DeleteActionDialog
                    action={deletePromotionAction}
                    fields={{ id: item.id }}
                    title="Excluir promoção?"
                    description="Esta ação removerá a promoção definitivamente."
                    successMessage="Promoção excluída."
                  />
                </div>
              </AdminManageModal>
            </AdminDataRow>
          ))}
          {coupons.map((item) => (
            <AdminDataRow
              key={`coupon-${item.id}`}
              template="minmax(200px,1.25fr) minmax(160px,1fr) 110px 160px 90px 72px"
              search={`${item.code} ${item.description ?? ""}`}
              inactive={!item.active}
            >
              <CampaignIdentity icon={Ticket} type="Cupom" title={item.code} purple />
              <DataText
                label="Aplicação"
                primary={
                  item.minimumInCents
                    ? `Pedido mínimo ${formatMoneyFromCents(item.minimumInCents)}`
                    : "Sem pedido mínimo"
                }
                secondary={`${item.uses} usos`}
              />
              <DataText label="Benefício" primary={discountLabel(item.type, item.value)} accent />
              <DataText label="Vigência" primary={formatPeriod(item.startsAt, item.endsAt)} />
              <CampaignStatus active={item.active} />
              <AdminManageModal
                id={`manage-coupon-${item.id}`}
                title="Gerenciar cupom"
                size="md"
                ariaLabel={`Gerenciar cupom ${item.code}`}
              >
                <CouponForm
                  action={updateCouponAction}
                  submit="SALVAR ALTERAÇÕES"
                  item={item}
                  modalId={`manage-coupon-${item.id}`}
                  successMessage="Cupom atualizado."
                />
                <div className="mt-6 border-t border-border pt-5">
                  <DeleteActionDialog
                    action={deleteCouponAction}
                    fields={{ id: item.id }}
                    title={item._count.orders ? "Arquivar cupom?" : "Excluir cupom?"}
                    description={
                      item._count.orders
                        ? "Este cupom já foi utilizado e será desativado."
                        : "Esta ação removerá o cupom definitivamente."
                    }
                    label={item._count.orders ? "Arquivar" : "Excluir"}
                    successMessage={item._count.orders ? "Cupom arquivado." : "Cupom excluído."}
                  />
                </div>
              </AdminManageModal>
            </AdminDataRow>
          ))}
        </AdminDataList>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={promotionCount + couponCount}
        searchParams={resolvedSearchParams}
      />
    </main>
  )
}

function CampaignIdentity({
  icon: Icon,
  type,
  title,
  purple = false,
}: {
  icon: typeof Percent
  type: string
  title: string
  purple?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${purple ? "border-purple-medium/30 bg-purple-medium/10 text-purple-medium" : "border-lime/20 bg-lime/10 text-lime"}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase text-purple-medium">{type}</p>
        <h2 className="mt-1 truncate text-sm font-black uppercase">{title}</h2>
      </div>
    </div>
  )
}
function DataText({
  label,
  primary,
  secondary,
  accent,
}: {
  label: string
  primary: string
  secondary?: string
  accent?: boolean
}) {
  return (
    <div className="min-w-0">
      <AdminDataLabel>{label}</AdminDataLabel>
      <p className={`mt-1 truncate text-xs font-bold xl:mt-0 ${accent ? "text-lime" : ""}`}>{primary}</p>
      {secondary && <p className="mt-1 text-[9px] text-muted-foreground">{secondary}</p>}
    </div>
  )
}
function CampaignStatus({ active }: { active: boolean }) {
  return (
    <div>
      <span
        className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase ${active ? "border-lime/25 bg-lime/10 text-lime" : "border-red-400/25 bg-red-500/10 text-red-300"}`}
      >
        {active ? "Ativo" : "Inativo"}
      </span>
    </div>
  )
}
function PromotionForm({
  action,
  products,
  submit,
  item,
  modalId,
  successMessage,
}: {
  action: (formData: FormData) => Promise<void>
  products: { id: string; name: string }[]
  submit: string
  modalId: string
  successMessage: string
  item?: {
    id: string
    name: string
    type: string
    value: number
    productId: string | null
    minimumQuantity: number | null
    startsAt: Date
    endsAt: Date
    active: boolean
  }
}) {
  return (
    <AdminActionForm
      action={action}
      submitLabel={submit}
      successMessage={successMessage}
      modalId={modalId}
      className="pt-2"
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <AdminFieldGrid columns="equal">
        <AdminInput name="name" label="Nome" defaultValue={item?.name} required />
        <AdminSelect name="productId" label="Produto" defaultValue={item?.productId ?? ""} required>
          <option value="">Selecione</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </AdminSelect>
      </AdminFieldGrid>
      <AdminFieldGrid columns="three">
        <DiscountFields type={item?.type} value={item?.value} compact />
        <AdminInput
          name="minimumQuantity"
          label="Quantidade mínima"
          mask="integer"
          defaultValue={item?.minimumQuantity ?? ""}
        />
      </AdminFieldGrid>
      <DateFields startsAt={item?.startsAt} endsAt={item?.endsAt} />
      {item && <AdminCheckbox name="active" label="Promoção ativa" defaultChecked={item.active} />}
    </AdminActionForm>
  )
}
function CouponForm({
  action,
  submit,
  item,
  modalId,
  successMessage,
}: {
  action: (formData: FormData) => Promise<void>
  submit: string
  modalId: string
  successMessage: string
  item?: {
    id: string
    code: string
    description: string | null
    type: string
    value: number
    minimumInCents: number | null
    maximumUses: number | null
    startsAt: Date
    endsAt: Date
    active: boolean
  }
}) {
  return (
    <AdminActionForm
      action={action}
      submitLabel={submit}
      successMessage={successMessage}
      modalId={modalId}
      className="pt-2"
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <AdminFieldGrid columns="equal">
        <AdminInput name="code" label="Código" defaultValue={item?.code} required />
        <AdminInput name="description" label="Descrição" defaultValue={item?.description ?? ""} />
      </AdminFieldGrid>
      <DiscountFields type={item?.type} value={item?.value} />
      <AdminFieldGrid columns="equal">
        <AdminInput
          name="minimum"
          label="Pedido mínimo"
          mask="money"
          defaultValue={item?.minimumInCents ? moneyInput(item.minimumInCents) : ""}
        />
        <AdminInput name="maximumUses" label="Limite de usos" mask="integer" defaultValue={item?.maximumUses ?? ""} />
      </AdminFieldGrid>
      <DateFields startsAt={item?.startsAt} endsAt={item?.endsAt} />
      {item && <AdminCheckbox name="active" label="Cupom ativo" defaultChecked={item.active} />}
    </AdminActionForm>
  )
}
function DiscountFields({
  type = "PERCENTAGE",
  value,
  compact = false,
}: {
  type?: string
  value?: number
  compact?: boolean
}) {
  const fields = (
    <>
      <AdminSelect name="type" label="Tipo" defaultValue={type}>
        <option value="PERCENTAGE">Percentual</option>
        <option value="FIXED">Valor fixo</option>
      </AdminSelect>
      <AdminInput
        name="value"
        label="Valor"
        mask={type === "FIXED" ? "money" : "decimal"}
        defaultValue={value === undefined ? "" : type === "FIXED" ? moneyInput(value) : value}
        required
      />
    </>
  )
  return compact ? fields : <AdminFieldGrid>{fields}</AdminFieldGrid>
}
function DateFields({ startsAt, endsAt }: { startsAt?: Date; endsAt?: Date }) {
  return (
    <AdminFieldGrid>
      <AdminInput
        name="startsAt"
        label="Início"
        mask="date"
        defaultValue={startsAt ? dateInput(startsAt) : ""}
        required
      />
      <AdminInput name="endsAt" label="Fim" mask="date" defaultValue={endsAt ? dateInput(endsAt) : ""} required />
    </AdminFieldGrid>
  )
}
function discountLabel(type: string, value: number) {
  return type === "PERCENTAGE" ? `${value}% OFF` : `${formatMoneyFromCents(value)} OFF`
}
function moneyInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}
function dateInput(date: Date) {
  return date.toLocaleDateString("pt-BR")
}
function formatPeriod(start: Date, end: Date) {
  return `${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString("pt-BR")}`
}
