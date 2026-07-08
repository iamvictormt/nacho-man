"use client"

import { CheckCircle2, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, X } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { formatPrice } from "@/lib/format"
import { generateWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp"
import { useEffect, useRef, useState, useCallback } from "react"
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"

export function CartDrawer({ whatsappNumber }: { whatsappNumber: string }) {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCartStore()

  // Controls the animated state (delayed close for exit animation)
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [popupBlockedMessage, setPopupBlockedMessage] = useState(false)

  // Refs for focus management
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const titleId = "cart-drawer-title"

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (isOpen) {
      // Store the element that triggered the drawer open
      triggerRef.current = document.activeElement
      setVisible(true)
      setPopupBlockedMessage(false)
      // Small delay to trigger enter animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true)
          // Focus the close button after animation starts
          closeButtonRef.current?.focus()
        })
      })
    } else {
      setAnimating(false)
      // Restore focus to the element that triggered the drawer
      if (triggerRef.current && triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
      }
      const timeout = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  // Handle Escape key to close drawer
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeCart()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closeCart])

  // Focus trap: cycle Tab within the drawer
  const handleFocusTrap = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return

    const drawer = drawerRef.current
    if (!drawer) return

    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }, [])

  function handleWhatsAppCheckout() {
    if (items.length === 0) return

    const message = generateWhatsAppMessage(items)
    const url = buildWhatsAppUrl(whatsappNumber, message)

    const newWindow = window.open(url, "_blank")

    if (newWindow === null) {
      // Popup was blocked — keep items in cart, show message
      setPopupBlockedMessage(true)
    } else {
      // Success — clear cart and close drawer
      clearCart()
      closeCart()
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleFocusTrap}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border/30 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          animating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/20">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-lime" />
            <h2 id={titleId} className="text-lg font-black text-foreground tracking-tight">
              CARRINHO
            </h2>
            <span className="text-xs font-bold text-muted-foreground">
              ({totalItems()} {totalItems() === 1 ? "item" : "itens"})
            </span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            className="h-11 w-11 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/70 hover:bg-foreground/10 transition-colors"
            aria-label="Fechar carrinho"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="relative h-32 w-32 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center">
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
                className="min-h-11 px-4 text-xs font-black text-lime tracking-wider hover:underline"
              >
                VER PRODUTOS
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.name}
                className={`transition-all duration-300 ${animating ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
                style={{ transitionDelay: animating ? `${100 + index * 60}ms` : "0ms" }}
              >
                <CartItemCard
                  item={item}
                  onRemove={() => removeItem(item.name)}
                  onUpdateQuantity={(qty) => updateQuantity(item.name, qty)}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer - hidden when cart is empty */}
        {items.length > 0 && (
          <div
            className={`border-t border-border/20 p-5 space-y-4 transition-all duration-300 ${
              animating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: animating ? "200ms" : "0ms" }}
          >
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground">
                TOTAL DO CARRINHO ({totalItems()} {totalItems() === 1 ? "item" : "itens"})
              </span>
              <span className="text-2xl font-black text-lime">{formatPrice(totalPrice())}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border/50 bg-graphite/70 p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold leading-none text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-lime" />
                <span>Sem pagamento online: a equipe comercial confirma disponibilidade e condições pelo WhatsApp.</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold leading-none text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-lime" />
                <span>Os itens, as quantidades e o valor estimado já vêm organizados na mensagem.</span>
              </div>
            </div>

            {/* Popup blocked message */}
            {popupBlockedMessage && (
              <p className="text-xs text-center text-red-400 font-semibold">
                O redirecionamento foi bloqueado pelo navegador. Permita pop-ups ou{" "}
                <a
                  href={buildWhatsAppUrl(whatsappNumber, generateWhatsAppMessage(items))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-lime"
                >
                  clique aqui
                </a>{" "}
                para abrir o WhatsApp.
              </p>
            )}

            {/* WhatsApp CTA */}
            <button
              onClick={handleWhatsAppCheckout}
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white font-black text-sm tracking-wider py-4 rounded-full hover:scale-[1.02] transition-transform duration-300 shadow-lg"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              SOLICITAR ORÇAMENTO
            </button>

            <p className="text-[10px] text-center text-muted-foreground">
              Você será redirecionado para o WhatsApp para confirmar valores, pedido mínimo e prazo de entrega.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: { name: string; price: number; priceUnit?: "KG" | "UND" | "CX"; quantity: number; image: string }
  onRemove: () => void
  onUpdateQuantity: (qty: number) => void
}) {
  return (
    <div className="flex gap-4 p-3 rounded-xl bg-graphite border border-border/20 hover:border-purple-medium/30 transition-colors">
      {/* Image */}
      <div className="h-20 w-20 rounded-lg bg-background/50 shrink-0 overflow-hidden">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-foreground leading-tight truncate">{item.name}</h4>
          <button
            onClick={onRemove}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors shrink-0 -mr-2 -mt-2"
            aria-label={`Remover ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          {formatPrice(item.price)} / {item.priceUnit ?? "UND"}
        </p>

        <div className="flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="h-11 w-11 sm:h-8 sm:w-8 rounded-md bg-background/80 border border-border/30 flex items-center justify-center text-foreground/70 hover:border-lime/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border/30"
              aria-label={`Diminuir quantidade de ${item.name}`}
            >
              <Minus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              disabled={item.quantity >= 99}
              className="h-11 w-11 sm:h-8 sm:w-8 rounded-md bg-background/80 border border-border/30 flex items-center justify-center text-foreground/70 hover:border-lime/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border/30"
              aria-label={`Aumentar quantidade de ${item.name}`}
            >
              <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            </button>
          </div>

          {/* Subtotal */}
          <p className="text-sm font-black text-lime">{formatPrice(item.price * item.quantity)}</p>
        </div>
      </div>
    </div>
  )
}
