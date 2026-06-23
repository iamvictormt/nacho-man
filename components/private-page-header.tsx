import Image from "next/image"
import type { LucideIcon } from "lucide-react"

export function PrivatePageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  icon?: LucideIcon
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-graphite py-14 md:py-18">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-purple-medium/50 via-lime/40 to-purple-medium/50" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[8%] top-0 h-56 w-56 rounded-full bg-purple-medium/15 blur-[90px]" />
        <div className="absolute bottom-0 left-[18%] h-36 w-36 rounded-full bg-lime/5 blur-[70px]" />
        <Image
          src="/estrelas-roxo.svg"
          alt=""
          width={38}
          height={38}
          className="absolute right-[7%] top-[20%] opacity-20 animate-float-1"
        />
        <Image
          src="/pimenta-roxo.svg"
          alt=""
          width={30}
          height={30}
          className="absolute bottom-[16%] right-[18%] opacity-15 animate-float-3"
        />
      </div>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-lime">
            {Icon && (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-lime/25 bg-lime/10">
                <Icon className="h-4 w-4" />
              </span>
            )}
            {eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-black uppercase leading-[0.98] tracking-[-0.04em] text-foreground md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">{description}</p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </section>
  )
}
