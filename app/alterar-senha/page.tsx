import type { Metadata } from "next"
import { requirePasswordChangeUser } from "@/lib/auth"
import { ForcedPasswordForm } from "./forced-password-form"

export const metadata: Metadata = {
  title: "Alterar senha",
  robots: { index: false, follow: false },
}

export default async function ForcedPasswordChangePage() {
  const user = await requirePasswordChangeUser()

  return (
    <main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-graphite p-6 shadow-2xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Troca obrigatória</p>
        <h1 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em]">Crie uma nova senha</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Olá, {user.name}. Sua senha foi redefinida pelo administrador. Para continuar, cadastre uma nova senha de
          acesso.
        </p>
        <ForcedPasswordForm />
      </section>
    </main>
  )
}
