import Link from "next/link"
import {
  ArrowRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
} from "lucide-react"
import { STORE_WHATSAPP_NUMBER, buildWhatsAppUrl } from "@/lib/whatsapp"

const shopLinks = [
  { label: "Todos os produtos", href: "/produtos" },
  { label: "Congelados", href: "/produtos?category=CONGELADO" },
  { label: "Molhos e temperos", href: "/produtos?category=SECO" },
  { label: "Combos", href: "/combos" },
]

const companyLinks = [
  { label: "Início", href: "/" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
]

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/nachoman",
    icon: Instagram,
  },
  {
    label: "Facebook",
    href: "https://facebook.com/nachoman",
    icon: Facebook,
  },
]

function formatWhatsAppDisplay(number: string): string {
  const local = number.replace(/^55/, "")
  const ddd = local.slice(0, 2)
  const first = local.slice(2, 3)
  const middle = local.slice(3, 7)
  const last = local.slice(7, 11)
  return `(${ddd}) ${first} ${middle}-${last}`
}

export function SiteFooter() {
  const year = new Date().getFullYear()
  const whatsappDisplay = formatWhatsAppDisplay(STORE_WHATSAPP_NUMBER)
  const whatsappUrl = buildWhatsAppUrl(
    STORE_WHATSAPP_NUMBER,
    "Olá! Vim pelo site da Nacho Man e gostaria de atendimento."
  )

  return (
    <footer className="relative overflow-hidden border-t border-border bg-graphite">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/estrelas-roxo.svg"
          alt=""
          className="absolute right-[8%] top-10 h-9 w-9 opacity-15 animate-float-2"
          aria-hidden="true"
        />
        <img
          src="/pimenta-roxo.svg"
          alt=""
          className="absolute bottom-20 left-[6%] h-10 w-10 opacity-10 animate-float-4"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-14">
        <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-background/35 p-6 md:p-7">
            <Link href="/" className="inline-flex">
              <img
                src="/nacho-man-logo-roxo-inteira.svg"
                alt="Nacho Man"
                className="h-28 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Mexican food pronta para abastecer sua cozinha: congelados, molhos,
              temperos e combos com compra simples e finalização pelo WhatsApp.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-foreground/5 text-muted-foreground transition-all hover:border-lime hover:bg-lime hover:text-background"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-lime/25 bg-lime p-6 text-background md:p-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background/10">
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-background/70">
              Atendimento comercial
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Precisa montar um pedido?
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-background/75">
              Envie sua lista, tire dúvidas ou finalize o carrinho com nosso time.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-background px-5 py-3 text-sm font-black tracking-wider text-lime transition-all hover:shadow-[0_0_20px_rgba(10,10,10,0.2)]"
              aria-label="Iniciar atendimento pelo WhatsApp"
            >
              CHAMAR NO WHATSAPP
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 border-t border-border/60 pt-9 md:grid-cols-2 lg:grid-cols-12">
          <FooterLinkGroup title="Comprar" links={shopLinks} className="lg:col-span-4" />
          <FooterLinkGroup title="Nacho Man" links={companyLinks} className="lg:col-span-4" />

          <div className="lg:col-span-4">
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-purple-medium">
              Pedido online
            </h3>
            <div className="rounded-2xl border border-border bg-background/35 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lime/25 bg-lime/10">
                  <ShoppingBag className="h-5 w-5 text-lime" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">Carrinho + WhatsApp</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Adicione itens e envie o resumo completo para o atendimento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground/70 md:flex-row md:items-center md:justify-between">
          <p>© {year} Nacho Man. Todos os direitos reservados.</p>
          <p className="font-semibold text-muted-foreground/60">
            Congelados, molhos, temperos e combos mexicanos.
          </p>
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
  links: { label: string; href: string }[]
  className?: string
}) {
  return (
    <div className={className}>
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-purple-medium">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex min-h-8 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-lime"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ContactLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/35">
        <Icon className="h-4 w-4 text-lime" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
