import type { ReactNode } from "react"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  align?: "left" | "center"
  action?: ReactNode
}) {
  const centered = align === "center"

  return (
    <div
      className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${
        centered ? "md:block md:text-center" : ""
      }`}
    >
      <div className={centered ? "mx-auto max-w-3xl" : "max-w-3xl"}>
        <p
          className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-lime ${
            centered ? "justify-center" : ""
          }`}
        >
          <span className="h-px w-8 bg-lime/70" aria-hidden="true" />
          {eyebrow}
          {centered && <span className="h-px w-8 bg-lime/70" aria-hidden="true" />}
        </p>
        <h2 className="mt-4 text-3xl font-black uppercase leading-[1.05] tracking-[-0.035em] text-foreground md:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className={centered ? "mt-8" : "shrink-0"}>{action}</div>}
    </div>
  )
}
