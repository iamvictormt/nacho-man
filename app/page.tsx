import { TopBar } from "@/components/top-bar"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { BenefitsBar } from "@/components/benefits-bar"
import { CategoriesSection } from "@/components/categories-section"
import { PromoBanners } from "@/components/promo-banners"
import { FeaturedProducts } from "@/components/featured-products"
import { NewsletterSection } from "@/components/newsletter-section"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawerWrapper } from "@/components/cart-drawer-wrapper"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Navbar />
      <HeroSection />
      <BenefitsBar />
      <CategoriesSection />
      <PromoBanners />
      <FeaturedProducts />
      <NewsletterSection />
      <SiteFooter />
      <CartDrawerWrapper />
    </main>
  )
}
