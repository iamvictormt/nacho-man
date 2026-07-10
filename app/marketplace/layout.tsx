import { PrivateShell } from "@/components/private-shell"
import { MarketplaceCartButton } from "@/components/marketplace-cart-button"
import { MarketplaceCartDrawer } from "@/components/marketplace-cart-drawer"
import { requireMarketplaceUser } from "@/lib/auth"
import { getPaymentDiscountSettings, getStoreWhatsAppNumber } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

function discountForRole(percent: number, franchiseeOnly: boolean, role: string) {
  return franchiseeOnly && role !== "FRANCHISEE" ? 0 : percent
}

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
      showMarketplaceCombos
    >
      {children}
      <MarketplaceCartButton />
      <MarketplaceCartDrawer
        pixDiscountPercent={discountForRole(
          paymentDiscounts.pixDiscountPercent,
          paymentDiscounts.pixFranchiseeOnly,
          user.role
        )}
        cardDiscountPercent={discountForRole(
          paymentDiscounts.cardDiscountPercent,
          paymentDiscounts.cardFranchiseeOnly,
          user.role
        )}
        boletoDiscountPercent={discountForRole(
          paymentDiscounts.boletoDiscountPercent,
          paymentDiscounts.boletoFranchiseeOnly,
          user.role
        )}
        allowBoleto={user.role === "FRANCHISEE"}
      />
    </PrivateShell>
  )
}
