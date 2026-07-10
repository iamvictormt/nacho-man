import Link from "next/link"
import { buildWhatsAppUrl, formatWhatsAppDisplay } from "@/lib/whatsapp"

const structureLinks = [
  { label: "Produção terceirizada", href: "/#estrutura" },
  { label: "Armazenagem", href: "/#armazenagem" },
  { label: "Locação de câmara fria", href: "/#armazenagem" },
  { label: "Desenvolvimento de receitas", href: "/#estrutura" },
]

export function SiteFooter({ whatsappNumber }: { whatsappNumber: string }) {
  const year = new Date().getFullYear()
  const whatsappDisplay = formatWhatsAppDisplay(whatsappNumber)
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    "Olá! Vim pelo site da Nacho Factory e gostaria de atendimento comercial."
  )

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <FooterLinkGroup
            title="Atendimento Comercial"
            className="md:col-span-2"
            links={[
              { label: `WhatsApp ${whatsappDisplay}`, href: whatsappUrl, external: true },
              { label: "Horário: seg. a sex., das 7h às 12h e das 13h às 17h30", href: null },
              {
                label: "Pedidos da Factory: pedidos@nachofactory.com.br",
                href: "mailto:pedidos@nachofactory.com.br",
              },
              {
                label: "Administrativo/Financeiro: adm@nachofactory.com.br",
                href: "mailto:adm@nachofactory.com.br",
              },
            ]}
          />
          <FooterLinkGroup title="Estrutura" links={structureLinks} />
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-xs font-semibold text-muted-foreground/70">
          © {year} Nacho Factory. Todos os direitos reservados.
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
      <h3 className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-lime">{title}</h3>
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

function FooterItem({ item }: { item: { label: string; href: string | null; external?: boolean } }) {
  const className =
    "inline-flex min-h-8 items-center text-sm font-semibold text-muted-foreground transition-colors hover:text-lime"

  if (!item.href) {
    return (
      <span className="inline-flex min-h-8 items-center text-sm font-semibold text-muted-foreground">{item.label}</span>
    )
  }

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
      </a>
    )
  }

  if (item.href.startsWith("/#")) {
    return (
      <a href={item.href} className={className}>
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
