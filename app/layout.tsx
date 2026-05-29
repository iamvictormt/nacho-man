import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TopBar } from '@/components/top-bar'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { CartDrawerWrapper } from '@/components/cart-drawer-wrapper'
import { HashScrollHandler } from '@/components/hash-scroll-handler'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Nacho Factory | Indústria de Alimentos Congelados para Food Service',
  description: 'Produção de alimentos congelados, molhos, empanados e proteínas prontas para food service. Armazenagem refrigerada em Blumenau-SC.',
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
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
