"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { LoginForm, type LoginMode } from "@/components/login-form"
import type { LoginSideContent } from "@/lib/site-settings"

export function LoginExperience({ sideContent }: { sideContent: LoginSideContent }) {
  const [mode, setMode] = useState<LoginMode>("login")
  const content = sideContent[mode]

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-border lg:block">
        <Image key={content.image} src={content.image} alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/35 to-background/90" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-12 pt-40">
          <p className="text-xs font-black uppercase tracking-[.2em] text-lime">{content.eyebrow}</p>
          <h1 className="mt-4 max-w-xl text-5xl font-black uppercase leading-[.95]">{content.title}</h1>
          <p className="mt-5 max-w-md text-sm font-semibold leading-6 text-foreground/75">{content.description}</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-muted-foreground transition hover:text-lime"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
          <img src="/nacho-man-logo.png" alt="Nacho Man" className="h-20 w-auto" />
          <h2 className="mt-3 text-3xl font-black uppercase">Acesse sua conta</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Entre, crie seu cadastro ou recupere sua senha para continuar.
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-graphite p-6">
            <LoginForm mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>
    </main>
  )
}

