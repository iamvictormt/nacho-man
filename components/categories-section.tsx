"use client"

const categories = [
  { name: "CONGELADOS", icon: "/burrito-pegando-fogo-roxo.svg", count: 10 },
  { name: "MOLHOS", icon: "/molho-roxo.svg", count: 12 },
  { name: "TEMPEROS", icon: "/pimenta-roxo.svg", count: 5 },
  { name: "KITS", icon: "/cinturao-coracao-roxo.svg", count: 2 },
  { name: "DOCES", icon: "/coracao-pegando-fogo-roxo.svg", count: 3 },
  { name: "FOOD SERVICE", icon: "/capa-lutador-roxo.svg", count: 6 },
]

export function CategoriesSection() {
  return (
    <section className="py-12 bg-graphite border-y border-border/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
            CATEGORIAS
          </h2>
          <a href="/shop" className="text-xs font-bold tracking-wider text-lime hover:underline">
            VER TODAS →
          </a>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat, i) => (
            <a
              key={i}
              href="#"
              className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-background/50 border border-border/30 hover:border-lime/40 hover:bg-lime/5 transition-all duration-300"
            >
              <img
                src={cat.icon}
                alt=""
                className="h-14 w-14 opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
                aria-hidden="true"
              />
              <span className="text-[10px] font-black text-foreground tracking-wider text-center">
                {cat.name}
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground">
                {cat.count} itens
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
