import { PrivateShell } from "@/components/private-shell"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <PrivateShell area="admin" userName={user.name} organizationName="Nacho Factory">
      {children}
    </PrivateShell>
  )
}
