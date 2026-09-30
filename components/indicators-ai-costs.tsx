"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, RefreshCw, Wallet, Info } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

type Costs = { configured: boolean; amountUsd: number | null; startingAt?: string; updatedAt?: string }

export function IndicatorsAiCosts({ creditError }: { creditError: boolean }) {
  const [data, setData] = useState<Costs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/indicadores/ai-costs", { cache: "no-store", signal })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Não foi possível consultar os custos.")
      if (!signal?.aborted) setData(result)
    } catch (error) {
      if (!signal?.aborted) {
        setData(null)
        setError(
          error instanceof TypeError
            ? "Falha de conexão ao consultar os custos. Tente novamente."
            : error instanceof Error
              ? error.message
              : "Não foi possível consultar os custos."
        )
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  return (
    <Card className="min-w-0 gap-4 border-border bg-graphite shadow-none">
      <CardHeader className="gap-2 px-4 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet className="size-4 text-lime" /> Custos da IA
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Atualizar custos"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
        <CardDescription className="text-xs">Acompanhamento administrativo · Anthropic</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-5" aria-live="polite" aria-busy={loading}>
        {creditError && (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-200">
            <Info />
            <AlertDescription>
              Créditos insuficientes na última tentativa. Confira o saldo e recarregue no console.
            </AlertDescription>
          </Alert>
        )}
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Gasto da organização neste mês (UTC)</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-32" />
          ) : (
            <p className="mt-2 break-words text-2xl sm:text-3xl font-bold tabular-nums">
              {data?.amountUsd != null
                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }).format(data.amountUsd)
                : "—"}
            </p>
          )}
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Inclui o uso da organização fora deste painel. Não representa o saldo disponível.
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && data && !data.configured && (
          <div className="space-y-2">
            <Badge variant="outline" className="max-w-full whitespace-normal">
              Consulta de custos não configurada
            </Badge>
            <p className="text-xs leading-5 text-muted-foreground">
              Peça ao administrador para habilitar o acesso ao relatório de custos. Você já pode consultar o saldo no
              console.
            </p>
          </div>
        )}
        {data?.updatedAt && !loading && (
          <p className="text-xs text-muted-foreground">
            Consultado em {new Date(data.updatedAt).toLocaleString("pt-BR")}. Os custos podem levar alguns minutos para
            aparecer.
          </p>
        )}
        <Button asChild variant="outline" className="h-auto min-h-11 w-full whitespace-normal text-center">
          <a href="https://platform.claude.com/settings/billing" target="_blank" rel="noopener noreferrer">
            Consultar saldo e recarregar <ExternalLink />
          </a>
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          O saldo oficial e a recarga automática estão disponíveis no console da Anthropic.
        </p>
      </CardContent>
    </Card>
  )
}
