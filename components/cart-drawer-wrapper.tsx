"use client"

import { CartDrawer } from "@/components/cart-drawer"

export function CartDrawerWrapper({ whatsappNumber }: { whatsappNumber: string }) {
  return <CartDrawer whatsappNumber={whatsappNumber} />
}
