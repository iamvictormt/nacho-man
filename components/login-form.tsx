"use client"

import { useActionState, useEffect, useState } from "react"
import type { InputHTMLAttributes } from "react"
import { CheckCircle2, Eye, EyeOff, LoaderCircle, LogIn, Store, UserPlus, X } from "lucide-react"
import {
  requestPasswordResetAction,
  resetPasswordAction,
  loginAction,
  registerAction,
  type ForgotPasswordState,
  type LoginState,
  type RegisterState,
} from "@/app/login/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const initialLoginState: LoginState = {}
const initialRegisterState: RegisterState = {}
const initialForgotState: ForgotPasswordState = {}
const IBGE_API_URL = "https://servicodados.ibge.gov.br/api/v1/localidades"

type FieldMask = "phone" | "cnpj" | "email" | "code"
type IbgeState = {
  id: number
  nome: string
  sigla: string
}
type IbgeCity = {
  id: number
  nome: string
}

export type LoginMode = "login" | "register" | "forgot"

const BRAZIL_STATES: IbgeState[] = [
  { id: 12, nome: "Acre", sigla: "AC" },
  { id: 27, nome: "Alagoas", sigla: "AL" },
  { id: 16, nome: "Amapá", sigla: "AP" },
  { id: 13, nome: "Amazonas", sigla: "AM" },
  { id: 29, nome: "Bahia", sigla: "BA" },
  { id: 23, nome: "Ceará", sigla: "CE" },
  { id: 53, nome: "Distrito Federal", sigla: "DF" },
  { id: 32, nome: "Espírito Santo", sigla: "ES" },
  { id: 52, nome: "Goiás", sigla: "GO" },
  { id: 21, nome: "Maranhão", sigla: "MA" },
  { id: 51, nome: "Mato Grosso", sigla: "MT" },
  { id: 50, nome: "Mato Grosso do Sul", sigla: "MS" },
  { id: 31, nome: "Minas Gerais", sigla: "MG" },
  { id: 15, nome: "Pará", sigla: "PA" },
  { id: 25, nome: "Paraíba", sigla: "PB" },
  { id: 41, nome: "Paraná", sigla: "PR" },
  { id: 26, nome: "Pernambuco", sigla: "PE" },
  { id: 22, nome: "Piauí", sigla: "PI" },
  { id: 33, nome: "Rio de Janeiro", sigla: "RJ" },
  { id: 24, nome: "Rio Grande do Norte", sigla: "RN" },
  { id: 43, nome: "Rio Grande do Sul", sigla: "RS" },
  { id: 11, nome: "Rondônia", sigla: "RO" },
  { id: 14, nome: "Roraima", sigla: "RR" },
  { id: 42, nome: "Santa Catarina", sigla: "SC" },
  { id: 35, nome: "São Paulo", sigla: "SP" },
  { id: 28, nome: "Sergipe", sigla: "SE" },
  { id: 17, nome: "Tocantins", sigla: "TO" },
]

function digitsOnly(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "")
  return maxLength ? digits.slice(0, maxLength) : digits
}

