import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contato Comercial",
  description:
    "Fale com o atendimento comercial da Nacho Factory pelo WhatsApp ou e-mail para solicitar orçamento.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Contato Comercial | Nacho Factory",
    description:
      "Solicite orçamento para produtos prontos, produção terceirizada e armazenagem.",
    url: "/",
  },
}

export default function ContatoLayout({ children }: { children: React.ReactNode }) {
  return children
}
