import { LoaderCircle } from "lucide-react"

export default function AdminLoading() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-lime/20 bg-lime/10">
        <LoaderCircle className="h-7 w-7 animate-spin text-lime" />
      </span>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-foreground">Carregando dados</p>
      <p className="mt-2 text-xs text-muted-foreground">Aguarde só um instante.</p>
    </div>
  )
}
