import Image from "next/image"
import { BadgeCheck, ClipboardCheck, Factory, MapPin, PackageCheck } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"

const highlights = [
  "Produção de molhos, empanados e proteínas prontas",
  "Armazenagem refrigerada e congelada para terceiros",
  "Processos padronizados e controle de qualidade",
  "Segurança alimentar e rastreabilidade total",
]

const proof = [
  { value: "15t+", label: "produzidas por mês" },
  { value: "30+", label: "clientes recorrentes" },
  { value: "30+", label: "unidades abastecidas" },
  { value: "700m²", label: "de estrutura" },
]

const gallery = [
  {
    image: "/tacho-industrial.webp",
    label: "Produção",
    alt: "Tacho industrial utilizado na produção de alimentos",
    icon: Factory,
  },
  {
    image: "/carne.webp",
    label: "Processos",
    alt: "Equipe realizando a preparação padronizada dos produtos",
    icon: ClipboardCheck,
  },
  {
    image: "/embalagens.webp",
    label: "Expedição",
    alt: "Produtos embalados e organizados para expedição",
    icon: PackageCheck,
  },
]

const storageStats = [
  { value: "−18°C", label: "Congelados" },
  { value: "0–5°C", label: "Refrigerados" },
  { value: "24/7", label: "Monitoramento" },
]

export function HomeAboutSection() {
  return (
    <section id="sobre" className="bg-background">
      <div className="border-b border-border py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow="Quem somos"
            title={
              <>
                Uma indústria feita para o seu negócio <span className="text-lime">crescer</span>
              </>
            }
            description="A Nacho Factory nasceu para abastecer a Rede Nacho Man e evoluiu para uma indústria especializada em alimentos congelados para restaurantes, cafeterias, dark kitchens e marcas próprias."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative min-h-[480px] overflow-hidden rounded-2xl border border-border group">
              <Image
                src="/local-nacho-factory.webp"
                alt="Fachada da fábrica Nacho Factory em Blumenau"
                fill
                sizes="(max-width: 1023px) 100vw, 55vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 backdrop-blur">
                <MapPin className="h-4 w-4 text-lime" aria-hidden="true" />
                <span className="text-[11px] font-black uppercase tracking-wider text-foreground">Blumenau — SC</span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-border bg-graphite p-7 md:p-9">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-medium">Estrutura própria</p>
                <h3 className="mt-4 text-2xl font-black uppercase leading-tight text-foreground md:text-3xl">
                  Produzir, congelar e armazenar em um só lugar
                </h3>
                <p className="mt-5 text-sm leading-7 text-muted-foreground md:text-base">
                  Capacidade para pequenos e grandes volumes, com controle em cada etapa da operação.
                </p>
              </div>
              <ul className="mt-9 space-y-4">
                {highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 border-t border-border/70 pt-4 text-sm text-foreground/85"
                  >
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-graphite md:grid-cols-4">
            {proof.map((item) => (
              <div key={item.label} className="border-b border-r border-border p-6 md:border-b-0">
                <p className="text-3xl font-black text-lime md:text-4xl">{item.value}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="estrutura" className="border-b border-border bg-graphite py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow="Nossa estrutura"
            title="Conheça a fábrica"
            description="Equipamentos, processos e ambientes preparados para garantir produtividade, padronização e segurança."
          />
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {gallery.map((item) => {
              const Icon = item.icon

              return (
                <article
                  key={item.image}
                  className="group overflow-hidden rounded-2xl border border-border bg-background"
                >
                  <div className="relative h-[440px] overflow-hidden md:h-[520px] xl:h-[600px]">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 767px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                  </div>
                  <div className="flex items-center gap-4 p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime/20 bg-lime/10">
                      <Icon className="h-5 w-5 text-lime" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-black uppercase tracking-wider text-foreground">{item.label}</h3>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>

      <div id="armazenagem" className="border-b border-border py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Armazenagem refrigerada"
              title={
                <>
                  Controle total de <span className="text-lime">temperatura</span>
                </>
              }
              description="Estrutura completa para armazenagem de produtos de terceiros com segurança, rastreabilidade e monitoramento contínuo."
            />
            <div className="mt-10 grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-graphite">
              {storageStats.map((item) => (
                <div key={item.label} className="border-r border-border p-5 text-center last:border-r-0">
                  <p className="text-xl font-black text-lime md:text-2xl">{item.value}</p>
                  <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-border group">
            <Image
              src="/camara-fria.webp"
              alt="Interior da câmara fria da Nacho Factory"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
