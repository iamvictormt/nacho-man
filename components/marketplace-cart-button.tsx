"use client"

import { ShoppingCart } from "lucide-react"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"

export function MarketplaceCartButton() {
  const items = useMarketplaceCart((state) => state.items)
  const openCart = useMarketplaceCart((state) => state.openCart)
  const count = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <button
      onClick={openCart}
      className="fixed bottom-5 right-5 z-30 flex h-14 items-center gap-3 rounded-full bg-lime px-5 text-xs font-black text-background shadow-2xl"
    >
      <ShoppingCart className="h-5 w-5" />
      CARRINHO
      {count > 0 && <span className="rounded-full bg-background px-2 py-1 text-[10px] text-lime">{count}</span>}
    </button>
  )
}
