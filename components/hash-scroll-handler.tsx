"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

const FALLBACK_HEADER_OFFSET = 152
const PENDING_HASH_KEY = "nacho-pending-hash"
const PENDING_URL_KEY = "nacho-pending-url"

function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth") {
  const id = hash.replace(/^#/, "")
  const element = document.getElementById(id)

  if (!element) return false

  const top = element.getBoundingClientRect().top + window.scrollY - getHeaderOffset()
  window.scrollTo({ top: Math.max(0, top), behavior })
  return true
}

function getHeaderOffset() {
  const topBar = document.querySelector<HTMLElement>("[data-site-topbar]")
  const navbar = document.querySelector<HTMLElement>("[data-site-navbar]")
  const topBarHeight = topBar?.getBoundingClientRect().height ?? 0
  const navbarHeight = navbar?.getBoundingClientRect().height ?? 0

  return Math.max(FALLBACK_HEADER_OFFSET, topBarHeight + navbarHeight + 24)
}

export function HashScrollHandler() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest("a[href*='#']")

      if (!(anchor instanceof HTMLAnchorElement)) return

      const url = new URL(anchor.href)
      const isSameOrigin = url.origin === window.location.origin
      const hasHash = url.hash.length > 1

      if (!isSameOrigin || !hasHash) return

      event.preventDefault()

      if (url.pathname === window.location.pathname) {
        window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`)
        scrollToHash(url.hash)
        return
      }

      sessionStorage.setItem(PENDING_HASH_KEY, url.hash)
      sessionStorage.setItem(PENDING_URL_KEY, `${url.pathname}${url.search}${url.hash}`)
      router.push(`${url.pathname}${url.search}`, { scroll: false })
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [router])

  useEffect(() => {
    const pendingHash = sessionStorage.getItem(PENDING_HASH_KEY)
    const hash = pendingHash || window.location.hash

    if (!hash) return

    if (pendingHash) {
      sessionStorage.removeItem(PENDING_HASH_KEY)
    }
    const pendingUrl = sessionStorage.getItem(PENDING_URL_KEY)
    if (pendingUrl) {
      sessionStorage.removeItem(PENDING_URL_KEY)
    }

    let attempts = 0
    let frame = 0

    function tryScroll() {
      attempts += 1

      if (scrollToHash(hash, "smooth")) {
        if (pendingUrl) {
          window.history.replaceState(null, "", pendingUrl)
        }
        return
      }

      if (attempts >= 12) {
        return
      }

      frame = window.requestAnimationFrame(tryScroll)
    }

    frame = window.requestAnimationFrame(tryScroll)
    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  return null
}
