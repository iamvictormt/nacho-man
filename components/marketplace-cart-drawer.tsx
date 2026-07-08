"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, LoaderCircle, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"
import { formatMoneyFromCents } from "@/lib/money"
import { getPaymentMethodLabel, type MarketplacePaymentMethod } from "@/lib/payment-method"
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"

type CheckoutResponse = {
  whatsappUrl?: string
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
  const { items, open, closeCart, remove, setQuantity, clear } = useMarketplaceCart()
  const [paymentMethod, setPaymentMethod] = useState<MarketplacePaymentMethod>("PIX")
  const [coupon, setCoupon] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponError, setCouponError] = useState("")
  const [error, setError] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState("")

  useLockBodyScroll(open)

  useEffect(() => {
    if (open) return

    setConfirmed(false)
    setWhatsappFallbackUrl("")
    setError("")
  }, [open])

  if (!open) return null

  const subtotal = items.reduce((total, item) => total + item.unitPriceInCents * item.quantity, 0)
  const activePaymentDiscountPercent =
    paymentMethod === "PIX"
      ? pixDiscountPercent
      : paymentMethod === "CARD"
        ? cardDiscountPercent
        : boletoDiscountPercent
  const estimatedPixDiscount = couponPreview
    ? couponPreview.pixDiscountInCents
    : Math.round(subtotal * (activePaymentDiscountPercent / 100))
  const estimatedTotal = couponPreview ? couponPreview.totalInCents : subtotal - estimatedPixDiscount

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
          subtotalInCents: subtotal,
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
  }

  function invalidateCouponPreview() {
    setCouponPreview(null)
    setCouponError("")
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
          coupon: coupon.trim(),
          notes: notes.trim(),
        }),
      })
      const result = (await response.json()) as CheckoutResponse

      if (!response.ok || !result.whatsappUrl) {
        setError(result.error ?? "Não foi possível criar o pedido.")
        return
      }

      setConfirmed(true)
      clear()
      window.setTimeout(() => {
        const opened = window.open(result.whatsappUrl, "_blank")
        if (opened) {
          closeCart()
        } else {
          setWhatsappFallbackUrl(result.whatsappUrl!)
          setError("Seu navegador bloqueou a nova guia. Use o botão abaixo para abrir o WhatsApp.")
        }
      }, 1000)
    } catch {
      setError("Falha de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="fixed inset-0 z-50 bg-black/75" onClick={closeCart} aria-label="Fechar carrinho" />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-lime" />
            <h2 className="font-black uppercase">Seu pedido</h2>
          </div>
          <button onClick={closeCart} className="flex size-11 items-center justify-center rounded-full bg-graphite">
            <X className="h-5 w-5" />
          </button>
        </header>

        {confirmed ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h3 className="mt-5 text-xl font-black uppercase">Pedido confirmado</h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
              Recebemos seu pedido. O WhatsApp será aberto em uma nova guia com a mensagem preenchida.
            </p>
            {!whatsappFallbackUrl && (
              <p className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-lime">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Abrindo WhatsApp
              </p>
            )}
            {whatsappFallbackUrl && (
              <a
                href={whatsappFallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#25D366] px-6 text-xs font-black uppercase text-white"
              >
                Abrir WhatsApp
              </a>
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {items.map((item) => (
              <article
                key={`${item.type}-${item.id}-${item.selectionKey ?? "default"}`}
                className="rounded-xl border border-border bg-graphite p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase">{item.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{item.packageLabel}</p>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <ul className="mt-2 space-y-1 text-[10px] font-bold uppercase text-foreground/70">
                        {item.selectedOptions.map((option) => (
                          <li key={option.productId}>
                            {option.quantity}x {option.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      remove(item.id, item.type, item.selectionKey)
                      invalidateCouponPreview()
                    }}
                    className="text-muted-foreground hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setQuantity(item.id, item.type, item.quantity - 1, item.selectionKey)
                        invalidateCouponPreview()
                      }}
                      className="flex size-9 items-center justify-center rounded-full border border-border"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                    <button
                      onClick={() => {
                        setQuantity(item.id, item.type, item.quantity + 1, item.selectionKey)
                        invalidateCouponPreview()
                      }}
                      className="flex size-9 items-center justify-center rounded-full border border-border"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="font-black text-lime">{formatMoneyFromCents(item.unitPriceInCents * item.quantity)}</p>
                </div>
              </article>
            ))}
            {items.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
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
                <p className="text-sm font-semibold text-muted-foreground">Seu carrinho está vazio</p>
                <button
                  onClick={closeCart}
                  className="min-h-11 px-4 text-xs font-black tracking-wider text-lime hover:underline"
                >
                  VER PRODUTOS
                </button>
              </div>
            )}
          </div>
        )}

        {items.length > 0 && !confirmed && (
          <footer className="space-y-4 border-t border-border bg-graphite p-5">
            <div className={`grid gap-3 ${allowBoleto ? "grid-cols-3" : "grid-cols-2"}`}>
              <button
                onClick={() => changePaymentMethod("PIX")}
                className={`rounded-xl border p-4 text-left ${paymentMethod === "PIX" ? "border-lime bg-lime/10" : "border-border"}`}
              >
                <span className="block text-xs font-black">PIX</span>
                <span className="mt-1 block text-[10px] text-lime">
                  {paymentDiscountLabel("PIX", pixDiscountPercent)}
                </span>
              </button>
              <button
                onClick={() => changePaymentMethod("CARD")}
                className={`rounded-xl border p-4 text-left ${paymentMethod === "CARD" ? "border-lime bg-lime/10" : "border-border"}`}
              >
                <span className="block text-xs font-black">CARTÃO</span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {paymentDiscountLabel("CARD", cardDiscountPercent)}
                </span>
              </button>
              {allowBoleto && (
                <button
                  onClick={() => changePaymentMethod("BOLETO")}
                  className={`rounded-xl border p-4 text-left ${paymentMethod === "BOLETO" ? "border-lime bg-lime/10" : "border-border"}`}
                >
                  <span className="block text-xs font-black">BOLETO</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {paymentDiscountLabel("BOLETO", boletoDiscountPercent)}
                  </span>
                </button>
              )}
            </div>
            <div>
              <div className="flex gap-2">
                <input
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
                  className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm uppercase"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={!coupon.trim() || couponLoading}
                  className="flex h-11 min-w-24 items-center justify-center gap-2 rounded-xl border border-lime/30 px-4 text-[10px] font-black text-lime disabled:opacity-50"
                >
                  {couponLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {couponLoading ? "VALIDANDO" : "APLICAR"}
                </button>
              </div>
              {couponPreview && (
                <p className="mt-2 flex items-center gap-2 text-[10px] font-bold text-lime">
                  <CheckCircle2 className="h-4 w-4" />
                  Cupom {couponPreview.code} aplicado.
                </p>
              )}
              {couponError && <p className="mt-2 text-[10px] font-bold text-red-300">{couponError}</p>}
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observações do pedido"
              rows={2}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
            <div className="space-y-2 text-xs">
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
              <div className="flex justify-between border-t border-border pt-3 text-lg font-black">
                <span>Total estimado</span>
                <span className="text-lime">{formatMoneyFromCents(estimatedTotal)}</span>
              </div>
            </div>
            {error && <p className="text-center text-xs font-bold text-red-300">{error}</p>}
            <button
              onClick={checkout}
              disabled={loading}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-xs font-black text-white disabled:opacity-60"
            >
              {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {loading ? "CRIANDO PEDIDO..." : "FINALIZAR PELO WHATSAPP"}
            </button>
            <p className="text-center text-[10px] leading-4 text-muted-foreground">
              A Factory enviará o código PIX, o link de cartão ou as instruções do boleto na conversa.
            </p>
          </footer>
        )}
      </aside>
    </>
  )
}
