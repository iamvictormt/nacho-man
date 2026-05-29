import Link from "next/link"
import { Mail, MessageCircle, Phone } from "lucide-react"
import { STORE_WHATSAPP_NUMBER, buildWhatsAppUrl } from "@/lib/whatsapp"

const productLinks = [
  { label: "Carnes", href: "/produtos?category=Carnes" },
  { label: "Molhos", href: "/produtos?category=Molhos" },
  { label: "Bases", href: "/produtos?category=Kits" },
  { label: "Congelados", href: "/produtos?category=CONGELADO" },
]

const structureLinks = [
  { label: "Produção terceirizada", href: "/sobre#estrutura" },
  { label: "Armazenagem", href: "/sobre#armazenagem" },
  { label: "Locação de Câmara Fria", href: "/sobre#armazenagem" },
  { label: "Desenvolvimento de Receitas", href: "/sobre#estrutura" },
]

function formatWhatsAppDisplay(number: string): string {
  const local = number.replace(/^55/, "")
  const ddd = local.slice(0, 2)
  const subscriber = local.slice(2)
  const first = subscriber.slice(0, Math.max(4, subscriber.length - 4))
  const last = subscriber.slice(-4)
  return `+55 ${ddd} ${first}-${last}`
}

export function SiteFooter() {
  const year = new Date().getFullYear()
  const whatsappDisplay = formatWhatsAppDisplay(STORE_WHATSAPP_NUMBER)
  const whatsappUrl = buildWhatsAppUrl(
    STORE_WHATSAPP_NUMBER,
    "Olá! Vim pelo site da Nacho Factory e gostaria de atendimento comercial."
  )

  return (
    <footer className="border-t border-border bg-graphite">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex">
              <img
                src="/nacho-man-logo-roxo-inteira.svg"
                alt="Nacho Man"
                className="h-24 w-auto"
              />
            </Link>

            <div className="mt-8">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-lime">
                Atendimento Comercial
              </h2>
              <div className="mt-5 space-y-3 text-sm font-semibold leading-relaxed text-muted-foreground">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors hover:text-lime"
                >
                  <Phone className="h-4 w-4 text-lime" aria-hidden="true" />
                  WhatsApp {whatsappDisplay}
                </a>
                <p>Horário SEG A SEX das 7h às 12h - 13h as 17h30</p>
                <a
                  href="mailto:factory.administrativo@nachomanbrasil.com.br"
                  className="flex items-center gap-3 transition-colors hover:text-lime"
                >
                  <Mail className="h-4 w-4 text-lime" aria-hidden="true" />
                  E-mail factory.administrativo@nachomanbrasil.com.br
                </a>
              </div>
            </div>
          </div>

          <FooterLinkGroup title="Produtos" links={productLinks} />
          <FooterLinkGroup title="Estrutura" links={structureLinks} />
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-xs font-semibold text-muted-foreground/70">
          © {year} Nacho Man. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-lime">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((item) => (
          <li key={`${title}-${item.label}`}>
            <Link
              href={item.href}
              className="inline-flex min-h-8 items-center text-sm font-semibold text-muted-foreground transition-colors hover:text-lime"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
