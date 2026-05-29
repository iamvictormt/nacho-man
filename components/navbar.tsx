"use client"

import { ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useCartStore } from "@/lib/cart-store"

const navLinks = [
  { label: "INÍCIO", href: "/" },
  { label: "SOBRE", href: "/sobre" },
  { label: "PRODUTOS", href: "/produtos" },
  { label: "ARMAZENAGEM", href: "/combos" },
  { label: "CONTATO", href: "/contato" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { totalItems, openCart } = useCartStore()

  useEffect(() => { setMounted(true) }, [])

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border">
      {/* Subtle purple accent line at top */}
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-22">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img
            src="/nacho-man-logo-amarelo.svg"
            alt="NachoMan"
            className="h-12 md:h-18 w-auto"
          />
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <a
                key={link.label}
                href={link.href}
                className={`text-[11px] font-bold tracking-[0.1em] transition-colors duration-200 relative ${
                  isActive
                    ? "text-lime"
                    : "text-foreground/70 hover:text-lime"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-lime rounded-full" />
                )}
              </a>
            )
          })}
        </div>

        {/* CTA + Cart */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={openCart}
            className="relative text-foreground/70 hover:text-lime transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {mounted && totalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-lime text-background text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </button>
        </div>

        {/* Mobile cart + toggle */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            onClick={openCart}
            className="relative text-foreground/70 hover:text-lime transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {mounted && totalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-lime text-background text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </button>
          <button
            className="relative h-6 w-6 flex flex-col items-center justify-center gap-[5px] text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-400 ease-in-out ${
          mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-background border-t border-border px-6 py-6 space-y-1">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-3 text-lg font-black tracking-wide transition-all duration-300 ${
                  isActive ? "text-lime" : "text-foreground hover:text-lime"
                } ${mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}
                style={{ transitionDelay: mobileOpen ? `${index * 50}ms` : "0ms" }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