function formatPhone(value: string) {
  const digits = digitsOnly(value.replace(/^55/, ""), 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCnpj(value: string) {
  const digits = digitsOnly(value, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

function formatMaskedValue(value: string, mask?: FieldMask) {
  if (mask === "phone") return formatPhone(value)
  if (mask === "cnpj") return formatCnpj(value)
  if (mask === "email") return value.replace(/\s/g, "").toLowerCase()
  if (mask === "code") return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4)
  return value
}

export function LoginForm({
  mode: controlledMode,
  onModeChange,
}: {
  mode?: LoginMode
  onModeChange?: (mode: LoginMode) => void
}) {
  const [internalMode, setInternalMode] = useState<LoginMode>("login")
  const mode = controlledMode ?? internalMode
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialLoginState)
  const [registerState, registerFormAction, registerPending] = useActionState(registerAction, initialRegisterState)
  const [forgotState, forgotFormAction, forgotPending] = useActionState(requestPasswordResetAction, initialForgotState)
  const [resetState, resetFormAction, resetPending] = useActionState(resetPasswordAction, initialForgotState)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [isFranchisee, setIsFranchisee] = useState(false)
  const [franchiseModalOpen, setFranchiseModalOpen] = useState(false)
  const [cities, setCities] = useState<IbgeCity[]>([])
  const [legalName, setLegalName] = useState("")
  const [tradeName, setTradeName] = useState("")
  const [document, setDocument] = useState("")
  const [businessEmail, setBusinessEmail] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [loadingCities, setLoadingCities] = useState(false)
  const hasBusinessData = Boolean(legalName && tradeName && document && businessEmail && selectedState && selectedCity)
  const hasFranchiseData = hasBusinessData
  const showLegacyFranchiseCard = false
  const resetEmail = forgotState.email || resetState.email || ""

  function changeMode(nextMode: LoginMode) {
    setInternalMode(nextMode)
    onModeChange?.(nextMode)
  }

  useEffect(() => {
    if (!franchiseModalOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFranchiseModalOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [franchiseModalOpen])

  useEffect(() => {
    if (!selectedState) {
      setCities([])
      setSelectedCity("")
      return
    }

    let active = true
    async function loadCities() {
      setLoadingCities(true)
      try {
        const response = await fetch(`${IBGE_API_URL}/estados/${selectedState}/municipios?orderBy=nome`)
        const data = (await response.json()) as IbgeCity[]
        if (active) setCities(data)
      } catch {
        if (active) setCities([])
      } finally {
        if (active) setLoadingCities(false)
      }
    }

    loadCities()
    return () => {
      active = false
    }
  }, [selectedState])

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-full border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => changeMode("login")}
          className={`h-10 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
            mode === "login" ? "bg-lime text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => changeMode("register")}
          className={`h-10 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
            mode === "register" ? "bg-lime text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Cadastrar
        </button>
      </div>

      {mode === "forgot" ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-lime/20 bg-lime/5 p-4">
            <p className="text-xs font-black uppercase text-lime">Recuperar acesso</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Informe seu e-mail para receber um código de 4 caracteres e criar uma nova senha.
            </p>
          </div>

          <form action={forgotFormAction} className="space-y-4">
            <TextField
              id="resetEmail"
              name="resetEmail"
              label="E-mail"
              type="email"
              autoComplete="email"
              mask="email"
              defaultValue={resetEmail}
              placeholder="seuemail@nachoman.com.br"
              required
            />
            {forgotState.error && <AlertMessage tone="error" text={forgotState.error} />}
            {forgotState.success && <AlertMessage tone="success" text={forgotState.success} />}
            <SubmitButton pending={forgotPending} icon="register" pendingText="ENVIANDO..." text="ENVIAR CÓDIGO" />
          </form>

          {(forgotState.success || resetState.error || resetState.success) && (
            <form action={resetFormAction} className="space-y-4 rounded-xl border border-border bg-background p-4">
              <input type="hidden" name="resetEmail" value={resetEmail} />
              <TextField
                id="resetCode"
                name="resetCode"
                label="Código recebido"
                mask="code"
                maxLength={4}
                placeholder="A1B2"
                required
              />
              <PasswordField
                id="newPassword"
                name="newPassword"
                label="Nova senha"
                autoComplete="new-password"
                show={showResetPassword}
                onToggle={() => setShowResetPassword((current) => !current)}
              />
              {resetState.error && <AlertMessage tone="error" text={resetState.error} />}
              {resetState.success && <AlertMessage tone="success" text={resetState.success} />}
              <SubmitButton pending={resetPending} icon="login" pendingText="SALVANDO..." text="TROCAR SENHA" />
            </form>
          )}

          <button
            type="button"
            onClick={() => changeMode("login")}
            className="w-full text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground transition hover:text-lime"
          >
            Voltar para login
          </button>
        </div>
      ) : mode === "login" ? (
        <form action={loginFormAction} className="space-y-5">
          <TextField
            id="email"
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="seuemail@nachoman.com.br"
            required
          />

          <PasswordField
            id="password"
            name="password"
            label="Senha"
            autoComplete="current-password"
            show={showLoginPassword}
            onToggle={() => setShowLoginPassword((current) => !current)}
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground/80">
            <input
              name="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-lime"
              disabled={loginPending}
            />
            <span className="flex flex-col">
              <span>Lembrar de mim</span>
              <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                Mantém sua sessão ativa por mais tempo neste dispositivo.
              </span>
            </span>
          </label>

          {loginState.error && <AlertMessage tone="error" text={loginState.error} />}

          <SubmitButton pending={loginPending} icon="login" pendingText="ENTRANDO..." text="ENTRAR" />
          <button
            type="button"
            onClick={() => changeMode("forgot")}
            className="w-full text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground transition hover:text-lime"
          >
            Esqueci minha senha
          </button>
        </form>
      ) : (
        <form action={registerFormAction} className="space-y-5">
          <TextField
            id="name"
            name="name"
            label="Nome"
            autoComplete="name"
            placeholder="Seu nome completo"
            required
          />
          <TextField
            id="registerEmail"
            name="registerEmail"
            label="E-mail"
            type="email"
            autoComplete="email"
            mask="email"
            placeholder="seuemail@nachoman.com.br"
            required
          />
          <PasswordField
            id="registerPassword"
            name="registerPassword"
            label="Senha"
            autoComplete="new-password"
            show={showRegisterPassword}
            onToggle={() => setShowRegisterPassword((current) => !current)}
          />
          <TextField
            id="phone"
            name="phone"
            label={isFranchisee ? "WhatsApp da unidade" : "WhatsApp"}
            inputMode="tel"
            mask="phone"
            placeholder="(00) 00000-0000"
            required={isFranchisee}
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground/80">
            <input
              name="isFranchisee"
              type="checkbox"
              checked={isFranchisee}
              onChange={(event) => setIsFranchisee(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border accent-lime"
              disabled={registerPending}
            />
            <span className="flex flex-col">
              <span>Você é franqueado?</span>
              <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                Marque esta opção se você for franqueado da Rede Nacho Man Mexican Food.
              </span>
            </span>
          </label>

          <input type="hidden" name="legalName" value={legalName} />
          <input type="hidden" name="tradeName" value={tradeName} />
          <input type="hidden" name="document" value={document} />
          <input type="hidden" name="businessEmail" value={businessEmail} />
          <input type="hidden" name="state" value={selectedState} />
          <input type="hidden" name="city" value={selectedCity} />

          <div className="rounded-xl border border-lime/20 bg-lime/5 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-background text-lime">
                <Store className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase text-foreground">Dados comerciais</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {hasBusinessData
                    ? `${tradeName} - ${selectedCity}/${selectedState}`
                    : "Informe CNPJ, razão social, nome fantasia, endereço e e-mail."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFranchiseModalOpen(true)}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-lime/30 px-4 text-[10px] font-black uppercase tracking-wider text-lime transition hover:border-lime hover:bg-lime hover:text-background"
            >
              {hasBusinessData ? "EDITAR DADOS" : "PREENCHER DADOS"}
            </button>
          </div>

          {showLegacyFranchiseCard && isFranchisee && (
            <>
              <input type="hidden" name="tradeName" value={tradeName} />
              <input type="hidden" name="document" value={document} />
              <input type="hidden" name="state" value={selectedState} />
              <input type="hidden" name="city" value={selectedCity} />

              <div className="rounded-xl border border-lime/20 bg-lime/5 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-background text-lime">
                    <Store className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase text-foreground">Dados da unidade</p>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      {hasFranchiseData
                        ? `${tradeName} · ${selectedCity}/${selectedState}`
                        : "Informe CNPJ, UF e cidade em uma janela separada."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFranchiseModalOpen(true)}
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-lime/30 px-4 text-[10px] font-black uppercase tracking-wider text-lime transition hover:border-lime hover:bg-lime hover:text-background"
                >
                  {hasFranchiseData ? "EDITAR DADOS" : "PREENCHER DADOS"}
                </button>
              </div>
            </>
          )}

          {franchiseModalOpen && (
            <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 px-4 py-5 sm:items-center">
              <button
                type="button"
                className="absolute inset-0"
                aria-label="Fechar dados da unidade"
                onClick={() => setFranchiseModalOpen(false)}
              />
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="franchise-modal-title"
                className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-6"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime">Cadastro comercial</p>
                    <h3 id="franchise-modal-title" className="mt-2 text-xl font-black uppercase">
                      Dados da empresa
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFranchiseModalOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-lime/40 hover:text-lime"
                    aria-label="Fechar"
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <TextField
                    id="legalName"
                    label="Razão social"
                    value={legalName}
                    onChange={(event) => setLegalName(event.currentTarget.value)}
                    placeholder="Empresa LTDA"
                    required
                  />
                  <TextField
                    id="tradeName"
                    label="Nome fantasia"
                    value={tradeName}
                    onChange={(event) => setTradeName(event.currentTarget.value)}
                    placeholder="Nacho Man Centro"
                    required
                  />
                  <TextField
                    id="document"
                    label="CNPJ"
                    inputMode="numeric"
                    value={document}
                    onChange={(event) => setDocument(formatMaskedValue(event.currentTarget.value, "cnpj"))}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                  <TextField
                    id="businessEmail"
                    label="E-mail comercial"
                    type="email"
                    mask="email"
                    value={businessEmail}
                    onChange={(event) => setBusinessEmail(event.currentTarget.value)}
                    placeholder="empresa@email.com"
                    required
                  />
                  <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                    <SelectField
                      id="state"
                      label="UF"
                      value={selectedState}
                      onChange={(value) => {
                        setSelectedState(value)
                        setSelectedCity("")
                      }}
                      placeholder="UF"
                      required
                      options={BRAZIL_STATES.map((state) => ({ value: state.sigla, label: state.sigla }))}
                    />
                    <SelectField
                      id="city"
                      label="Cidade"
                      value={selectedCity}
                      onChange={(value) => setSelectedCity(value)}
                      disabled={!selectedState || loadingCities}
                      placeholder={
                        selectedState ? (loadingCities ? "Carregando..." : "Selecione a cidade") : "Selecione a UF"
                      }
                      required
                      options={cities.map((city) => ({ value: city.nome, label: city.nome }))}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setFranchiseModalOpen(false)}
                    className="flex h-11 items-center justify-center rounded-full border border-border px-5 text-[10px] font-black uppercase tracking-wider text-foreground transition hover:border-lime/30 hover:text-lime"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFranchiseModalOpen(false)}
                    className="flex h-11 items-center justify-center rounded-full bg-lime px-5 text-[10px] font-black uppercase tracking-wider text-background"
                  >
                    Salvar dados
                  </button>
                </div>
              </section>
            </div>
          )}

          {registerState.error && <AlertMessage tone="error" text={registerState.error} />}
          {registerState.success && <AlertMessage tone="success" text={registerState.success} />}

          <SubmitButton pending={registerPending} icon="register" pendingText="CADASTRANDO..." text="CRIAR CADASTRO" />
        </form>
      )}
    </div>
  )
}

