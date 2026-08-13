"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  LoaderCircle,
  MessageCircle,
  Minus,
  Plus,
  Send,
  ShoppingCart,
  Truck,
  Trash2,
  X,
} from "lucide-react"
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"
import { formatMoneyFromCents } from "@/lib/money"
import { getPaymentMethodLabel, type MarketplacePaymentMethod } from "@/lib/payment-method"
import {
  getFactoryPickupEstimateMessage,
  getOrderFulfillmentLabel,
  type OrderFulfillmentMethod,
} from "@/lib/order-fulfillment"

type CheckoutResponse = {
  whatsappUrl?: string
  orderNumber?: string
  error?: string
}

type CouponPreview = {
  code: string
  couponDiscountInCents: number
  franchiseDiscountInCents: number
  pixDiscountInCents: number
  totalInCents: number
}

function paymentDiscountLabel(method: MarketplacePaymentMethod, discountPercent: number) {
  if (method === "BOLETO" && discountPercent <= 0) return "Para franqueados"
  if (discountPercent <= 0) return method === "PIX" ? "Sem desconto" : "Link pelo WhatsApp"
  return `${discountPercent}% de desconto`
}

export function MarketplaceCartDrawer({
  pixDiscountPercent,
  cardDiscountPercent,
  boletoDiscountPercent,
  allowBoleto = false,
}: {
  pixDiscountPercent: number
  cardDiscountPercent: number
  boletoDiscountPercent: number
  allowBoleto?: boolean
}) {
  const { items, lastCheckout, open, closeCart, remove, setQuantity, clear, setLastCheckout, load } =
    useMarketplaceCart()
  const [paymentMethod, setPaymentMethod] = useState<MarketplacePaymentMethod>("PIX")
  const [fulfillmentMethod, setFulfillmentMethod] = useState<OrderFulfillmentMethod>("SHIP_BY_CARRIER")
  const [coupon, setCoupon] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponError, setCouponError] = useState("")
  const [error, setError] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState("")

  useLockBodyScroll(open)

  useEffect(() => {
    if (open) void load()
  }, [load, open])

  useEffect(() => {
    if (open) return

    setConfirmed(false)
    setReviewing(false)
    setWhatsappFallbackUrl("")
    setError("")
  }, [open])

  if (!open) return null

  const subtotal = items.reduce((total, item) => total + item.unitPriceInCents * item.quantity, 0)
  const paymentDiscountEligibleSubtotal = items.reduce(
    (total, item) => total + (item.paymentDiscountEligibleInCents ?? item.unitPriceInCents * item.quantity),
    0
  )
  const hasPaymentDiscountEligibleItems = paymentDiscountEligibleSubtotal > 0
  const effectivePixDiscountPercent = hasPaymentDiscountEligibleItems ? pixDiscountPercent : 0
  const effectiveCardDiscountPercent = hasPaymentDiscountEligibleItems ? cardDiscountPercent : 0
  const effectiveBoletoDiscountPercent = hasPaymentDiscountEligibleItems ? boletoDiscountPercent : 0
  const activePaymentDiscountPercent =
    paymentMethod === "PIX"
      ? effectivePixDiscountPercent
      : paymentMethod === "CARD"
        ? effectiveCardDiscountPercent
        : effectiveBoletoDiscountPercent
  const pickupEstimateMessage = getFactoryPickupEstimateMessage()
  const estimatedPixDiscount = couponPreview
    ? couponPreview.pixDiscountInCents
    : Math.round(paymentDiscountEligibleSubtotal * (activePaymentDiscountPercent / 100))
  const estimatedTotal = couponPreview ? couponPreview.totalInCents : subtotal - estimatedPixDiscount

  function openWhatsApp(url: string) {
    const opened = window.open(url, "_blank")
    if (!opened) {
      setWhatsappFallbackUrl(url)
      setError("Seu navegador bloqueou a nova guia. Use o botão abaixo para abrir o WhatsApp.")
    }
  }

  async function applyCoupon() {
    const normalizedCoupon = coupon.trim().toUpperCase()
    if (!normalizedCoupon || couponLoading) return

    setCouponLoading(true)
    setCouponError("")
    setCouponPreview(null)

    try {
      const response = await fetch("/api/marketplace/pedidos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupon: normalizedCoupon,
          items: items.map((item) => ({
            id: item.id,
            type: item.type,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions,
          })),
          paymentMethod,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        setCouponError(result.error ?? "Não foi possível aplicar o cupom.")
        return
      }

      setCouponPreview(result as CouponPreview)
    } catch {
      setCouponError("Falha ao validar o cupom. Tente novamente.")
    } finally {
      setCouponLoading(false)
    }
  }

  function changePaymentMethod(method: MarketplacePaymentMethod) {
    setPaymentMethod(method)
    setCouponPreview(null)
    setCouponError("")
    setReviewing(false)
  }

  function invalidateCouponPreview() {
    setCouponPreview(null)
    setCouponError("")
    setReviewing(false)
  }

  function startReview() {
    if (items.length === 0) return
    setError("")
    setReviewing(true)
  }

  async function checkout() {
    if (items.length === 0 || loading) return

    setLoading(true)
    setError("")
    setWhatsappFallbackUrl("")

    try {
      const response = await fetch("/api/marketplace/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            type: item.type,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions,
          })),
          paymentMethod,
          fulfillmentMethod,
          coupon: couponPreview?.code ?? "",
          notes: notes.trim(),
        }),
      })
      const result = (await response.json()) as CheckoutResponse

      if (!response.ok || !result.whatsappUrl) {
        setError(result.error ?? "Não foi possível criar o pedido.")
        return
      }

      setConfirmed(true)
      setReviewing(false)
      setWhatsappFallbackUrl(result.whatsappUrl)
      setLastCheckout({
        orderNumber: result.orderNumber ?? "Pedido",
        whatsappUrl: result.whatsappUrl,
        createdAt: new Date().toISOString(),
      })
      void clear()
      openWhatsApp(result.whatsappUrl)
    } catch {
      setError("Falha de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function renderSummary() {
    return (
      <section className="space-y-3 rounded-xl border border-border/70 bg-background/45 p-4 text-xs transition-all duration-300 hover:border-lime/25 hover:bg-background/60">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatMoneyFromCents(subtotal)}</span>
        </div>
        {couponPreview && couponPreview.couponDiscountInCents > 0 && (
          <div className="flex justify-between text-lime">
            <span>Cupom {couponPreview.code}</span>
            <span>-{formatMoneyFromCents(couponPreview.couponDiscountInCents)}</span>
          </div>
        )}
        {couponPreview && couponPreview.franchiseDiscountInCents > 0 && (
          <div className="flex justify-between text-lime">
            <span>Desconto da unidade</span>
            <span>-{formatMoneyFromCents(couponPreview.franchiseDiscountInCents)}</span>
          </div>
        )}
        {estimatedPixDiscount > 0 && (
          <div className="flex justify-between text-lime">
            <span>Desconto {getPaymentMethodLabel(paymentMethod)} estimado</span>
            <span>-{formatMoneyFromCents(estimatedPixDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-4 text-lg font-black">
          <span>Total estimado</span>
          <span className="text-lime">{formatMoneyFromCents(estimatedTotal)}</span>
        </div>
      </section>
    )
  }

  return (
    <aside className="fixed inset-0 z-50 flex flex-col bg-background shadow-2xl animate-in fade-in zoom-in-[0.985] duration-200">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-300 sm:px-8">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-lime" />
          <h2 className="font-black uppercase">{reviewing ? "Revisar pedido" : "Seu pedido"}</h2>
        </div>
        <button
          onClick={closeCart}
          className="flex size-11 items-center justify-center rounded-full bg-graphite transition-all duration-200 hover:rotate-90 hover:bg-foreground/10 hover:text-lime active:scale-95"
          aria-label="Fechar pedido"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {confirmed ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="flex size-16 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime animate-in zoom-in duration-300">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h3 className="mt-5 text-xl font-black uppercase">Pedido confirmado</h3>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            Recebemos seu pedido. A mensagem do WhatsApp está pronta e você pode abrir novamente quando precisar.
          </p>
          {fulfillmentMethod === "FACTORY_PICKUP" && (
            <p className="mt-4 max-w-sm rounded-xl border border-lime/25 bg-lime/10 px-4 py-3 text-xs font-bold leading-5 text-lime">
              {pickupEstimateMessage}
            </p>
          )}
          {whatsappFallbackUrl && (
            <a
              href={whatsappFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-xs font-black uppercase text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar pelo WhatsApp
            </a>
          )}
          {whatsappFallbackUrl && (
            <button
              type="button"
              onClick={() => openWhatsApp(whatsappFallbackUrl)}
              className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-[10px] font-black uppercase text-lime"
            >
              <Send className="h-4 w-4" />
              Enviar novamente
            </button>
          )}
          {error && <p className="mt-4 max-w-xs text-xs font-bold text-red-300">{error}</p>}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-lime/20 bg-lime/10">
            <img
              src="/burrito-pegando-fogo-fundo-amarelo.svg"
              alt=""
              width={76}
              height={76}
              loading="eager"
              decoding="sync"
              className="h-24 w-24 object-contain p-2 opacity-50"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Seu carrinho está vazio no momento.</p>
          <button
            onClick={closeCart}
            className="min-h-11 px-4 text-xs font-black tracking-wider text-lime transition hover:-translate-y-0.5 hover:underline active:scale-95"
          >
            VER PRODUTOS
          </button>
          {lastCheckout && (
            <a
              href={lastCheckout.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-xs font-black uppercase text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Reenviar último pedido
            </a>
          )}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden">
          <main className="px-5 py-6 animate-in fade-in slide-in-from-bottom-3 duration-300 sm:px-8 lg:min-h-0 lg:overflow-y-auto">
            {reviewing ? (
              <div className="mx-auto w-full max-w-5xl">
                <button
                  type="button"
                  onClick={() => setReviewing(false)}
                  className="mb-6 inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-[10px] font-black uppercase text-muted-foreground hover:text-lime"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao carrinho
                </button>
                <p className="text-[10px] font-black uppercase tracking-wider text-lime">Revise antes de enviar</p>
                <h3 className="mt-1 text-2xl font-black uppercase sm:text-3xl">Conferir pedido</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Confira os produtos, as quantidades, a forma de pagamento e as observações antes de enviar pelo
                  WhatsApp.
                </p>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {items.map((item, index) => (
                    <article
                      key={`${item.type}-${item.id}-${item.selectionKey ?? "default"}`}
                      className="group rounded-xl border border-border bg-graphite p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-1 hover:border-lime/35 hover:bg-lime/[0.025] hover:shadow-[0_18px_45px_rgba(0,0,0,0.22),0_0_24px_rgba(239,255,13,0.06)]"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <div className="flex h-full flex-col justify-between gap-5">
                        <div>
                          <h4 className="text-sm font-black uppercase leading-5">{item.name}</h4>
                          <p className="mt-1 text-xs text-muted-foreground">{item.packageLabel}</p>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <ul className="mt-3 space-y-1 text-[10px] font-bold uppercase text-foreground/70">
                              {item.selectedOptions.map((option) => (
                                <li key={option.productId}>
                                  {option.quantity}x {option.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
                          <p className="text-xs font-black uppercase text-muted-foreground">Qtd. {item.quantity}</p>
                          <p className="text-lg font-black text-lime">
                            {formatMoneyFromCents(item.unitPriceInCents * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-5xl">
                <p className="text-[10px] font-black uppercase tracking-wider text-lime">Itens do carrinho</p>
                <h3 className="mt-1 text-2xl font-black uppercase sm:text-3xl">Produtos selecionados</h3>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {items.map((item, index) => (
                    <article
                      key={`${item.type}-${item.id}-${item.selectionKey ?? "default"}`}
                      className="group rounded-xl border border-border bg-graphite p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-1 hover:border-lime/35 hover:bg-lime/[0.025] hover:shadow-[0_18px_45px_rgba(0,0,0,0.22),0_0_24px_rgba(239,255,13,0.06)]"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-black uppercase leading-5">{item.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{item.packageLabel}</p>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <ul className="mt-3 space-y-1 text-[10px] font-bold uppercase text-foreground/70">
                              {item.selectedOptions.map((option) => (
                                <li key={option.productId}>
                                  {option.quantity}x {option.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            remove(item.id, item.type, item.selectionKey)
                            invalidateCouponPreview()
                          }}
                          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 active:scale-90"
                          aria-label={`Remover ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setQuantity(item.id, item.type, item.quantity - 1, item.selectionKey)
                              invalidateCouponPreview()
                            }}
                            className="flex size-10 items-center justify-center rounded-full border border-border transition-all duration-200 hover:border-lime/50 hover:text-lime active:scale-90"
                            aria-label={`Diminuir quantidade de ${item.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuantity(item.id, item.type, item.quantity + 1, item.selectionKey)
                              invalidateCouponPreview()
                            }}
                            className="flex size-10 items-center justify-center rounded-full border border-border transition-all duration-200 hover:border-lime/50 hover:text-lime active:scale-90"
                            aria-label={`Aumentar quantidade de ${item.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-lg font-black text-lime">
                          {formatMoneyFromCents(item.unitPriceInCents * item.quantity)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </main>

          <aside className="border-t border-border bg-graphite px-5 py-6 animate-in fade-in slide-in-from-right-4 duration-300 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-6">
            <div className="space-y-5">
              {!reviewing ? (
                <>
                  <section>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Forma de pagamento
                    </p>
                    <div className={`grid gap-3 ${allowBoleto ? "grid-cols-3" : "grid-cols-2"}`}>
                      <button
                        type="button"
                        onClick={() => changePaymentMethod("PIX")}
                        className={`min-h-[72px] rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-lime/40 hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] active:scale-[0.98] ${
                          paymentMethod === "PIX" ? "border-lime bg-lime/10" : "border-border"
                        }`}
                      >
                        <span className="block text-xs font-black">PIX</span>
                        <span className="mt-1 block text-[10px] text-lime">
                          {paymentDiscountLabel("PIX", effectivePixDiscountPercent)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => changePaymentMethod("CARD")}
                        className={`min-h-[72px] rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-lime/40 hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] active:scale-[0.98] ${
                          paymentMethod === "CARD" ? "border-lime bg-lime/10" : "border-border"
                        }`}
                      >
                        <span className="block text-xs font-black">CARTÃO</span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {paymentDiscountLabel("CARD", effectiveCardDiscountPercent)}
                        </span>
                      </button>
                      {allowBoleto && (
                        <button
                          type="button"
                          onClick={() => changePaymentMethod("BOLETO")}
                          className={`min-h-[72px] rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-lime/40 hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] active:scale-[0.98] ${
                            paymentMethod === "BOLETO" ? "border-lime bg-lime/10" : "border-border"
                          }`}
                        >
                          <span className="block text-xs font-black">BOLETO</span>
                          <span className="mt-1 block text-[10px] text-muted-foreground">
                            {paymentDiscountLabel("BOLETO", effectiveBoletoDiscountPercent)}
                          </span>
                        </button>
                      )}
                    </div>
                  </section>

                  <section>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Entrega ou retirada
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFulfillmentMethod("SHIP_BY_CARRIER")
                          setReviewing(false)
                        }}
                        className={`min-h-[78px] rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-lime/40 hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] active:scale-[0.98] ${
                          fulfillmentMethod === "SHIP_BY_CARRIER" ? "border-lime bg-lime/10" : "border-border"
                        }`}
                      >
                        <Truck className="mb-2 h-4 w-4 text-lime" />
                        <span className="block text-xs font-black">TRANSPORTADORA</span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          Receber no endereço combinado
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFulfillmentMethod("FACTORY_PICKUP")
                          setReviewing(false)
                        }}
                        className={`min-h-[78px] rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-lime/40 hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] active:scale-[0.98] ${
                          fulfillmentMethod === "FACTORY_PICKUP" ? "border-lime bg-lime/10" : "border-border"
                        }`}
                      >
                        <ShoppingCart className="mb-2 h-4 w-4 text-purple-medium" />
                        <span className="block text-xs font-black">RETIRADA</span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">Retirar na fábrica</span>
                      </button>
                    </div>
                    {fulfillmentMethod === "FACTORY_PICKUP" && (
                      <div className="mt-3 flex gap-3 rounded-xl border border-lime/25 bg-lime/10 p-4 text-xs leading-5 text-lime">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="font-bold">{pickupEstimateMessage}</p>
                      </div>
                    )}
                  </section>

                  <section className="space-y-5">
                    <div className="space-y-3">
                      <label
                        htmlFor="marketplace-coupon"
                        className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground"
                      >
                        Cupom de desconto
                      </label>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_96px]">
                        <input
                          id="marketplace-coupon"
                          value={coupon}
                          onChange={(event) => {
                            setCoupon(event.target.value.toUpperCase())
                            setCouponPreview(null)
                            setCouponError("")
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault()
                              applyCoupon()
                            }
                          }}
                          placeholder="Cupom de desconto"
                          className="h-12 min-w-0 rounded-xl border border-border bg-background px-4 text-sm uppercase transition-all duration-200 hover:border-foreground/25 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20"
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          disabled={!coupon.trim() || couponLoading}
                          className="flex h-12 min-w-24 items-center justify-center gap-2 rounded-xl border border-lime/30 px-4 text-[10px] font-black text-lime transition-all duration-200 hover:bg-lime hover:text-background active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-lime"
                        >
                          {couponLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                          {couponLoading ? "VALIDANDO" : "APLICAR"}
                        </button>
                      </div>
                      {couponPreview && (
                        <p className="flex items-center gap-2 text-[10px] font-bold text-lime">
                          <CheckCircle2 className="h-4 w-4" />
                          Cupom {couponPreview.code} aplicado.
                        </p>
                      )}
                      {couponError && <p className="text-[10px] font-bold text-red-300">{couponError}</p>}
                    </div>

                    <div className="space-y-3">
                      <label
                        htmlFor="marketplace-order-notes"
                        className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground"
                      >
                        Observações do pedido
                      </label>
                      <textarea
                        id="marketplace-order-notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Observações do pedido"
                        rows={4}
                        className="min-h-28 w-full rounded-xl border border-border bg-background p-4 text-sm transition-all duration-200 hover:border-foreground/25 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20"
                      />
                    </div>
                  </section>
                </>
              ) : (
                <section className="rounded-xl border border-border bg-background/45 p-4 text-sm">
                  <h4 className="text-sm font-black uppercase">Detalhes do pedido</h4>
                  <div className="mt-4 flex justify-between gap-4">
                    <span className="text-muted-foreground">Pagamento</span>
                    <span className="font-black uppercase">{getPaymentMethodLabel(paymentMethod)}</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-4">
                    <span className="text-muted-foreground">Entrega</span>
                    <span className="text-right font-black uppercase">
                      {getOrderFulfillmentLabel(fulfillmentMethod)}
                    </span>
                  </div>
                  {fulfillmentMethod === "FACTORY_PICKUP" && (
                    <div className="mt-4 flex gap-3 rounded-xl border border-lime/25 bg-lime/10 p-4 text-xs leading-5 text-lime">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="font-bold">{pickupEstimateMessage}</p>
                    </div>
                  )}
                  {couponPreview && (
                    <div className="mt-3 flex justify-between gap-4">
                      <span className="text-muted-foreground">Cupom</span>
                      <span className="font-black uppercase">{couponPreview.code}</span>
                    </div>
                  )}
                  {notes.trim() && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-xs font-black uppercase text-muted-foreground">Observações</p>
                      <p className="mt-2 leading-6">{notes.trim()}</p>
                    </div>
                  )}
                </section>
              )}

              {renderSummary()}

              {error && <p className="text-center text-xs font-bold text-red-300">{error}</p>}
              <button
                type="button"
                onClick={reviewing ? checkout : startReview}
                disabled={loading}
                className={`flex h-13 w-full items-center justify-center gap-2 rounded-full text-xs font-black transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 ${
                  reviewing ? "bg-[#25D366] text-white" : "bg-lime text-background"
                }`}
              >
                {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {loading ? "CRIANDO PEDIDO..." : reviewing ? "Confirmar e enviar pelo WhatsApp" : "Revisar pedido"}
              </button>
              <p className="px-2 text-center text-[10px] leading-4 text-muted-foreground">
                A Factory enviará o código PIX, o link para cartão ou as instruções do boleto na conversa.
              </p>
            </div>
          </aside>
        </div>
      )}
    </aside>
  )
}
