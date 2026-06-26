"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, LoaderCircle, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"
import { formatMoneyFromCents } from "@/lib/money"
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

export function MarketplaceCartDrawer() {
  const { items, open, closeCart, remove, setQuantity, clear } = useMarketplaceCart()
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD">("PIX")
  const [coupon, setCoupon] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponError, setCouponError] = useState("")
  const [error, setError] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState("")
  const whatsappTabRef = useRef<Window | null>(null)

  useLockBodyScroll(open)

  useEffect(() => {
    if (open) return

    setConfirmed(false)
    setWhatsappFallbackUrl("")
    setError("")
  }, [open])

  if (!open) return null

  const subtotal = items.reduce((total, item) => total + item.unitPriceInCents * item.quantity, 0)
  const estimatedPixDiscount = couponPreview
    ? couponPreview.pixDiscountInCents
    : paymentMethod === "PIX"
      ? Math.round(subtotal * 0.04)
      : 0
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

  function changePaymentMethod(method: "PIX" | "CARD") {
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
    whatsappTabRef.current = window.open("about:blank", "_blank")
    whatsappTabRef.current?.document.write(
      "<!doctype html><title>Pedido confirmado</title><body style='margin:0;background:#0f0f0f;color:#fff;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center;text-align:center'><main><h1>Pedido confirmado</h1><p>O WhatsApp será aberto em instantes.</p></main></body>"
    )

    setLoading(true)
    setError("")
    setWhatsappFallbackUrl("")

    try {
      const response = await fetch("/api/marketplace/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, type: item.type, quantity: item.quantity })),
          paymentMethod,
          coupon: coupon.trim(),
          notes: notes.trim(),
        }),
      })
      const result = (await response.json()) as CheckoutResponse

      if (!response.ok || !result.whatsappUrl) {
        whatsappTabRef.current?.close()
        whatsappTabRef.current = null
        setError(result.error ?? "Não foi possível criar o pedido.")
        return
      }

      setConfirmed(true)
      clear()
      window.setTimeout(() => {
        if (whatsappTabRef.current && !whatsappTabRef.current.closed) {
          whatsappTabRef.current.location.href = result.whatsappUrl!
          closeCart()
          return
        }

        const opened = window.open(result.whatsappUrl, "_blank")
        if (opened) {
          closeCart()
        } else {
          setWhatsappFallbackUrl(result.whatsappUrl!)
          setError("Seu navegador bloqueou a nova guia. Use o botão abaixo para abrir o WhatsApp.")
        }
      }, 2000)
    } catch {
      whatsappTabRef.current?.close()
      whatsappTabRef.current = null
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
            <article key={`${item.type}-${item.id}`} className="rounded-xl border border-border bg-graphite p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase">{item.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.packageLabel}</p>
                </div>
                <button
                  onClick={() => {
                    remove(item.id, item.type)
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
                      setQuantity(item.id, item.type, item.quantity - 1)
                      invalidateCouponPreview()
                    }}
                    className="flex size-9 items-center justify-center rounded-full border border-border"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                  <button
                    onClick={() => {
                      setQuantity(item.id, item.type, item.quantity + 1)
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
            <p className="py-20 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          )}
        </div>
        )}

        {items.length > 0 && !confirmed && (
          <footer className="space-y-4 border-t border-border bg-graphite p-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => changePaymentMethod("PIX")}
                className={`rounded-xl border p-4 text-left ${paymentMethod === "PIX" ? "border-lime bg-lime/10" : "border-border"}`}
              >
                <span className="block text-xs font-black">PIX</span>
                <span className="mt-1 block text-[10px] text-lime">4% de desconto</span>
              </button>
              <button
                onClick={() => changePaymentMethod("CARD")}
                className={`rounded-xl border p-4 text-left ${paymentMethod === "CARD" ? "border-lime bg-lime/10" : "border-border"}`}
              >
                <span className="block text-xs font-black">CARTÃO</span>
                <span className="mt-1 block text-[10px] text-muted-foreground">Link pelo WhatsApp</span>
              </button>
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
              {paymentMethod === "PIX" && (
                <div className="flex justify-between text-lime">
                  <span>Desconto PIX estimado</span>
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
              A Factory enviará o código PIX ou o link de cartão na conversa.
            </p>
          </footer>
        )}
      </aside>
    </>
  )
}
