"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type MarketplaceCartItem = {
  id: string
  type: "PRODUCT" | "COMBO"
  name: string
  image?: string | null
  unit: string
  packageLabel: string
  unitPriceInCents: number
  minimumQuantity: number
  quantity: number
}

type MarketplaceCart = {
  items: MarketplaceCartItem[]
  open: boolean
  add: (item: Omit<MarketplaceCartItem, "quantity">) => void
  remove: (id: string, type: MarketplaceCartItem["type"]) => void
  setQuantity: (id: string, type: MarketplaceCartItem["type"], quantity: number) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
}

export const useMarketplaceCart = create<MarketplaceCart>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (item) =>
        set((state) => {
          const existing = state.items.find((current) => current.id === item.id && current.type === item.type)
          if (existing) {
            return {
              open: true,
              items: state.items.map((current) =>
                current.id === item.id && current.type === item.type
                  ? { ...current, quantity: current.quantity + current.minimumQuantity }
                  : current
              ),
            }
          }
          return { open: true, items: [...state.items, { ...item, quantity: item.minimumQuantity }] }
        }),
      remove: (id, type) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id || item.type !== type) })),
      setQuantity: (id, type, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.type === type
              ? { ...item, quantity: Math.max(item.minimumQuantity, Math.min(999, quantity)) }
              : item
          ),
        })),
      clear: () => set({ items: [] }),
      openCart: () => set({ open: true }),
      closeCart: () => set({ open: false }),
    }),
    {
      name: "nacho-factory-marketplace-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)
