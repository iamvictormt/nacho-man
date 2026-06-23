"use client"

import { useActionState, useState } from "react"
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react"
import { loginAction, type LoginState } from "@/app/login/actions"

const initialState: LoginState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-black uppercase tracking-wider text-foreground/70">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground"
          placeholder="seuemail@nachoman.com.br"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-xs font-black uppercase tracking-wider text-foreground/70">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-12 text-sm text-foreground"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-graphite hover:text-lime"
            aria-label={showPassword ? "Ocultar senha" : "Visualizar senha"}
            title={showPassword ? "Ocultar senha" : "Visualizar senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground/80">
        <input
          name="rememberMe"
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-lime"
          disabled={pending}
        />
        <span className="flex flex-col">
          <span>Lembrar de mim</span>
          <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Mantém sua sessão ativa por mais tempo neste dispositivo.
          </span>
        </span>
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-300"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-sm font-black text-background transition hover:shadow-[0_0_24px_rgba(239,255,13,.25)] disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {pending ? "ENTRANDO..." : "ENTRAR"}
      </button>
    </form>
  )
}
