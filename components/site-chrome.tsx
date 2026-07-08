"use client"

import { usePathname } from "next/navigation"
import { TopBar } from "@/components/top-bar"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"
import { HashScrollHandler } from "@/components/hash-scroll-handler"
import { ThemeProvider } from "@/components/theme-provider"

export function SiteChrome({ children, whatsappNumber }: { children: React.ReactNode; whatsappNumber: string }) {
  const pathname = usePathname()
  const authenticatedArea = pathname.startsWith("/admin") || pathname.startsWith("/marketplace")
  const privateArea = pathname === "/login" || authenticatedArea

  if (privateArea) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        forcedTheme={authenticatedArea ? undefined : "dark"}
        storageKey="nacho-private-theme"
      >
        {children}
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
      storageKey="nacho-private-theme"
    >
      <TopBar whatsappNumber={whatsappNumber} />
      <Navbar />
      <HashScrollHandler />
      <main>{children}</main>
      <SiteFooter whatsappNumber={whatsappNumber} />
      <CartDrawerWrapper whatsappNumber={whatsappNumber} />
    </ThemeProvider>
  )
}
