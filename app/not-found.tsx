import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-graphite p-6 shadow-[0_24px_90px_rgba(0,0,0,.35)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Nacho Factory</p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-4xl">Página não encontrada</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          O endereço acessado não existe ou não está disponível neste painel.
        </p>
        <Button asChild className="mt-6 rounded-full bg-lime px-5 font-black text-background hover:bg-lime/90">
          <Link href="/">Voltar para o início</Link>
        </Button>
      </section>
    </main>
  )
}
