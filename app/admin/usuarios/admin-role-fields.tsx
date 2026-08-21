"use client"

import { useState } from "react"
import { AdminCheckbox, AdminSelect } from "@/components/admin-form-fields"
import { SelectItem } from "@/components/ui/select"

type AdminRole = "ADMIN" | "ADMIN_MASTER"

export function AdminRoleFields({
  defaultRole = "ADMIN",
  defaultCanAccessIndicators = false,
  disabled = false,
}: {
  defaultRole?: AdminRole
  defaultCanAccessIndicators?: boolean
  disabled?: boolean
}) {
  const [role, setRole] = useState<AdminRole>(defaultRole)
  const master = role === "ADMIN_MASTER"

  return (
    <>
      <AdminRoleHelp />
      <AdminSelect
        name="role"
        label="Nível"
        defaultValue={defaultRole}
        value={role}
        onValueChange={(value) => setRole(value === "ADMIN_MASTER" ? "ADMIN_MASTER" : "ADMIN")}
        required
        disabled={disabled}
      >
        <SelectItem value="ADMIN">Admin comum</SelectItem>
        <SelectItem value="ADMIN_MASTER">Admin master</SelectItem>
      </AdminSelect>
      {master ? (
        <div className="rounded-xl border border-lime/20 bg-lime/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime">Indicadores liberados</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Admin master sempre acessa Indicadores, então não é necessário marcar uma permissão separada.
          </p>
        </div>
      ) : (
        <AdminCheckbox
          name="canAccessIndicators"
          label="Liberar indicadores"
          description="Permite que este admin comum acesse o painel de indicadores."
          defaultChecked={defaultCanAccessIndicators}
        />
      )}
    </>
  )
}

function AdminRoleHelp() {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-graphite p-4 text-xs leading-5 sm:grid-cols-2">
      <div>
        <p className="font-black uppercase tracking-[0.12em] text-lime">Admin comum</p>
        <p className="mt-1 text-muted-foreground">
          Acessa o painel administrativo e executa as rotinas normais. Só vê Indicadores quando essa permissão for
          liberada.
        </p>
      </div>
      <div>
        <p className="font-black uppercase tracking-[0.12em] text-lime">Admin master</p>
        <p className="mt-1 text-muted-foreground">
          Tem tudo do admin comum, sempre acessa Indicadores e pode criar, editar e delegar permissões para outros
          admins.
        </p>
      </div>
    </div>
  )
}
