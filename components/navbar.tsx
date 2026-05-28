"use client"

import { ShoppingCart, Menu, X } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useCartStore } from "@/lib/cart-store"

const navLinks = [
  { label: "SHOP", href: "/shop" },
  { label: "CONGELADOS", href: "/congelados" },
  { label: "MOLHOS", href: "/molhos" },
  { label: "COMBOS", href: "/combos" },
  { label: "SOBRE", href: "/sobre" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { totalItems, openCart } = useCartStore()
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/30">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-10">
        {/* Mobile menu button */}
        <button
          className="lg:hidden text-foreground hover:text-lime transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop Nav - Left */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <a
                key={link.label}
                href={link.href}
                className={`text-xs font-bold tracking-[0.15em] transition-colors duration-200 ${
                  isActive
                    ? "text-lime"
                    : "text-foreground/80 hover:text-lime"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="block h-0.5 w-full bg-lime rounded-full mt-1" />
                )}
              </a>
            )
          })}
        </div>

        {/* Logo - Center */}
        <a href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <img src="/nacho-man-logo-amarelo.svg" alt="NachoMan" className="h-16 w-auto" />
        </a>

        {/* Cart - Right */}
        <div className="flex items-center">
          <button
            onClick={openCart}
            className="relative text-foreground/80 hover:text-lime transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-lime text-background text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-background border-t border-border/30 px-6 py-6 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <a
                key={link.label}
                href={link.href}
                className={`block py-3 text-lg font-black tracking-wide border-b border-border/20 transition-colors ${
                  isActive
                    ? "text-lime"
                    : "text-foreground hover:text-lime"
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </div>
      )}
    </nav>
  )
}
