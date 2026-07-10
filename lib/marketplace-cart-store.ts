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
  add: (item: Omit<MarketplaceCartItem, "quantity">) => void
  remove: (id: string, type: MarketplaceCartItem["type"], selectionKey?: string) => void
  setQuantity: (id: string, type: MarketplaceCartItem["type"], quantity: number, selectionKey?: string) => void
  clear: () => void
  setLastCheckout: (checkout: MarketplaceLastCheckout) => void
  clearLastCheckout: () => void
  openCart: () => void
  closeCart: () => void
}

export const useMarketplaceCart = create<MarketplaceCart>()(
  persist(
    (set) => ({
      items: [],
      lastCheckout: null,
      open: false,
      add: (item) =>
        set((state) => {
          const existing = state.items.find(
            (current) =>
              current.id === item.id && current.type === item.type && current.selectionKey === item.selectionKey
          )
          if (existing) {
            return {
              items: state.items.map((current) =>
                current.id === item.id && current.type === item.type && current.selectionKey === item.selectionKey
                  ? { ...current, quantity: current.quantity + current.minimumQuantity }
                  : current
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: item.minimumQuantity }] }
        }),
      remove: (id, type, selectionKey) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.id !== id || item.type !== type || item.selectionKey !== selectionKey
          ),
        })),
      setQuantity: (id, type, quantity, selectionKey) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.type === type && item.selectionKey === selectionKey
              ? { ...item, quantity: Math.max(item.minimumQuantity, Math.min(999, quantity)) }
              : item
          ),
        })),
      clear: () => set({ items: [] }),
      setLastCheckout: (checkout) => set({ lastCheckout: checkout }),
      clearLastCheckout: () => set({ lastCheckout: null }),
      openCart: () => set({ open: true }),
      closeCart: () => set({ open: false }),
    }),
    {
      name: "nacho-factory-marketplace-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, lastCheckout: state.lastCheckout }),
    }
  )
)
