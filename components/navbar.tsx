"use client"

import { ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"
import type { MouseEvent } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useCartStore } from "@/lib/cart-store"

const HOME_NAV_SECTIONS = ["inicio", "sobre", "contato"] as const

const navLinks = [
  { label: "INÍCIO", href: "/#inicio" },
  { label: "PRODUTOS", href: "/produtos" },
  { label: "SOBRE", href: "/#sobre" },
  { label: "CONTATO", href: "/#contato" },
]

const SECTION_OVERLAP = 28

function getNavbarMainHeight() {
  const navbarMain = document.querySelector<HTMLElement>("[data-site-navbar-main]")
  return navbarMain?.getBoundingClientRect().height ?? 88
}

function scrollToHomeSection(hash: string) {
  const target = document.getElementById(hash.replace(/^#/, ""))
  if (!target) return

  const targetTop = target.getBoundingClientRect().top + window.scrollY
  const viewportTop = Math.max(0, getNavbarMainHeight() - SECTION_OVERLAP)

  window.scrollTo({
    top: Math.max(0, targetTop - viewportTop),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  })
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeHomeSection, setActiveHomeSection] = useState<(typeof HOME_NAV_SECTIONS)[number]>("inicio")
  const pathname = usePathname()
  const { totalItems, openCart } = useCartStore()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function closeMobileMenu() {
      setMobileOpen(false)
    }

    window.addEventListener("nacho-close-mobile-menu", closeMobileMenu)
    return () => window.removeEventListener("nacho-close-mobile-menu", closeMobileMenu)
  }, [])

  useEffect(() => {
    if (pathname !== "/") return

    function updateActiveSection() {
      const navbar = document.querySelector<HTMLElement>("[data-site-navbar]")
      const navbarMain = document.querySelector<HTMLElement>("[data-site-navbar-main]")
      const viewportAnchor =
        window.scrollY +
        (navbarMain?.getBoundingClientRect().height ?? navbar?.getBoundingClientRect().height ?? 0) +
        24

      let currentSection: (typeof HOME_NAV_SECTIONS)[number] = "inicio"

      for (const section of HOME_NAV_SECTIONS) {
        const element = document.getElementById(section)
        if (!element) continue

        const sectionTop = element.getBoundingClientRect().top + window.scrollY
        if (sectionTop <= viewportAnchor) {
          currentSection = section
        }
      }

      setActiveHomeSection(currentSection)
    }

    updateActiveSection()
    window.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)
    window.addEventListener("hashchange", updateActiveSection)

    return () => {
      window.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
      window.removeEventListener("hashchange", updateActiveSection)
    }
  }, [pathname])

  const isLinkActive = (href: string) => {
    if (href === "/produtos") return pathname === href || pathname.startsWith("/produto/")
    if (pathname !== "/") return false

    return href === `/#${activeHomeSection}`
  }

  const handleNavLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const url = new URL(href, window.location.origin)

    if (url.hash.length <= 1 || url.pathname !== window.location.pathname || url.search !== window.location.search) {
      setMobileOpen(false)
      return
    }

    event.preventDefault()
    event.stopPropagation()

    setMobileOpen(false)

    const currentUrl = `${url.pathname}${url.search}${url.hash}`
    if (window.location.pathname + window.location.search + window.location.hash !== currentUrl) {
      window.history.pushState(null, "", currentUrl)
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    }

    window.setTimeout(() => scrollToHomeSection(url.hash), mobileOpen ? 360 : 0)
  }

  return (
    <nav data-site-navbar className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border">
      <div data-site-navbar-main className="mx-auto max-w-7xl flex items-center justify-between px-4 h-22">
        {/* Logo */}
        <Link href="/#inicio" className="flex items-center">
          <img
            src="/nacho-man-logo.png"
            alt="NachoMan"
            className="h-14 md:h-18 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.href)
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={(event) => handleNavLinkClick(event, link.href)}
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
              </Link>
            )
          })}
        </div>

        {/* CTA + Cart */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={openCart}
            className="relative h-11 w-11 flex items-center justify-center text-foreground/70 hover:text-lime transition-colors"
            aria-label="Abrir carrinho"
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
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={openCart}
            className="relative h-11 w-11 flex items-center justify-center text-foreground/70 hover:text-lime transition-colors"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {mounted && totalItems() > 0 && (
              <span className="absolute top-1 right-1 bg-lime text-background text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </button>
          <button
            className="relative h-11 w-11 flex flex-col items-center justify-center gap-[5px] text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-background border-t border-border px-6 py-6 space-y-1">
          {navLinks.map((link, index) => {
            const isActive = isLinkActive(link.href)
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={(event) => handleNavLinkClick(event, link.href)}
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
