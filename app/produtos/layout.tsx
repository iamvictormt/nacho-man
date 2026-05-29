import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Produtos para Food Service",
  description:
    "Catálogo de carnes congeladas, molhos, salsas, bases, temperos e kits prontos para operações de food service.",
  alternates: {
    canonical: "/produtos",
  },
  openGraph: {
    title: "Produtos para Food Service | Nacho Factory",
    description:
      "Conheça os produtos prontos da Nacho Factory para restaurantes, hamburguerias, eventos e revendedores.",
    url: "/produtos",
  },
}

export default function ProdutosLayout({ children }: { children: React.ReactNode }) {
  return children
}
