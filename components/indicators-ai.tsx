"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BrainCircuit, Loader2, History, ArrowUpRight, Download, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AdminDatePicker } from "@/components/admin-form-fields"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { IndicatorsAiCosts } from "@/components/indicators-ai-costs"

type HistoryRow = { id: string; question: string; status: string; createdAt: string }
type Analysis = HistoryRow & {
  answer: string | null
  snapshot: {
    capturedAt?: string
    storeName?: string
    current?: {
      period: { start: string; end: string }
      summary: { records: number; orders: number; netInCents: number }
    }
    comparison?: { period: { start: string; end: string } }
  }
}
const suggestions = [
  "Compare o faturamento e o ticket médio entre os períodos selecionados.",
  "Quais produtos perderam participação entre os dois períodos?",
  "Quais lojas precisam de atenção e quais ações você sugere?",
]
const field =
  "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime disabled:opacity-50"
const dateLabel = (value: string) => value.split("-").reverse().join("/")

export function IndicatorsAi({
  initialStart,
  initialEnd,
  comparisonStart,
  comparisonEnd,
  selectedStore,
  stores,
  maxDate,
}: {
  initialStart: string
  initialEnd: string
  comparisonStart: string
  comparisonEnd: string
  selectedStore: string
  stores: { value: string; label: string }[]
  maxDate: string
}) {
  const [filters, setFilters] = useState({
    start: initialStart,
    end: initialEnd,
    comparisonStart,
    comparisonEnd,
    store: selectedStore,
  })
  const [question, setQuestion] = useState("")
  const [configured, setConfigured] = useState(false)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [busy, setBusy] = useState(false)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState("")
  const [creditError, setCreditError] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const questionRef = useRef<HTMLTextAreaElement>(null)

  const loadHistory = useCallback(
    async (signal?: AbortSignal) => {
      setLoadingHistory(true)
      setHistoryError("")
      try {
        const response = await fetch(`/api/indicadores/analysis?page=${page}`, { cache: "no-store", signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setHistory(data.analyses)
        setHasMore(data.hasMore)
        setConfigured(data.configured)
      } catch (err) {
        if (!signal?.aborted)
          setHistoryError(err instanceof Error ? err.message : "Não foi possível carregar o histórico.")
      } finally {
        if (!signal?.aborted) setLoadingHistory(false)
      }
    },
    [page]
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadHistory(controller.signal)
    return () => controller.abort()
  }, [loadHistory])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || opening) return
    setBusy(true)
    setError("")
    setAnalysis(null)
    try {
      const response = await fetch("/api/indicadores/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...filters, question }),
      })
      const data = await response.json()
      if (!response.ok) {
        setCreditError(data.code === "PROVIDER_CREDITS")
        throw new Error(data.error)
      }
      setCreditError(false)
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de conexão. Consulte o histórico antes de tentar novamente.")
    } finally {
      setBusy(false)
      if (page === 0) void loadHistory()
      else setPage(0)
    }
  }

  async function openAnalysis(id: string) {
    setOpening(true)
    setError("")
    try {
      const response = await fetch(`/api/indicadores/analysis?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir a análise.")
    } finally {
      setOpening(false)
    }
  }

  function download() {
    if (!analysis) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `analise-indicadores-${analysis.id}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="[--accent:var(--secondary)] [--accent-foreground:var(--lime)] mt-5 grid min-w-0 gap-4 sm:mt-6 sm:gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <Card className="@container min-w-0 gap-0 rounded-2xl border-border bg-graphite p-4 shadow-none sm:p-6">
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-xl border border-lime/20 bg-lime/10 p-2.5 sm:p-3">
              <BrainCircuit className="h-5 w-5 text-lime" />
            </span>
            <h2 className="min-w-0 text-base font-bold sm:text-lg">Análise dos indicadores</h2>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Pergunte sobre vendas, lojas, produtos e CMV. O Claude analisa os dois períodos abaixo e cada resposta fica
            salva com os dados consultados.
          </p>
          {!loadingHistory && !configured && !historyError ? (
            <p role="status" className="mt-4 rounded-xl border border-lime/20 bg-background/60 p-3 text-sm">
              A análise com IA aguarda ativação pelo administrador. Seu histórico continua disponível.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-lime/25 bg-lime/10 text-lime">
              Vendas e desempenho
            </Badge>
            <Badge variant="outline">Comparação de períodos</Badge>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-5 border-t border-border pt-6">
            <fieldset disabled={busy} className="grid gap-4">
              <label className="grid gap-2 text-xs font-bold">
                Loja
                <Select
                  disabled={busy}
                  value={filters.store}
                  onValueChange={(store) => setFilters({ ...filters, store })}
                >
                  <SelectTrigger aria-label="Loja" className={field}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="[--accent:var(--secondary)] [--accent-foreground:var(--lime)]">
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.value} value={store.value}>
                        {store.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <div className="grid min-w-0 gap-4 @min-[640px]:grid-cols-2">
                {(
                  [
                    { title: "Período da análise", start: "start", end: "end" },
                    { title: "Comparar com", start: "comparisonStart", end: "comparisonEnd" },
                  ] as const
                ).map((period) => (
                  <fieldset key={period.start} className="min-w-0 rounded-xl border border-border p-3">
                    <legend className="px-1 text-xs font-bold text-lime">{period.title}</legend>
                    <div className="grid min-w-0 gap-3 @min-[360px]:grid-cols-2">
                      {(
                        [
                          { key: period.start, label: "Início" },
                          { key: period.end, label: "Fim" },
                        ] as const
                      ).map(({ key, label }) => (
                        <AdminDatePicker
                          key={key}
                          name={`ai-${key}`}
                          label={label}
                          ariaLabel={`${period.title}: ${label}`}
                          popoverClassName="[--accent:var(--secondary)] [--accent-foreground:var(--lime)]"
                          className="min-w-0"
                          required
                          disabled={busy}
                          maxDate={maxDate}
                          defaultValue={filters[key]}
                          valueFormat="iso"
                          onValueChange={(value) => setFilters((current) => ({ ...current, [key]: value }))}
                        />
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Até 366 dias por período. A disponibilidade depende dos dados importados da Saipos.
              </p>
              <div className="grid min-w-0 gap-2 @min-[640px]:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <Button
                    variant="ghost"
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuestion(suggestion)
                      questionRef.current?.focus()
                    }}
                    className="h-auto min-h-11 min-w-0 w-full whitespace-normal justify-between rounded-xl border border-border bg-background px-3 py-3 text-left text-xs text-muted-foreground transition hover:border-lime/40 hover:text-foreground"
                  >
                    <span className="min-w-0 break-words">{suggestion}</span>
                    <ArrowUpRight className="ml-1 inline h-3 w-3" />
                  </Button>
                ))}
              </div>
              <label htmlFor="ai-question" className="grid gap-2 text-sm font-bold">
                O que você quer entender?
                <Textarea
                  id="ai-question"
                  ref={questionRef}
                  className={`${field} min-h-32 resize-y font-normal text-base sm:text-sm`}
                  minLength={8}
                  maxLength={2000}
                  required
                  placeholder="Ex.: O que mudou no faturamento e quais pontos merecem atenção?"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
              </label>
            </fieldset>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Cada pergunta inicia uma análise independente. {question.length}/2000
              </p>
              <Button
                variant="ghost"
                disabled={!configured || busy || opening || question.trim().length < 8}
                type="submit"
                className="inline-flex h-auto min-h-11 w-full whitespace-normal items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-black sm:w-auto transition hover:bg-lime-dark hover:text-black dark:hover:bg-lime-dark dark:hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                {busy ? "Analisando os indicadores…" : "Gerar análise"}
              </Button>
            </div>
          </form>
        </Card>
        <div aria-live="polite" aria-busy={busy || opening}>
          {error ? (
            <Alert variant="destructive" className="mb-4 border-red-500/30 bg-red-500/10">
              <AlertCircle />
              <AlertTitle>Não foi possível gerar a análise</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {busy ? (
            <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
              Consultando os dados e preparando a resposta. Isso pode levar cerca de um minuto.
            </p>
          ) : null}
          {opening ? <p className="text-sm text-muted-foreground">Abrindo análise…</p> : null}
          {analysis ? (
            <article className="min-w-0 rounded-2xl border border-border bg-graphite p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 w-full">
                  <p className="text-xs font-bold uppercase tracking-wider text-lime">
                    Análise salva · {new Date(analysis.createdAt).toLocaleString("pt-BR")}
                  </p>
                  <h3 className="mt-3 break-words text-lg font-bold">{analysis.question}</h3>
                </div>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={download}
                  className="inline-flex h-auto min-h-11 w-full whitespace-normal items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Baixar dados e resposta
                </Button>
              </div>
              {analysis.snapshot.current ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {analysis.snapshot.storeName} · {dateLabel(analysis.snapshot.current.period.start)} a{" "}
                  {dateLabel(analysis.snapshot.current.period.end)}
                  {analysis.snapshot.comparison
                    ? ` · Comparação: ${dateLabel(analysis.snapshot.comparison.period.start)} a ${dateLabel(analysis.snapshot.comparison.period.end)}`
                    : ""}
                  <br />
                  Base consultada: {analysis.snapshot.current.summary.records} registros ·{" "}
                  {analysis.snapshot.current.summary.orders} pedidos válidos ·{" "}
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    analysis.snapshot.current.summary.netInCents / 100
                  )}{" "}
                  de faturamento líquido.
                </p>
              ) : null}
              <div className="mt-5 whitespace-pre-wrap break-words border-t border-border pt-5 text-sm leading-7">
                {analysis.answer ??
                  (analysis.status === "failed"
                    ? "Esta análise não foi concluída. Você pode gerar uma nova pergunta com os filtros desejados."
                    : "Esta solicitação está em processamento ou foi interrompida. Atualize o histórico para verificar.")}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Resposta gerada por IA a partir de um retrato dos dados. Confira os valores antes de tomar decisões.
              </p>
            </article>
          ) : !busy && !error ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Selecione os períodos e faça uma pergunta, ou abra uma análise do histórico.
            </div>
          ) : null}
        </div>
      </div>
      <aside className="grid min-w-0 items-start gap-4 md:grid-cols-2 2xl:grid-cols-1 sm:gap-5">
        <IndicatorsAiCosts creditError={creditError} />
        <Card className="min-w-0 gap-0 rounded-2xl border-border bg-graphite p-4 shadow-none sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <History className="h-4 w-4 text-lime" />
              Meu histórico
            </h2>
            <Button
              variant="ghost"
              type="button"
              disabled={loadingHistory || busy}
              onClick={() => void loadHistory()}
              className="min-h-10 text-xs text-lime disabled:opacity-40"
            >
              Atualizar
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Suas perguntas e respostas, em todos os períodos.</p>
          {historyError ? (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {historyError}
            </p>
          ) : null}
          {loadingHistory ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando histórico…</p>
          ) : !history.length && !historyError ? (
            <p className="mt-5 text-sm text-muted-foreground">Suas análises aparecerão aqui.</p>
          ) : null}
          <div className="mt-4 grid gap-2">
            {history.map((row) => (
              <Button
                variant="ghost"
                type="button"
                key={row.id}
                disabled={busy || opening}
                onClick={() => void openAnalysis(row.id)}
                className={`h-auto whitespace-normal items-start flex-col rounded-xl border p-3 text-left transition disabled:opacity-50 ${analysis?.id === row.id ? "border-lime/40 bg-lime/10" : "border-border hover:border-lime/30"}`}
              >
                <span className="line-clamp-3 break-words text-sm">{row.question}</span>
                <span className="mt-2 block text-[11px] text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString("pt-BR")} ·{" "}
                  {row.status === "completed"
                    ? "Concluída"
                    : row.status === "failed"
                      ? "Não concluída"
                      : Date.now() - Date.parse(row.createdAt) > 180000
                        ? "Interrompida"
                        : "Em andamento"}
                </span>
              </Button>
            ))}
          </div>
          {page > 0 || hasMore ? (
            <div className="mt-4 flex justify-between text-xs">
              <Button
                variant="ghost"
                disabled={page === 0 || loadingHistory}
                onClick={() => setPage(page - 1)}
                className="min-h-10 disabled:opacity-40"
              >
                Anterior
              </Button>
              <span className="self-center">Página {page + 1}</span>
              <Button
                variant="ghost"
                disabled={!hasMore || loadingHistory}
                onClick={() => setPage(page + 1)}
                className="min-h-10 disabled:opacity-40"
              >
                Próxima
              </Button>
            </div>
          ) : null}
        </Card>
      </aside>
    </div>
  )
}
