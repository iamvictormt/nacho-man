"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

const controlClassName =
  "min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground outline-offset-0 transition placeholder:text-muted-foreground/70 hover:border-foreground/20 focus-visible:border-lime focus-visible:outline-2 focus-visible:outline-lime disabled:cursor-not-allowed disabled:opacity-60"

type FieldShellProps = {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

type AdminInputMask = "money" | "integer" | "decimal" | "cnpj" | "phone" | "date" | "email"

const maskInputMode: Record<AdminInputMask, React.HTMLAttributes<HTMLInputElement>["inputMode"]> = {
  money: "decimal",
  integer: "numeric",
  decimal: "decimal",
  cnpj: "numeric",
  phone: "tel",
  date: "numeric",
  email: "email",
}

function digitsOnly(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "")
  return maxLength ? digits.slice(0, maxLength) : digits
}

function formatMoney(value: string) {
  const digits = digitsOnly(value)
  if (!digits) return ""
  const cents = digits.padStart(3, "0")
  const integer = cents.slice(0, -2).replace(/^0+(?=\d)/, "")
  const decimals = cents.slice(-2)
  return `${integer || "0"},${decimals}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function formatDecimal(value: string) {
  const clean = value.replace(/[^\d,.]/g, "").replace(/\./g, ",")
  const [integer = "", decimals] = clean.split(",")
  const normalizedInteger = integer.replace(/\D/g, "")
  if (decimals === undefined) return normalizedInteger
  return `${normalizedInteger},${decimals.replace(/\D/g, "").slice(0, 2)}`
}

function formatCnpj(value: string) {
  const digits = digitsOnly(value, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

function formatPhone(value: string) {
  const digits = digitsOnly(value.replace(/^55/, ""), 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatDate(value: string) {
  const digits = digitsOnly(value, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function formatMaskedValue(value: string, mask?: AdminInputMask) {
  if (!mask) return value
  if (mask === "money") return formatMoney(value)
  if (mask === "integer") return digitsOnly(value)
  if (mask === "decimal") return formatDecimal(value)
  if (mask === "cnpj") return formatCnpj(value)
  if (mask === "phone") return formatPhone(value)
  if (mask === "date") return formatDate(value)
  if (mask === "email") return value.replace(/\s/g, "").toLowerCase()
  return value
}

export function AdminField({ label, htmlFor, hint, error, required, className, children }: FieldShellProps) {
  return (
    <div data-admin-field className={cn("min-w-0 space-y-2.5", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-bold leading-4 text-muted-foreground">
        {label}
        {required && (
          <span className="ml-1 text-lime" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {(hint || error) && (
        <p className={cn("text-[10px] leading-4", error ? "text-red-300" : "text-muted-foreground")}>{error ?? hint}</p>
      )}
    </div>
  )
}

export function AdminInput({
  label,
  hint,
  error,
  className,
  required,
  id,
  name,
  mask,
  inputMode,
  onChange,
  type: _type,
  defaultValue,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
  mask?: AdminInputMask
}) {
  const fieldId = id ?? name
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (mask) event.currentTarget.value = formatMaskedValue(event.currentTarget.value, mask)
    onChange?.(event)
  }
  return (
    <AdminField label={label} htmlFor={fieldId} hint={hint} error={error} required={required} className={className}>
      <Input
        id={fieldId}
        name={name}
        type={mask ? "text" : (_type ?? "text")}
        inputMode={inputMode ?? (mask ? maskInputMode[mask] : undefined)}
        defaultValue={
          typeof defaultValue === "string" || typeof defaultValue === "number"
            ? formatMaskedValue(String(defaultValue), mask)
            : defaultValue
        }
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(controlClassName, "h-12 shadow-none focus-visible:ring-0")}
        onChange={handleChange}
        {...props}
      />
    </AdminField>
  )
}

type AdminSelectProps = {
  label: string
  name: string
  hint?: string
  error?: string
  className?: string
  fieldClassName?: string
  required?: boolean
  disabled?: boolean
  id?: string
  defaultValue?: string
  value?: string
  placeholder?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function AdminSelect({
  label,
  hint,
  error,
  className,
  fieldClassName,
  required,
  id,
  name,
  defaultValue,
  value,
  placeholder,
  onValueChange,
  disabled,
  children,
}: AdminSelectProps) {
  const fieldId = id ?? name
  const options = React.Children.toArray(children)
    .filter(React.isValidElement<{ value?: string; disabled?: boolean; children?: React.ReactNode }>)
    .map((option) => ({
      value: String(option.props.value ?? ""),
      disabled: option.props.disabled,
      label: option.props.children,
    }))
  const emptyOption = options.find((option) => option.value === "")
  const selectableOptions = options.filter((option) => option.value !== "")

  return (
    <AdminField
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <Select
        name={name}
        defaultValue={defaultValue || undefined}
        value={value}
        onValueChange={onValueChange}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          aria-invalid={Boolean(error)}
          className={cn(
            controlClassName,
            "h-12 min-h-12 w-full rounded-xl shadow-none focus-visible:ring-0",
            className
          )}
        >
          <SelectValue placeholder={placeholder ?? emptyOption?.label ?? "Selecione"} />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[80] max-h-72 rounded-xl border-border bg-popover p-1 shadow-2xl">
          {selectableOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="min-h-10 rounded-lg px-3 py-2.5 text-sm focus:bg-lime focus:text-background"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </AdminField>
  )
}

export function AdminTextarea({
  label,
  hint,
  error,
  className,
  required,
  id,
  name,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: string
  error?: string
}) {
  const fieldId = id ?? name
  return (
    <AdminField label={label} htmlFor={fieldId} hint={hint} error={error} required={required} className={className}>
      <Textarea
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(controlClassName, "min-h-28 resize-y py-3 leading-6 shadow-none focus-visible:ring-0")}
        {...props}
      />
    </AdminField>
  )
}

export function AdminCheckbox({
  label,
  description,
  className,
  id,
  name,
  ...props
}: Omit<React.ComponentProps<typeof Checkbox>, "checked" | "defaultChecked"> & {
  label: string
  description?: string
  checked?: boolean
  defaultChecked?: boolean
}) {
  const fieldId = id ?? name
  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3.5 transition hover:border-lime/25",
        className
      )}
    >
      <Checkbox
        id={fieldId}
        name={name}
        className="mt-0.5 size-4 shrink-0 rounded border-border shadow-none focus-visible:ring-0 data-[state=checked]:border-lime data-[state=checked]:bg-lime data-[state=checked]:text-background"
        {...props}
      />
      <span>
        <span className="block text-xs font-bold text-foreground">{label}</span>
        {description && <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">{description}</span>}
      </span>
    </label>
  )
}

export function AdminFieldGrid({
  children,
  className,
  columns = "equal",
}: {
  children: React.ReactNode
  className?: string
  columns?: "equal" | "wide-first" | "wide-last" | "three"
}) {
  const columnsClass = {
    equal: "md:grid-cols-2",
    "wide-first": "md:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)]",
    "wide-last": "md:grid-cols-[minmax(140px,1fr)_minmax(0,2fr)]",
    three: "md:grid-cols-3",
  }
  return <div className={cn("grid gap-5 md:gap-6", columnsClass[columns], className)}>{children}</div>
}
