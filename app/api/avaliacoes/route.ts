import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type CachedLead = {
  id: string
  name: string
  contact: string
  marketingConsent: boolean
  consentText: string | null
  createdAt: string
}

declare global {
  var nachoFactoryFeedbackLeads: CachedLead[] | undefined
}

const leads = globalThis.nachoFactoryFeedbackLeads ?? []
globalThis.nachoFactoryFeedbackLeads = leads

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const contact = typeof body.contact === "string" ? body.contact.trim() : ""
    const marketingConsent = body.marketingConsent === true
    const consentText = marketingConsent && typeof body.consentText === "string" ? body.consentText : null

    if (!name || !contact) {
      return NextResponse.json({ error: "Nome e contato são obrigatórios." }, { status: 400 })
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    const phoneDigits = contact.replace(/\D/g, "")
    const isPhone = phoneDigits.length === 10 || phoneDigits.length === 11

    if (!isEmail && !isPhone) {
      return NextResponse.json({ error: "Informe um WhatsApp com DDD ou um e-mail válido." }, { status: 400 })
    }

    const lead: CachedLead = {
      id: crypto.randomUUID(),
      name: name.slice(0, 120),
      contact: contact.slice(0, 180),
      marketingConsent,
      consentText,
      createdAt: new Date().toISOString(),
    }

    leads.push(lead)
    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar o contato." }, { status: 500 })
  }
}
