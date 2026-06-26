"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Factory,
  Gift,
  LogOut,
  Menu,
  MessageCircle,
  PackageSearch,
  ReceiptText,
  Store,
  Tags,
  UserRound,
  X,
} from "lucide-react"
import { logoutAction } from "@/app/login/actions"
import { LogoutSubmitButton } from "@/components/logout-submit-button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Toaster } from "sonner"

type PrivateShellProps = {
  children: React.ReactNode
  area: "admin" | "marketplace"
  userName: string
  organizationName?: string
}

export function PrivateShell({ children, area, userName, organizationName }: PrivateShellProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const admin = area === "admin"
  const homeHref = admin ? "/admin" : "/marketplace"
  const links = admin
    ? [
        { href: "/admin", label: "Visão geral", icon: Factory, exact: true },
        { href: "/admin/produtos", label: "Produtos", icon: PackageSearch },
        { href: "/admin/combos", label: "Combos", icon: Gift },
        { href: "/admin/campanhas", label: "Promoções", icon: Tags },
        { href: "/admin/franqueados", label: "Franqueados", icon: Store },
        { href: "/admin/pedidos", label: "Pedidos", icon: ReceiptText },
      ]
    : [
        { href: "/marketplace", label: "Início", icon: Store, exact: true },
        { href: "/marketplace/produtos", label: "Produtos", icon: PackageSearch, activePrefix: "/marketplace/produto" },
        { href: "/marketplace/combos", label: "Combos", icon: Gift },
        { href: "/marketplace/pedidos", label: "Meus pedidos", icon: ReceiptText },
      ]

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="relative mx-auto grid h-18 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:h-22 sm:gap-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 transition hover:border-lime/40 hover:text-lime xl:hidden"
              aria-label="Abrir menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href={homeHref} className="hidden shrink-0 xl:block">
              <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-12 w-auto sm:h-14 md:h-18" />
            </Link>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 xl:hidden">
            <Link href={homeHref} className="pointer-events-auto">
              <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-12 w-auto sm:h-14" />
            </Link>
          </div>

          <nav className="hidden items-center justify-center gap-5 xl:flex">
            {links.map(({ href, label, exact, activePrefix }) => {
              const active = exact ? pathname === href : pathname.startsWith(activePrefix ?? href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-3 text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${
                    active ? "text-lime" : "text-foreground/65 hover:text-lime"
                  }`}
                >
                  {label}
                  {active && <span className="absolute inset-x-0 bottom-1 h-0.5 rounded-full bg-lime" />}
                </Link>
              )
            })}
          </nav>

          <div className="col-start-3 flex items-center justify-self-end gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-2 lg:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-purple-medium/30 bg-purple-medium/10">
                <UserRound className="h-3.5 w-3.5 text-purple-medium" />
              </span>
              <div className="max-w-28 2xl:max-w-36">
                <p className="truncate text-[9px] font-black uppercase text-foreground">{userName}</p>
                <p className="truncate text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                  {organizationName ?? (admin ? "Administrador" : "Franqueado")}
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground/70 transition hover:border-lime/40 hover:text-lime"
                  aria-label="Sair"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[calc(100%-1rem)] border-border bg-background p-5 sm:max-w-md sm:p-6">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black uppercase">Sair da conta?</AlertDialogTitle>
                  <AlertDialogDescription className="leading-6">
                    Você será desconectado do painel atual.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <form action={logoutAction}>
                    <LogoutSubmitButton />
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[80] xl:hidden ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          aria-label="Fechar menu"
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[min(82vw,330px)] flex-col border-r border-border bg-background shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-18 items-center justify-between border-b border-border px-4">
            <Link href={homeHref} className="shrink-0">
              <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-11 w-auto" />
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground/70 transition hover:border-lime/40 hover:text-lime"
              aria-label="Fechar menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-graphite p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-purple-medium/30 bg-purple-medium/10">
                <UserRound className="h-4 w-4 text-purple-medium" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase text-foreground">{userName}</p>
                <p className="truncate text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {organizationName ?? (admin ? "Administrador" : "Franqueado")}
                </p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {links.map(({ href, label, icon: Icon, exact, activePrefix }) => {
              const active = exact ? pathname === href : pathname.startsWith(activePrefix ?? href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 text-[10px] font-black uppercase tracking-wider transition ${
                    active
                      ? "border-lime/30 bg-lime text-background"
                      : "border-transparent text-foreground/65 hover:border-border hover:bg-graphite hover:text-lime"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </aside>
      </div>

      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[5%] top-20 h-64 w-64 rounded-full bg-purple-medium/5 blur-[100px]" />
          <div className="absolute left-[10%] top-[45%] h-48 w-48 rounded-full bg-lime/[0.025] blur-[90px]" />
        </div>
        <div className="relative">{children}</div>
      </div>

      <footer className="border-t border-border bg-graphite">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src="/nacho-man-logo.png" alt="" className="h-10 w-auto opacity-80" />
            <div className="border-l border-border pl-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground">Nacho Factory</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Portal exclusivo da rede Nacho Man</p>
            </div>
          </div>
          <a
            href="https://wa.me/554797269146"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-foreground/65 hover:text-lime"
          >
            <MessageCircle className="h-4 w-4 text-lime" />
            Precisa de ajuda?
          </a>
        </div>
      </footer>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </div>
  )
}
