import { NextRequest, NextResponse } from "next/server"
import { decryptSession, SESSION_COOKIE } from "@/lib/session"

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value)
  const isAdmin = session?.role === "ADMIN" || session?.role === "ADMIN_MASTER"
  const isAdminRoute = pathname.startsWith("/admin")
  const isIndicatorsRoute = pathname.startsWith("/indicadores")
  const isMarketplaceRoute = pathname.startsWith("/marketplace")

  if (!session && (isAdminRoute || isIndicatorsRoute || isMarketplaceRoute)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && (isAdminRoute || isIndicatorsRoute) && !isAdmin) {
    return NextResponse.redirect(new URL("/marketplace", request.url))
  }

  if (session && isMarketplaceRoute && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/indicadores/:path*", "/marketplace/:path*"],
}
