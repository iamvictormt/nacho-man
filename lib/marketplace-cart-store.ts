"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type MarketplaceCartItem = {
  id: string
  type: "PRODUCT" | "COMBO"
  selectionKey?: string
  name: string
  image?: string | null
  unit: string
  packageLabel: string
  unitPriceInCents: number
  minimumQuantity: number
  quantity: number
  selectedOptions?: {
    productId: string
    name: string
    quantity: number
  }[]
}

export type MarketplaceLastCheckout = {
  orderNumber: string
  whatsappUrl: string
  createdAt: string
}

type MarketplaceCart = {
  items: MarketplaceCartItem[]
  lastCheckout: MarketplaceLastCheckout | null
  open: boolean
  loading: boolean
  loaded: boolean
  load: () => Promise<void>
  add: (item: Omit<MarketplaceCartItem, "quantity"> & { quantity?: number }) => Promise<void>
  remove: (id: string, type: MarketplaceCartItem["type"], selectionKey?: string) => Promise<void>
  setQuantity: (
    id: string,
    type: MarketplaceCartItem["type"],
    quantity: number,
    selectionKey?: string
  ) => Promise<void>
  clear: () => Promise<void>
  setLastCheckout: (checkout: MarketplaceLastCheckout) => void
  clearLastCheckout: () => void
  openCart: () => void
  closeCart: () => void
}

async function syncCart(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>
): Promise<MarketplaceCartItem[]> {
  const response = await fetch("/api/marketplace/carrinho", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = (await response.json()) as { items?: MarketplaceCartItem[]; error?: string }

  if (!response.ok) {
    throw new Error(result.error ?? "Nao foi possivel sincronizar o carrinho.")
  }

  return result.items ?? []
}

export const useMarketplaceCart = create<MarketplaceCart>()(
  persist(
    (set, get) => ({
      items: [],
      lastCheckout: null,
      open: false,
      loading: false,
      loaded: false,
      load: async () => {
        if (get().loading) return

        set({ loading: true })
        try {
          set({ items: await syncCart("GET"), loaded: true })
        } finally {
          set({ loading: false })
        }
      },
      add: async (item) => {
        const quantity = Math.max(item.minimumQuantity, Math.min(999, item.quantity ?? item.minimumQuantity))
        set({ items: await syncCart("POST", { ...item, quantity }), loaded: true })
      },
      remove: async (id, type, selectionKey) => {
        set({ items: await syncCart("DELETE", { id, type, selectionKey }), loaded: true })
      },
      setQuantity: async (id, type, quantity, selectionKey) => {
        set({
          items: await syncCart("PATCH", {
            id,
            type,
            quantity: Math.max(1, Math.min(999, quantity)),
            selectionKey,
          }),
          loaded: true,
        })
      },
      clear: async () => {
        set({ items: await syncCart("DELETE", { clear: true }), loaded: true })
      },
      setLastCheckout: (checkout) => set({ lastCheckout: checkout }),
      clearLastCheckout: () => set({ lastCheckout: null }),
      openCart: () => set({ open: true }),
      closeCart: () => set({ open: false }),
    }),
    {
      name: "nacho-factory-marketplace-cart-meta",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lastCheckout: state.lastCheckout }),
    }
  )
)
