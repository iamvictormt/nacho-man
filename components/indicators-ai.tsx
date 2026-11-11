"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { BrainCircuit, Loader2, History, ArrowUpRight, Download, AlertCircle, Minimize2, Maximize2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AdminDatePicker } from "@/components/admin-form-fields"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { IndicatorsAiCosts } from "@/components/indicators-ai-costs"

type HistoryRow = { id: string; question: string; status: string; createdAt: string }
type AiScreen = "conversation" | "detail" | "history"
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
  const [hasMore, setHasMore] = useState(false)
  const [allHistory, setAllHistory] = useState<HistoryRow[]>([])
  const [allPage, setAllPage] = useState(0)
  const [allHasMore, setAllHasMore] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)
  const [allHistoryError, setAllHistoryError] = useState("")
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [creditError, setCreditError] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysisMinimized, setAnalysisMinimized] = useState(false)
  const [screen, setScreen] = useState<AiScreen>("conversation")
  const [detailReturnScreen, setDetailReturnScreen] = useState<AiScreen>("conversation")
  const questionRef = useRef<HTMLTextAreaElement>(null)

  const loadHistory = useCallback(
    async (signal?: AbortSignal) => {
      setLoadingHistory(true)
      setHistoryError("")
      try {
        const response = await fetch("/api/indicadores/analysis?page=0", { cache: "no-store", signal })
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
    []
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadHistory(controller.signal)
    return () => controller.abort()
  }, [loadHistory])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    setAnalysis(null)
    setAnalysisMinimized(false)
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
      setAnalysisMinimized(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de conexão. Consulte o histórico antes de tentar novamente.")
    } finally {
      setBusy(false)
      void loadHistory()
    }
  }

  async function loadAllHistory(nextPage: number) {
    setLoadingAll(true)
    setAllHistoryError("")
    try {
      const response = await fetch(`/api/indicadores/analysis?page=${nextPage}`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setAllHistory(data.analyses)
      setAllHasMore(data.hasMore)
      setAllPage(nextPage)
    } catch (err) {
      setAllHistoryError(err instanceof Error ? err.message : "Não foi possível carregar as análises.")
    } finally {
      setLoadingAll(false)
    }
  }

  async function openAnalysis(id: string, returnScreen: AiScreen) {
    setError("")
    setDetailReturnScreen(returnScreen)
    try {
      const response = await fetch(`/api/indicadores/analysis?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setAnalysis(data.analysis)
      setAnalysisMinimized(false)
      setScreen("detail")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir a análise.")
    }
  }

  async function showAllHistory() {
    setScreen("history")
    await loadAllHistory(0)
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
    <div className={`[--accent:var(--secondary)] [--accent-foreground:var(--lime)] mt-5 grid min-w-0 gap-4 sm:mt-6 sm:gap-5 ${screen === "conversation" ? "2xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
      <div className="flex min-w-0 flex-col gap-5">
        {screen === "conversation" ? (
          <>
        <Card className="@container min-w-0 gap-0 rounded-2xl border-border bg-graphite p-4 shadow-none sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-xl border border-lime/20 bg-lime/10 p-2.5 sm:p-3">
                <BrainCircuit className="h-5 w-5 text-lime" />
              </span>
              <h2 className="min-w-0 text-base font-bold sm:text-lg">Conversa com IA</h2>
            </div>
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
                disabled={!configured || busy || question.trim().length < 8}
                type="submit"
                className="inline-flex h-auto min-h-11 w-full whitespace-normal items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-black sm:w-auto transition hover:bg-lime-dark hover:text-black dark:hover:bg-lime-dark dark:hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                {busy ? "Analisando os indicadores…" : "Gerar análise"}
              </Button>
            </div>
          </form>
        </Card>
        <div aria-live="polite" aria-busy={busy}>
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
          {analysis ? (
            <article className="min-w-0 rounded-2xl border border-border bg-graphite p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 w-full">
                  <p className="text-xs font-bold uppercase tracking-wider text-lime">
                    Análise salva · {new Date(analysis.createdAt).toLocaleString("pt-BR")}
                  </p>
                  <h3 className="mt-3 break-words text-lg font-bold">{analysis.question}</h3>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <Button
                    variant="ghost"
                    type="button"
                    aria-expanded={!analysisMinimized}
                    aria-controls={`analysis-content-${analysis.id}`}
                    onClick={() => setAnalysisMinimized((minimized) => !minimized)}
                    className="inline-flex h-auto min-h-11 flex-1 whitespace-normal items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs sm:flex-none"
                  >
                    {analysisMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    {analysisMinimized ? "Expandir análise" : "Minimizar"}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={download}
                    className="inline-flex h-auto min-h-11 flex-1 whitespace-normal items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs sm:flex-none"
                  >
                    <Download className="h-4 w-4" />
                    Baixar dados e resposta
                  </Button>
                </div>
              </div>
              {!analysisMinimized && analysis.snapshot.current ? (
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
              <div id={`analysis-content-${analysis.id}`} hidden={analysisMinimized}>
                <div className="mt-5 break-words border-t border-border pt-5 text-sm leading-7 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-black [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-black [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ol_li]:list-decimal [&_p]:mb-4 [&_strong]:font-bold [&_ul]:mb-4 [&_ul]:space-y-1">
                  <ReactMarkdown>
                    {analysis.answer ??
                      (analysis.status === "failed"
                        ? "Esta análise não foi concluída. Você pode gerar uma nova pergunta com os filtros desejados."
                        : "Esta solicitação está em processamento ou foi interrompida. Atualize o histórico para verificar.")}
                  </ReactMarkdown>
                </div>
                <p className="mt-5 text-xs text-muted-foreground">
                  Resposta gerada por IA a partir de um retrato dos dados. Confira os valores antes de tomar decisões.
                </p>
              </div>
            </article>
          ) : null}
        </div>
          </>
        ) : screen === "detail" && analysis ? (
          <section className="min-w-0 rounded-2xl border border-border bg-graphite p-4 sm:p-7">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setAnalysis(null)
                setScreen(detailReturnScreen)
              }}
              className="min-h-11 rounded-full border border-border px-4 text-xs font-black uppercase tracking-wider text-muted-foreground hover:border-lime/40 hover:text-lime"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <header className="mt-6 border-b border-border pb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-lime">
                {new Date(analysis.createdAt).toLocaleString("pt-BR")} · {getStatusLabel(analysis.status)}
              </p>
              <h2 className="mt-3 break-words text-xl font-black leading-tight sm:text-2xl">{analysis.question}</h2>
            </header>
            <div className="mt-6 break-words text-sm leading-7 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-black [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-black [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ol_li]:list-decimal [&_p]:mb-4 [&_strong]:font-bold [&_ul]:mb-4 [&_ul]:space-y-1">
              <ReactMarkdown>{analysis.answer ?? "Esta análise não possui resposta salva."}</ReactMarkdown>
            </div>
            <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              Resposta gerada a partir dos dados consultados nesta análise. Confira os valores antes de tomar decisões.
            </p>
          </section>
        ) : (
          <section className="min-w-0 rounded-2xl border border-border bg-graphite p-4 sm:p-7">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setAnalysis(null)
                setScreen("conversation")
              }}
              className="min-h-11 rounded-full border border-border px-4 text-xs font-black uppercase tracking-wider text-muted-foreground hover:border-lime/40 hover:text-lime"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <header className="mt-6 border-b border-border pb-5">
              <h2 className="text-xl font-black sm:text-2xl">Todas as análises</h2>
              <p className="mt-2 text-sm text-muted-foreground">Da mais recente à mais antiga.</p>
            </header>
            {allHistoryError ? <p role="alert" className="mt-5 text-sm text-red-300">{allHistoryError}</p> : null}
            {loadingAll ? <p className="mt-5 text-sm text-muted-foreground">Carregando análises…</p> : null}
            <div className="mt-5 grid gap-3">
              {allHistory.map((row) => (
                <Button
                  key={row.id}
                  variant="ghost"
                  type="button"
                  disabled={loadingAll}
                  onClick={() => void openAnalysis(row.id, "history")}
                  className="h-auto w-full min-w-0 flex-col items-start justify-start whitespace-normal rounded-xl border border-border p-4 text-left hover:border-lime/40 hover:bg-lime/5"
                >
                  <span className="block whitespace-normal break-words text-sm font-bold leading-6">{row.question}</span>
                  <span className="mt-2 block text-xs font-normal text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString("pt-BR")} · {getStatusLabel(row.status)}
                  </span>
                </Button>
              ))}
              {!loadingAll && !allHistory.length && !allHistoryError ? (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Você ainda não tem análises salvas.</p>
              ) : null}
            </div>
            {allPage > 0 || allHasMore ? (
              <div className="mt-5 flex items-center justify-between gap-3">
                <Button variant="ghost" type="button" disabled={allPage === 0 || loadingAll} onClick={() => void loadAllHistory(allPage - 1)} className="min-h-10 border border-border px-4 text-xs disabled:opacity-40">Anterior</Button>
                <span className="text-xs text-muted-foreground">Página {allPage + 1}</span>
                <Button variant="ghost" type="button" disabled={!allHasMore || loadingAll} onClick={() => void loadAllHistory(allPage + 1)} className="min-h-10 border border-border px-4 text-xs disabled:opacity-40">Próxima</Button>
              </div>
            ) : null}
          </section>
        )}
      </div>
      {screen === "conversation" ? <aside className="grid min-w-0 items-start gap-4 md:grid-cols-2 2xl:grid-cols-1 sm:gap-5">
        <IndicatorsAiCosts creditError={creditError} />
        <Card className="2xl:sticky 2xl:top-5 min-w-0 self-start gap-0 rounded-2xl border-border bg-graphite p-4 shadow-none sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <History className="h-4 w-4 text-lime" />
              Minhas análises
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
            {history.slice(0, 2).map((row) => (
              <Button
                key={row.id}
                variant="ghost"
                type="button"
                disabled={busy}
                onClick={() => void openAnalysis(row.id, screen === "history" ? "history" : "conversation")}
                className="h-auto w-full min-w-0 flex-col items-start justify-start whitespace-normal overflow-hidden rounded-xl border border-border p-3 text-left transition hover:border-lime/30 hover:bg-lime/5"
              >
                <span className="line-clamp-2 w-full min-w-0 overflow-hidden break-words text-ellipsis text-sm">{row.question}</span>
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
          <Button
            variant="ghost"
            type="button"
            onClick={() => void showAllHistory()}
            className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg border border-border px-3 text-xs font-bold text-lime transition hover:border-lime/40 hover:bg-lime/5"
          >
            Ver todas minhas análises
          </Button>
        </Card>
      </aside> : null}
    </div>
  )
}

function getStatusLabel(status: string) {
  if (status === "completed") return "Concluída"
  if (status === "failed") return "Não concluída"
  return "Em andamento"
}
