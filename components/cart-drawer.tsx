"use client"

import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"

const WHATSAPP_NUMBER = "5562985329181"

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice, clearCart } =
    useCartStore()

  if (!isOpen) return null

  const formattedTotal = totalPrice().toFixed(2).replace(".", ",")

  function handleWhatsAppCheckout() {
    if (items.length === 0) return

    const itemsList = items
      .map(
        (item, i) =>
          `${i + 1}. ${item.name} — Qtd: ${item.quantity} — R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}`
      )
      .join("\n")

    const message = `🌮 *Novo Pedido — NachoMan*\n\n${itemsList}\n\n💰 *Total: R$ ${formattedTotal}*\n\nOlá! Gostaria de finalizar esse pedido.`

    const encoded = encodeURIComponent(message)
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`

    window.open(url, "_blank")
    clearCart()
    closeCart()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border/30 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/20">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-lime" />
            <h2 className="text-lg font-black text-foreground tracking-tight">
              CARRINHO
            </h2>
            <span className="text-xs font-bold text-muted-foreground">
              ({totalItems()} {totalItems() === 1 ? "item" : "itens"})
            </span>
          </div>
          <button
            onClick={closeCart}
            className="h-9 w-9 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/70 hover:bg-foreground/10 transition-colors"
            aria-label="Fechar carrinho"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-foreground/5 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                Seu carrinho está vazio
              </p>
              <button
                onClick={closeCart}
                className="text-xs font-black text-lime tracking-wider hover:underline"
              >
                CONTINUAR COMPRANDO
              </button>
            </div>
          ) : (
            items.map((item) => (
              <CartItemCard
                key={item.name}
                item={item}
                onRemove={() => removeItem(item.name)}
                onUpdateQuantity={(qty) => updateQuantity(item.name, qty)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border/20 p-5 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground">TOTAL</span>
              <span className="text-2xl font-black text-lime">R$ {formattedTotal}</span>
            </div>

            {/* WhatsApp CTA */}
            <button
              onClick={handleWhatsAppCheckout}
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white font-black text-sm tracking-wider py-4 rounded-full hover:scale-[1.02] transition-transform duration-300 shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              FINALIZAR PELO WHATSAPP
            </button>

            <p className="text-[10px] text-center text-muted-foreground">
              Você será redirecionado para o WhatsApp para confirmar seu pedido.
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
  item: { name: string; price: number; quantity: number; image: string }
  onRemove: () => void
  onUpdateQuantity: (qty: number) => void
}) {
  const subtotal = (item.price * item.quantity).toFixed(2).replace(".", ",")

  return (
    <div className="flex gap-4 p-3 rounded-xl bg-graphite border border-border/20">
      {/* Image */}
      <div className="h-20 w-20 rounded-lg bg-background/50 flex items-center justify-center shrink-0 overflow-hidden">
        <img src={item.image} alt={item.name} className="h-16 w-16 object-contain" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-foreground leading-tight truncate">
            {item.name}
          </h4>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
            aria-label="Remover item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              className="h-7 w-7 rounded-md bg-background/80 border border-border/30 flex items-center justify-center text-foreground/70 hover:border-lime/50 transition-colors"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-foreground">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="h-7 w-7 rounded-md bg-background/80 border border-border/30 flex items-center justify-center text-foreground/70 hover:border-lime/50 transition-colors"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Subtotal */}
          <p className="text-sm font-black text-lime">R$ {subtotal}</p>
        </div>
      </div>
    </div>
  )
}
