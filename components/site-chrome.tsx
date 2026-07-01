"use client"

import { usePathname } from "next/navigation"
import { TopBar } from "@/components/top-bar"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"
import { HashScrollHandler } from "@/components/hash-scroll-handler"

export function SiteChrome({ children, whatsappNumber }: { children: React.ReactNode; whatsappNumber: string }) {
  const pathname = usePathname()
  const privateArea = pathname === "/login" || pathname.startsWith("/admin") || pathname.startsWith("/marketplace")

  if (privateArea) return children

  return (
    <>
      <TopBar whatsappNumber={whatsappNumber} />
      <Navbar />
      <HashScrollHandler />
      <main>{children}</main>
      <SiteFooter whatsappNumber={whatsappNumber} />
      <CartDrawerWrapper whatsappNumber={whatsappNumber} />
    </>
  )
}
