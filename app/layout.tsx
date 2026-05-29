import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TopBar } from '@/components/top-bar'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { CartDrawerWrapper } from '@/components/cart-drawer-wrapper'
import { HashScrollHandler } from '@/components/hash-scroll-handler'
import { absoluteUrl, defaultSeoDescription, siteName, siteUrl } from '@/lib/seo'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Nacho Factory | Alimentos Prontos para Food Service',
    template: `%s | ${siteName}`,
  },
  description: defaultSeoDescription,
  applicationName: siteName,
  keywords: [
    'alimentos prontos',
    'food service',
    'carnes congeladas',
    'molhos mexicanos',
    'Nacho Factory',
    'Nacho Man',
    'produtos para restaurantes',
    'produtos para hamburguerias',
    'produção terceirizada de alimentos',
    'armazenagem congelada',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName,
    title: 'Nacho Factory | Alimentos Prontos para Food Service',
    description: defaultSeoDescription,
    images: [
      {
        url: absoluteUrl('/embalagens-3.webp'),
        width: 1200,
        height: 630,
        alt: 'Produtos Nacho Factory para food service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nacho Factory | Alimentos Prontos para Food Service',
    description: defaultSeoDescription,
    images: [absoluteUrl('/embalagens-3.webp')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  name: siteName,
  url: siteUrl,
  image: absoluteUrl('/estrutura.webp'),
  email: 'factory.administrativo@nachomanbrasil.com.br',
  telephone: '+55 47 9726-9146',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Blumenau',
    addressRegion: 'SC',
    addressCountry: 'BR',
  },
  description: defaultSeoDescription,
  sameAs: [
    'https://instagram.com/nachoman',
    'https://facebook.com/nachoman',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${montserrat.className} font-sans antialiased`}>
        <TopBar />
        <Navbar />
        <HashScrollHandler />
        <main>{children}</main>
        <SiteFooter />
        <CartDrawerWrapper />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
