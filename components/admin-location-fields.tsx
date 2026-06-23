"use client"

import * as React from "react"
import { AdminFieldGrid, AdminSelect } from "@/components/admin-form-fields"

type IbgeState = {
  id: number
  nome: string
  sigla: string
}

type IbgeCity = {
  id: number
  nome: string
}

const IBGE_API_URL = "https://servicodados.ibge.gov.br/api/v1/localidades"

export function AdminLocationFields({
  defaultState = "",
  defaultCity = "",
}: {
  defaultState?: string
  defaultCity?: string
}) {
  const [states, setStates] = React.useState<IbgeState[]>([])
  const [cities, setCities] = React.useState<IbgeCity[]>([])
  const [state, setState] = React.useState(defaultState)
  const [city, setCity] = React.useState(defaultCity)
  const [isLoadingStates, setIsLoadingStates] = React.useState(true)
  const [isLoadingCities, setIsLoadingCities] = React.useState(false)

  React.useEffect(() => {
    let active = true

    async function loadStates() {
      setIsLoadingStates(true)
      try {
        const response = await fetch(`${IBGE_API_URL}/estados?orderBy=nome`)
        const data = (await response.json()) as IbgeState[]
        if (active) setStates(data)
      } finally {
        if (active) setIsLoadingStates(false)
      }
    }

    loadStates()
    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    let active = true

    async function loadCities() {
      if (!state) {
        setCities([])
        return
      }

      setIsLoadingCities(true)
      try {
        const response = await fetch(`${IBGE_API_URL}/estados/${state}/municipios?orderBy=nome`)
        const data = (await response.json()) as IbgeCity[]
        if (active) setCities(data)
      } finally {
        if (active) setIsLoadingCities(false)
      }
    }

    loadCities()
    return () => {
      active = false
    }
  }, [state])

  function handleStateChange(nextState: string) {
    setState(nextState)
    setCity("")
  }

  return (
    <AdminFieldGrid className="mt-6" columns="wide-last">
      <AdminSelect
        name="state"
        label="UF"
        value={state || undefined}
        onValueChange={handleStateChange}
        placeholder={isLoadingStates ? "Carregando..." : "Selecione"}
        disabled={isLoadingStates}
      >
        <option value="">Selecione</option>
        {states.map((item) => (
          <option key={item.id} value={item.sigla}>
            {item.sigla}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        name="city"
        label="Cidade"
        value={city || undefined}
        onValueChange={setCity}
        placeholder={state ? (isLoadingCities ? "Carregando..." : "Selecione") : "Selecione a UF"}
        disabled={!state || isLoadingCities}
      >
        <option value="">Selecione</option>
        {cities.map((item) => (
          <option key={item.id} value={item.nome}>
            {item.nome}
          </option>
        ))}
      </AdminSelect>
    </AdminFieldGrid>
  )
}
