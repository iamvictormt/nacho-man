import type { Metadata } from "next"
import { absoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Conheça a Fábrica",
  description:
    "Conheça a Nacho Factory: indústria com mais de 700m², câmara fria, túnel de ultracongelamento, produção própria e estoque.",
  alternates: {
    canonical: "/sobre",
  },
  openGraph: {
    title: "Conheça a Fábrica | Nacho Factory",
    description:
      "Estrutura industrial para produção de molhos, carnes, acompanhamentos e receitas exclusivas para food service.",
    url: "/sobre",
    images: [
      {
        url: absoluteUrl("/estrutura.webp"),
        width: 1200,
        height: 630,
        alt: "Estrutura industrial Nacho Factory",
      },
    ],
  },
}

export default function SobreLayout({ children }: { children: React.ReactNode }) {
  return children
}
