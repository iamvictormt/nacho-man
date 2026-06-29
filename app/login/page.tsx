import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LoginExperience } from "@/components/login-experience"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Acesso ao Marketplace",
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/marketplace")

  return <LoginExperience />
}
