import { PrivateShell } from "@/components/private-shell"
import { MarketplaceCartButton } from "@/components/marketplace-cart-button"
import { MarketplaceCartDrawer } from "@/components/marketplace-cart-drawer"
import { requireMarketplaceUser } from "@/lib/auth"
import { getPaymentDiscountSettings, getStoreWhatsAppNumber } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const [user, whatsappNumber, paymentDiscounts] = await Promise.all([
    requireMarketplaceUser(),
    getStoreWhatsAppNumber(),
    getPaymentDiscountSettings(),
  ])
  return (
    <PrivateShell
      area="marketplace"
      userName={user.name}
      userRole={user.role}
      organizationName={user.franchise?.tradeName ?? "Cliente Nacho Man"}
      whatsappNumber={whatsappNumber}
      showMarketplaceCombos={user.role === "FRANCHISEE"}
    >
      {children}
      <MarketplaceCartButton />
      <MarketplaceCartDrawer
        pixDiscountPercent={paymentDiscounts.pixDiscountPercent}
        cardDiscountPercent={paymentDiscounts.cardDiscountPercent}
        boletoDiscountPercent={paymentDiscounts.boletoDiscountPercent}
        allowBoleto={user.role === "FRANCHISEE"}
      />
    </PrivateShell>
  )
}
