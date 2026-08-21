import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LoginExperience } from "@/components/login-experience"
import { getCurrentUser, isAdminRole } from "@/lib/auth"
import { getLoginSideContent } from "@/lib/site-settings"

export const metadata: Metadata = {
  title: "Acesso ao Marketplace",
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect(user.mustChangePassword ? "/alterar-senha" : isAdminRole(user.role) ? "/admin" : "/marketplace")
  const sideContent = await getLoginSideContent()

  return <LoginExperience sideContent={sideContent} />
}
