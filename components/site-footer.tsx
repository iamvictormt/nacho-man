import { Instagram } from "lucide-react"

const links = {
  shop: [
    { label: "Congelados", href: "/congelados" },
    { label: "Molhos & Salsas", href: "/molhos" },
    { label: "Combos", href: "/combos" },
    { label: "Todos os Produtos", href: "/shop" },
  ],
  info: [
    { label: "Sobre a NachoMan", href: "/sobre" },
    { label: "Contato", href: "/contato" },
    { label: "Política de Privacidade", href: "#" },
    { label: "Trocas e Devoluções", href: "#" },
  ],
  help: [
    { label: "Como Comprar", href: "#" },
    { label: "Formas de Pagamento", href: "#" },
    { label: "Prazos de Entrega", href: "#" },
    { label: "Fale Conosco", href: "/contato" },
  ],
}

export function SiteFooter() {
  return (
    <footer className="bg-graphite border-t border-border/20">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <a href="/" className="flex items-center gap-3">
              <img src="/nacho-man-logo-amarelo.svg" alt="NachoMan" className="h-32 w-auto" />
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Indústria de alimentos para food service e marcas próprias.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="h-9 w-9 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/70 hover:bg-lime hover:text-background transition-all" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/70 hover:bg-lime hover:text-background transition-all" aria-label="TikTok">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52V6.94a4.84 4.84 0 01-1-.25z" />
                </svg>
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/70 hover:bg-lime hover:text-background transition-all" aria-label="YouTube">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[10px] font-black text-foreground tracking-[0.2em] mb-4">SHOP</h4>
            <ul className="space-y-2.5">
              {links.shop.map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="text-sm text-muted-foreground hover:text-lime transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-[10px] font-black text-foreground tracking-[0.2em] mb-4">INSTITUCIONAL</h4>
            <ul className="space-y-2.5">
              {links.info.map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="text-sm text-muted-foreground hover:text-lime transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-[10px] font-black text-foreground tracking-[0.2em] mb-4">AJUDA</h4>
            <ul className="space-y-2.5">
              {links.help.map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="text-sm text-muted-foreground hover:text-lime transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/20 space-y-6">
          {/* Payment methods */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-[10px] font-black text-foreground/50 tracking-[0.2em]">FORMAS DE PAGAMENTO</span>
            <div className="flex gap-2">
              {["PIX", "VISA", "MASTERCARD", "ELO", "BOLETO"].map((m, i) => (
                <div key={i} className="h-8 px-3.5 bg-foreground/[0.04] border border-border/30 rounded-lg flex items-center justify-center hover:border-lime/20 transition-colors">
                  <span className="text-[9px] font-bold text-foreground/50">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seals */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-lime/10 flex items-center justify-center">
                <span className="text-[8px] text-lime">✓</span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">Segurança Alimentar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-lime/10 flex items-center justify-center">
                <span className="text-[8px] text-lime">✓</span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">Produção com Responsabilidade</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-lime/10 flex items-center justify-center">
                <span className="text-[8px] text-lime">✓</span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">Rastreabilidade Total</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-muted-foreground/60">
              © 2025 Nacho Factory Alimentos · Blumenau, SC · Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