function TextField({
  id,
  name,
  label,
  type = "text",
  mask,
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string
  name?: string
  label: string
  mask?: FieldMask
}) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (mask) event.currentTarget.value = formatMaskedValue(event.currentTarget.value, mask)
    onChange?.(event)
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-black uppercase tracking-wider text-foreground/70">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground"
        onChange={handleChange}
        {...props}
      />
    </div>
  )
}

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  options,
  required,
}: {
  id: string
  name?: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder: string
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-black uppercase tracking-wider text-foreground/70">
        {label}
      </label>
      <Select
        name={name}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={id}
          className="h-12 min-h-12 w-full rounded-xl border-border bg-background px-4 text-sm font-semibold text-foreground shadow-none focus:ring-0 focus-visible:border-lime focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[110] max-h-72 rounded-xl border-border bg-popover p-1 shadow-2xl">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-10 rounded-lg px-3 py-2.5 text-sm focus:bg-lime focus:text-background"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function PasswordField({
  id,
  name,
  label,
  autoComplete,
  show,
  onToggle,
}: {
  id: string
  name: string
  label: string
  autoComplete: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-black uppercase tracking-wider text-foreground/70">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={8}
          required
          className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-12 text-sm text-foreground"
          placeholder="********"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-graphite hover:text-lime"
          aria-label={show ? "Ocultar senha" : "Visualizar senha"}
          title={show ? "Ocultar senha" : "Visualizar senha"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function AlertMessage({ tone, text }: { tone: "error" | "success"; text: string }) {
  const success = tone === "success"
  return (
    <p
      role="alert"
      className={`rounded-xl border p-3 text-sm font-semibold ${
        success ? "border-lime/30 bg-lime/10 text-lime" : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
    >
      {success && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
      {text}
    </p>
  )
}

function SubmitButton({
  pending,
  icon,
  pendingText,
  text,
}: {
  pending: boolean
  icon: "login" | "register"
  pendingText: string
  text: string
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-sm font-black text-background transition hover:shadow-[0_0_24px_rgba(239,255,13,.25)] disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : icon === "login" ? (
        <LogIn className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {pending ? pendingText : text}
    </button>
  )
}
