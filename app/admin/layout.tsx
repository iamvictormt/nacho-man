import { PrivateShell } from "@/components/private-shell"
import { getPendingFranchiseeUsersCount } from "@/lib/admin-user-notifications"
import { requireAdmin } from "@/lib/auth"
import { getStoreWhatsAppNumber } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, whatsappNumber, pendingFranchiseeUsersCount] = await Promise.all([
    requireAdmin(),
    getStoreWhatsAppNumber(),
    getPendingFranchiseeUsersCount(),
  ])
  return (
    <PrivateShell
      area="admin"
      userName={user.name}
      userRole={user.role}
      organizationName="Nacho Factory"
      whatsappNumber={whatsappNumber}
      pendingFranchiseeUsersCount={pendingFranchiseeUsersCount}
    >
      {children}
    </PrivateShell>
  )
}
