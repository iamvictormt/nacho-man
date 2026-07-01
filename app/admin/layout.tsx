import { PrivateShell } from "@/components/private-shell"
import { requireAdmin } from "@/lib/auth"
import { getStoreWhatsAppNumber } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, whatsappNumber] = await Promise.all([requireAdmin(), getStoreWhatsAppNumber()])
  return (
    <PrivateShell
      area="admin"
      userName={user.name}
      userRole={user.role}
      organizationName="Nacho Factory"
      whatsappNumber={whatsappNumber}
    >
      {children}
    </PrivateShell>
  )
}
