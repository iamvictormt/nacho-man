"use client"

import { useActionState, useState } from "react"
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react"
import { changeForcedPasswordAction, type ForcedPasswordChangeState } from "./actions"

const initialState: ForcedPasswordChangeState = {}

export function ForcedPasswordForm() {
  const [state, formAction, pending] = useActionState(changeForcedPasswordAction, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <PasswordInput
        id="password"
        name="password"
        label="Nova senha"
        show={showPassword}
        onToggle={() => setShowPassword((current) => !current)}
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar nova senha"
        show={showConfirmPassword}
        onToggle={() => setShowConfirmPassword((current) => !current)}
      />
      {state.error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-5 text-[10px] font-black uppercase text-background transition hover:shadow-[0_0_24px_rgba(239,255,13,.25)] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
        {pending ? "SALVANDO..." : "SALVAR NOVA SENHA"}
      </button>
    </form>
  )
}

function PasswordInput({
  id,
  name,
  label,
  show,
  onToggle,
}: {
  id: string
  name: string
  label: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="block text-xs font-bold leading-4 text-muted-foreground">
        {label} <span className="text-lime">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          minLength={8}
          autoComplete="new-password"
          required
          className="h-12 w-full rounded-xl border border-border bg-background px-3.5 pr-12 text-sm font-medium text-foreground outline-offset-0 transition placeholder:text-muted-foreground/70 hover:border-foreground/20 focus-visible:border-lime focus-visible:outline-2 focus-visible:outline-lime"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition hover:text-lime"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
