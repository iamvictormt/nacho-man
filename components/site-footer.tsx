import Link from "next/link"
import { STORE_WHATSAPP_NUMBER, buildWhatsAppUrl } from "@/lib/whatsapp"

const productLinks = [
  { label: "Carnes", href: "/produtos?category=Carnes" },
  { label: "Molhos", href: "/produtos?category=Molhos" },
  { label: "Bases", href: "/produtos?category=Kits" },
  { label: "Congelados", href: "/produtos?category=CONGELADO" },
]

const structureLinks = [
  { label: "Produção terceirizada", href: "/#estrutura" },
  { label: "Armazenagem", href: "/#armazenagem" },
  { label: "Locação de Câmara Fria", href: "/#armazenagem" },
  { label: "Desenvolvimento de Receitas", href: "/#estrutura" },
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
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <FooterLinkGroup
            title="Atendimento Comercial"
            className="md:col-span-2"
            links={[
              { label: `WhatsApp ${whatsappDisplay}`, href: whatsappUrl, external: true },
              { label: "Horário SEG A SEX das 7h às 12h - 13h às 17h30", href: null },
              {
                label: "E-mail factory.administrativo@nachomanbrasil.com.br",
                href: "mailto:factory.administrativo@nachomanbrasil.com.br",
              },
            ]}
          />
          <FooterLinkGroup title="Produtos" links={productLinks} className="md:col-span-1" />
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
  className = "",
}: {
  title: string
  links: { label: string; href: string | null; external?: boolean }[]
  className?: string
}) {
  return (
    <div className={className}>
      <h3 className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-lime">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((item) => (
          <li key={`${title}-${item.label}`}>
            <FooterItem item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterItem({
  item,
}: {
  item: { label: string; href: string | null; external?: boolean }
}) {
  const className =
    "inline-flex min-h-8 items-center text-sm font-semibold text-muted-foreground transition-colors hover:text-lime"

  if (!item.href) {
    return <span className="inline-flex min-h-8 items-center text-sm font-semibold text-muted-foreground">{item.label}</span>
  }

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  )
}
