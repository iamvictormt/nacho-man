"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface CartItem {
  name: string
  price: number
  quantity: number
  image: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (name: string) => void
  updateQuantity: (name: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

// Custom storage that uses cookies with 1 year expiration
const cookieStorage = {
  getItem: (name: string): string | null => {
    if (typeof document === "undefined") return null
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
    if (match) {
      try {
        return decodeURIComponent(match[2])
      } catch {
        return null
      }
    }
    return null
  },
  setItem: (name: string, value: string): void => {
    if (typeof document === "undefined") return
    // 365 days expiration
    const maxAge = 365 * 24 * 60 * 60
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`
  },
  removeItem: (name: string): void => {
    if (typeof document === "undefined") return
    document.cookie = `${name}=;path=/;max-age=0`
  },
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        // Reject silently if item has no name or no valid price
        if (!item.name.trim() || !Number.isFinite(item.price) || item.price < 0) return

        set((state) => {
          const existing = state.items.find((i) => i.name === item.name)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.name === item.name
                  ? { ...i, quantity: Math.min(i.quantity + 1, 99) }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
      },

      removeItem: (name) => {
        set((state) => ({
          items: state.items.filter((i) => i.name !== name),
        }))
      },

      updateQuantity: (name, quantity) => {
        // Treat values <= 0 as removal
        if (quantity <= 0) {
          get().removeItem(name)
          return
        }
        // Clamp quantity to max 99
        const clamped = Math.min(quantity, 99)
        set((state) => ({
          items: state.items.map((i) =>
            i.name === name ? { ...i, quantity: clamped } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: "nachoman-cart",
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({ items: state.items }), // only persist items, not isOpen
    }
  )
)
