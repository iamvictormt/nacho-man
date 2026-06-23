import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Avalie sua experiência",
  description: "Cadastre seu contato e conte como foi sua experiência com a Nacho Factory.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AvaliarLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
