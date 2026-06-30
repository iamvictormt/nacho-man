import { NextRequest, NextResponse } from "next/server"
import { decryptSession, SESSION_COOKIE } from "@/lib/session"

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value)
  const isAdminRoute = pathname.startsWith("/admin")
  const isMarketplaceRoute = pathname.startsWith("/marketplace")

  if (!session && (isAdminRoute || isMarketplaceRoute)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && isAdminRoute && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/marketplace", request.url))
  }

  if (session && isMarketplaceRoute && session.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/marketplace/:path*"],
}
