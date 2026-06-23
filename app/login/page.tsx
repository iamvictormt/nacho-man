import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Acesso ao Marketplace",
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/marketplace")

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-border lg:block">
        <Image src="/embalagens-3.webp" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/35 to-background/90" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-12 pt-40">
          <p className="text-xs font-black uppercase tracking-[.2em] text-lime">Nacho Factory</p>
          <h1 className="mt-4 max-w-xl text-5xl font-black uppercase leading-[.95]">
            Abastecimento exclusivo para a rede Nacho Man.
          </h1>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-20 w-auto" />
          <p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-purple-medium">
            Marketplace de franqueados
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase">Acesse sua unidade</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Entre para consultar preços, promoções, montar pedidos e falar com a Nacho Factory.
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-graphite p-6">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  )
}
