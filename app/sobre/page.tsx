import { PageHeader } from "@/components/page-header"
import {
  ArrowRight,
  ShieldCheck,
  ClipboardCheck,
  Users,
  Zap,
  MapPin,
} from "lucide-react"

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <PageHeader
        label="INSTITUCIONAL"
        title="QUEM É A NACHO FACTORY"
        description="Uma indústria especializada na produção de alimentos congelados para restaurantes, cafeterias, dark kitchens e marcas próprias."
        emoji="🏭"
      />

      {/* Diferenciais */}
      <section className="py-6 bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Alta Performance", sub: "Equipamentos modernos" },
              { icon: ClipboardCheck, title: "Padronização", sub: "Controle em cada etapa" },
              { icon: ShieldCheck, title: "Segurança", sub: "Rastreabilidade total" },
              { icon: Users, title: "Equipe Técnica", sub: "Profissionais especializados" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-4">
                <div className="h-10 w-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-lime" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground tracking-wider">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quem Somos */}
      <section className="py-20 relative overflow-hidden">
        {/* Decorative SVGs */}
        <img src="/caveira-roxo.svg" alt="" className="absolute top-12 right-8 h-14 w-14 opacity-15 animate-float-2 pointer-events-none" aria-hidden="true" />
        <img src="/pimenta-roxo.svg" alt="" className="absolute bottom-16 left-8 h-10 w-10 opacity-15 animate-float-4 pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-border">
              <img
                src="/local-nacho-factory.webp"
                alt="Fachada da fábrica Nacho Factory Alimentos em Blumenau, Santa Catarina"
                className="w-full h-auto md:h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border">
                <MapPin className="h-3 w-3 text-lime" />
                <span className="text-[10px] font-bold text-foreground tracking-wider">BLUMENAU - SC</span>
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-[10px] font-black tracking-[0.3em] text-lime">QUEM SOMOS</span>
              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                INDÚSTRIA DE ALIMENTOS<br />FEITA PARA O SEU NEGÓCIO<br /><span className="text-lime neon-glow">CRESCER.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A Nacho Factory Alimentos é uma indústria especializada na produção de alimentos congelados para restaurantes, cafeterias, dark kitchens e marcas próprias. Oferecemos também armazenagem refrigerada para produtos de terceiros.
              </p>
              <ul className="space-y-3">
                {[
                  "Produção de molhos, empanados e proteínas prontas",
                  "Armazenagem refrigerada e congelada para terceiros",
                  "Processos padronizados e controle de qualidade",
                  "Segurança alimentar e rastreabilidade total",
                  "Capacidade para pequenos e grandes volumes",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[8px] text-lime font-bold">✓</span>
                    </div>
                    <span className="text-sm text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Galeria da Fábrica */}
      <section className="py-20 bg-graphite border-y border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-medium/40 via-lime/20 to-purple-medium/40" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-medium/20 to-transparent" />
        <div className="absolute top-[20%] right-0 h-60 w-60 rounded-full bg-purple-medium/10 blur-[100px] pointer-events-none" />
        <img src="/maraca-roxo.svg" alt="" className="absolute top-[10%] right-[5%] h-10 w-10 opacity-15 animate-float-1 pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black tracking-[0.3em] text-lime">NOSSA ESTRUTURA</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mt-2">
              CONHEÇA A <span className="text-lime neon-glow">FÁBRICA</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { image: "/local-nacho-factory.webp", alt: "Vista externa da fábrica Nacho Factory com estrutura industrial moderna" },
              { image: "/camara-fria.webp", alt: "Câmara fria industrial com prateleiras de produtos congelados armazenados" },
              { image: "/produtos-congelados.webp", alt: "Produtos congelados embalados prontos para distribuição na linha de produção" },
              { image: "/molhos.webp", alt: "Linha de produção de molhos artesanais em recipientes industriais" },
              { image: "/estrutura.webp", alt: "Área de produção industrial com equipamentos de processamento de alimentos" },
              { image: "/embalagens.webp", alt: "Setor de embalagem com produtos sendo preparados para expedição" },
            ].map((item, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden border border-border hover:border-lime/30 transition-all duration-300 aspect-square">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Armazenagem Refrigerada */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-[10px] font-black tracking-[0.3em] text-lime">ARMAZENAGEM REFRIGERADA</span>

              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                CONTROLE TOTAL DE<br /><span className="text-lime neon-glow">TEMPERATURA</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Estrutura completa para armazenagem de produtos de terceiros com segurança, controle de temperatura e rastreabilidade. Câmaras frias modernas para manter a qualidade dos seus produtos com monitoramento contínuo 24 horas por dia.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-4">
                {[
                  { value: "−18°C", sub: "congelados" },
                  { value: "0~5°C", sub: "refrigerados" },
                  { value: "24/7", sub: "monitoramento" },
                ].map((item, i) => (
                  <div key={i} className="text-center p-4 rounded-2xl bg-graphite border border-border hover:border-lime/30 transition-colors">
                    <p className="text-xl font-black text-lime">{item.value}</p>
                    <p className="text-[9px] font-semibold text-muted-foreground tracking-wider mt-1">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-border">
              <img
                src="/camara-fria.webp"
                alt="Interior da câmara fria com sistema de refrigeração industrial e monitoramento de temperatura"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden bg-graphite border-t border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 h-60 w-60 rounded-full bg-purple-medium/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-purple-medium/10 blur-[80px]" />
        </div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-medium/40 via-lime/30 to-purple-medium/40" />

        <div className="relative mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
            MENOS PREOCUPAÇÃO COM PRODUÇÃO.<br />
            MAIS TEMPO PARA O QUE IMPORTA:<br />
            <span className="text-lime neon-glow italic">FAZER O SEU NEGÓCIO CRESCER.</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vamos produzir o próximo sucesso juntos? Fale com nosso time comercial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a href="/contato" className="group inline-flex items-center justify-center gap-3 bg-lime text-background px-8 py-4 rounded-full font-black text-sm tracking-wider hover:shadow-[0_0_30px_rgba(200,255,0,0.3)] transition-all duration-300">
              SOLICITAR ORÇAMENTO <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="https://wa.me/5547999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 border-2 border-purple-medium/40 text-foreground px-8 py-4 rounded-full font-bold text-sm tracking-wider hover:border-purple-medium hover:text-purple-medium transition-all duration-300">
              WHATSAPP
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
