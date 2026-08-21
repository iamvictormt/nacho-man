import { BarChart3, LoaderCircle } from "lucide-react"
import { PrivatePageHeader } from "@/components/private-page-header"

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-background/70 ${className}`} />
}

export default function SaiposLoading() {
  return (
    <main>
      <PrivatePageHeader
        eyebrow="Indicadores Saipos"
        title={
          <>
            Carregando <span className="text-lime neon-glow">indicadores.</span>
          </>
        }
        description="Montando o painel com vendas, unidades, canais, clientes e comparativos da base local."
        icon={BarChart3}
      >
        <span className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-lime/30 px-7 text-xs font-black uppercase tracking-wider text-lime">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Carregando
        </span>
      </PrivatePageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <section className="rounded-2xl border border-border bg-graphite p-4 md:p-5">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBox key={index} className="h-10 w-24" />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto]">
            <SkeletonBox className="h-12" />
            <SkeletonBox className="h-12" />
            <SkeletonBox className="h-12" />
            <SkeletonBox className="h-12 w-32" />
          </div>
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <article className="rounded-2xl border border-border bg-graphite p-5 md:p-7">
            <SkeletonBox className="h-5 w-32" />
            <SkeletonBox className="mt-4 h-8 w-72" />
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBox key={index} className="h-28" />
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-border bg-graphite p-5 md:p-7">
            <SkeletonBox className="h-5 w-28" />
            <SkeletonBox className="mt-5 h-12 w-44" />
            <SkeletonBox className="mt-7 h-28" />
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
          <SkeletonBox className="h-[420px] rounded-2xl" />
          <SkeletonBox className="h-[420px] rounded-2xl" />
        </section>
      </div>
    </main>
  )
}
