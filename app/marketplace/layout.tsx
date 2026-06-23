import { PrivateShell } from "@/components/private-shell"
import { MarketplaceCartButton } from "@/components/marketplace-cart-button"
import { MarketplaceCartDrawer } from "@/components/marketplace-cart-drawer"
import { requireFranchisee } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireFranchisee()
  return (
    <PrivateShell area="marketplace" userName={user.name} organizationName={user.franchise?.tradeName}>
      {children}
      <MarketplaceCartButton />
      <MarketplaceCartDrawer />
    </PrivateShell>
  )
}
