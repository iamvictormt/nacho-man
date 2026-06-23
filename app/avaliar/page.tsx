"use client"

import { FormEvent, useState } from "react"
import { ArrowRight, Check, CircleQuestionMark, ExternalLink, Mail, MessageCircle, Star, UserRound } from "lucide-react"

const GOOGLE_REVIEW_URL =
  process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
  "https://search.google.com/local/writereview?placeid=ChIJjXYai88f35QRj3G-JsWCS0w"

const CONSENT_TEXT =
  "Aceito receber novidades, lançamentos e promoções da Nacho Factory pelo WhatsApp ou e-mail. Posso cancelar a qualquer momento."

function formatContact(value: string) {
  if (/[a-z@]/i.test(value)) return value.trimStart()

  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function isValidContact(value: string) {
  if (value.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const digits = value.replace(/\D/g, "")
  return digits.length === 10 || digits.length === 11
}

export default function AvaliarPage() {
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!name.trim() || !contact.trim()) {
      setError("Preencha seu nome e WhatsApp ou e-mail para continuar.")
      return
    }

    if (!isValidContact(contact.trim())) {
      setError("Digite um WhatsApp com DDD ou um e-mail válido.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          marketingConsent,
          consentText: marketingConsent ? CONSENT_TEXT : null,
        }),
      })

      if (!response.ok) throw new Error("Request failed")

      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setError("Não foi possível salvar seu contato. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-7rem)] overflow-hidden bg-[#0a0a0a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-16 h-80 w-80 rounded-full bg-purple-medium/20 blur-[100px]" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-lime/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:22px_22px]" />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[0.85fr_1.15fr] md:px-8 md:py-16">
        <div className="relative hidden md:block">
          <p className="inline-flex items-center gap-3 rounded-full border border-lime/25 bg-background/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-lime backdrop-blur">
            <CircleQuestionMark className="h-4 w-4" aria-hidden="true" />
            Sua opinião importa
          </p>

          <h1 className="mt-7 max-w-xl text-5xl font-black leading-[0.96] tracking-[-0.04em] text-white lg:text-7xl">
            Curtiu?
            <span className="mt-2 block text-lime">Conta pra gente.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-white/55">
            Leva menos de um minuto. Seus dados nos ajudam a manter você por perto, e sua avaliação ajuda outras pessoas
            a conhecerem nosso trabalho.
          </p>

          <div className="relative mt-10 max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-lime" />

            <div className="flex items-start gap-4">
              <div>
                <div className="flex gap-1" aria-label="Cinco estrelas">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-lime text-lime" aria-hidden="true" />
                  ))}
                </div>

                <p className="mt-3 text-lg font-black leading-snug text-white">
                  Obrigado por fortalecer
                  <span className="block text-lime">a Nacho Factory.</span>
                </p>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  Cada avaliação ajuda nosso trabalho a chegar mais longe.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="mb-7 text-center md:hidden">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-lime">
              Sua opinião importa
            </div>
            <h1 className="text-4xl font-black leading-none tracking-tight text-white">
              Curtiu? <span className="text-lime">Conta pra gente.</span>
            </h1>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#141414]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="mb-7">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Passo 1 de 2</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Vamos nos conhecer?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Preencha os dados abaixo para continuar para o Google.
                  </p>
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-white/80">Seu nome</span>
                    <span className="relative block">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Como podemos chamar você?"
                        autoComplete="name"
                        className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-base text-white placeholder:text-white/25 transition focus:border-lime/60 focus:bg-white/[0.06] focus:outline-none"
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-white/80">WhatsApp ou e-mail</span>
                    <span className="relative block">
                      {contact.includes("@") ? (
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      ) : (
                        <MessageCircle className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      )}
                      <input
                        type="text"
                        value={contact}
                        onChange={(event) => setContact(formatContact(event.target.value))}
                        placeholder="(47) 99999-9999 ou seu@email.com"
                        autoComplete={contact.includes("@") ? "email" : "tel"}
                        inputMode={contact.includes("@") ? "email" : "tel"}
                        maxLength={contact.includes("@") ? 180 : 15}
                        className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-base text-white placeholder:text-white/25 transition focus:border-lime/60 focus:bg-white/[0.06] focus:outline-none"
                      />
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-white/15">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(event) => setMarketingConsent(event.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/25 bg-black/20 text-transparent transition peer-checked:border-lime peer-checked:bg-lime peer-checked:text-black peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                    <span className="text-xs leading-5 text-white/50">{CONSENT_TEXT}</span>
                  </label>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-lime px-5 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:bg-white active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting ? "Salvando..." : "Salvar e continuar"}
                  {!isSubmitting && <ArrowRight className="h-5 w-5" />}
                </button>
              </form>
            ) : (
              <div className="p-6 text-center sm:p-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-lime text-black shadow-[0_0_40px_rgba(239,255,13,0.2)]">
                  <Check className="h-10 w-10 stroke-[3]" />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-purple-300">Passo 2 de 2</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                  Valeu, {name.trim().split(" ")[0]}!
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">
                  Agora conte no Google como foi sua experiência com a{" "}
                  <strong className="font-bold text-white/75">Nacho Man Franchising e Factory</strong>. Sua avaliação é
                  publicada diretamente por você.
                </p>

                <a
                  href={GOOGLE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-lime px-5 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:bg-white active:scale-[0.99]"
                >
                  Avaliar no Google
                  <ExternalLink className="h-4 w-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 text-xs font-bold text-white/40 transition hover:text-white"
                >
                  Voltar ao formulário
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
