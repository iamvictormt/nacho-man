"use client"

import { Instagram, MapPin, Phone, Mail, ArrowRight } from "lucide-react"

const links = {
  services: [
    { label: "Produção de Congelados", href: "/produtos" },
    { label: "Molhos & Salsas", href: "/produtos" },
    { label: "Armazenagem Refrigerada", href: "/combos" },
    { label: "Marcas Próprias", href: "/contato" },
  ],
  segments: [
    { label: "Restaurantes", href: "/contato" },
    { label: "Hotéis & Resorts", href: "/contato" },
    { label: "Dark Kitchens", href: "/contato" },
    { label: "Redes de Fast Food", href: "/contato" },
    { label: "Food Service", href: "/contato" },
  ],
  institutional: [
    { label: "Sobre a NachoMan", href: "/sobre" },
    { label: "Contato", href: "/contato" },
    { label: "Política de Privacidade", href: "#" },
    { label: "Termos de Uso", href: "#" },
  ],
}

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-graphite border-t border-border relative">
      {/* Neon top line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />

      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="lg:col-span-4 space-y-5">
            <a href="/">
              <img src="/nacho-man-logo-roxo-inteira.svg" alt="NachoMan" className="h-32 w-auto" />
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mt-2">
              Indústria de alimentos para food service. Produção, molhos, empanados, proteínas prontas e armazenagem refrigerada.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-foreground/5 border border-border flex items-center justify-center text-muted-foreground hover:bg-lime hover:text-background hover:border-lime transition-all" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-foreground/5 border border-border flex items-center justify-center text-muted-foreground hover:bg-lime hover:text-background hover:border-lime transition-all" aria-label="TikTok">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52V6.94a4.84 4.84 0 01-1-.25z" /></svg>
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-foreground/5 border border-border flex items-center justify-center text-muted-foreground hover:bg-lime hover:text-background hover:border-lime transition-all" aria-label="YouTube">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-black text-purple-medium tracking-[0.2em] mb-4">SERVIÇOS</h4>
            <ul className="space-y-2.5">
              {links.services.map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="text-sm text-muted-foreground hover:text-lime transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Segments */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-black text-purple-medium tracking-[0.2em] mb-4">SEGMENTOS</h4>
            <ul className="space-y-2.5">
              {links.segments.map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="text-sm text-muted-foreground hover:text-lime transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-black text-purple-medium tracking-[0.2em] mb-4">INSTITUCIONAL</h4>
            <ul className="space-y-2.5">
              {links.institutional.map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="text-sm text-muted-foreground hover:text-lime transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-black text-purple-medium tracking-[0.2em] mb-4">FALE COMERCIAL</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-lime shrink-0" />
                <span>(47) 9 9999-9999</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-lime shrink-0" />
                <span>comercial@nachoman.com.br</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-lime shrink-0" />
                <span>Blumenau - SC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground/60">
            © {year} NachoMan Mexican Food. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
