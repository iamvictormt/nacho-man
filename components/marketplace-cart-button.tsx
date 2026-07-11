"use client"

import { useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import { useMarketplaceCart } from "@/lib/marketplace-cart-store"

export function MarketplaceCartButton() {
  const items = useMarketplaceCart((state) => state.items)
  const load = useMarketplaceCart((state) => state.load)
  const loaded = useMarketplaceCart((state) => state.loaded)
  const openCart = useMarketplaceCart((state) => state.openCart)
  const count = items.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    if (!loaded) void load()
  }, [load, loaded])

  return (
    <button
      onClick={openCart}
      className="fixed bottom-5 right-5 z-30 flex h-14 items-center justify-center gap-3 rounded-full bg-lime px-5 text-xs font-black text-background shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)] active:scale-[0.98] sm:px-5 md:px-5"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="hidden sm:inline">CARRINHO</span>
      {count > 0 && <span className="rounded-full bg-background px-2 py-1 text-[10px] text-lime">{count}</span>}
    </button>
  )
}
