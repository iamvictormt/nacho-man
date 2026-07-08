import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SiteChrome } from "@/components/site-chrome"
import { absoluteUrl, defaultSeoDescription, siteName, siteUrl } from "@/lib/seo"
import { getStoreWhatsAppNumber } from "@/lib/site-settings"
import { formatWhatsAppDisplay } from "@/lib/whatsapp"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nacho Factory | Alimentos Prontos para Food Service",
    template: `%s | ${siteName}`,
  },
  description: defaultSeoDescription,
  applicationName: siteName,
  manifest: "/site-20260618.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-20260618.ico", sizes: "any" },
      { url: "/icon-20260618.svg", type: "image/svg+xml" },
      { url: "/icon-20260618.png", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon-20260618.png",
        type: "image/png",
      },
    ],
  },
  keywords: [
    "alimentos prontos",
    "food service",
    "carnes congeladas",
    "molhos mexicanos",
    "Nacho Factory",
    "Nacho Man",
    "produtos para restaurantes",
    "produtos para hamburguerias",
    "produção terceirizada de alimentos",
    "armazenagem congelada",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName,
    title: "Nacho Factory | Alimentos Prontos para Food Service",
    description: defaultSeoDescription,
    images: [
      {
        url: absoluteUrl("/embalagens-3.webp"),
        width: 1200,
        height: 630,
        alt: "Produtos Nacho Factory para food service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nacho Factory | Alimentos Prontos para Food Service",
    description: defaultSeoDescription,
    images: [absoluteUrl("/embalagens-3.webp")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: siteName,
  url: siteUrl,
  image: absoluteUrl("/estrutura.webp"),
  email: "factory.administrativo@nachomanbrasil.com.br",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Blumenau",
    addressRegion: "SC",
    addressCountry: "BR",
  },
  description: defaultSeoDescription,
  sameAs: ["https://instagram.com/nachoman", "https://facebook.com/nachoman"],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const whatsappNumber = await getStoreWhatsAppNumber()
  const whatsappDisplay = formatWhatsAppDisplay(whatsappNumber)
  const organizationJsonLdWithSettings = {
    ...organizationJsonLd,
    telephone: whatsappDisplay,
  }

  return (
    <html lang="pt-BR" className="bg-background" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Nacho Factory" />
      </head>
      <body className={`${montserrat.className} font-sans antialiased`}>
        <SiteChrome whatsappNumber={whatsappNumber}>{children}</SiteChrome>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLdWithSettings) }}
        />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
