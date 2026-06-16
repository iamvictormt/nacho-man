"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

const FALLBACK_HEADER_HEIGHT = 88
const SECTION_OVERLAP = 28
const MAX_LAYOUT_WAIT_MS = 520
const PENDING_HASH_KEY = "nacho-pending-hash"
const PENDING_URL_KEY = "nacho-pending-url"

let pendingScrollTimer = 0
let pendingAnimationFrame = 0

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
}

function getHeaderHeight() {
  const navbarMain = document.querySelector<HTMLElement>("[data-site-navbar-main]")
  const navbar = document.querySelector<HTMLElement>("[data-site-navbar]")

  return (
    navbarMain?.getBoundingClientRect().height ||
    navbar?.getBoundingClientRect().height ||
    FALLBACK_HEADER_HEIGHT
  )
}

function isMobileMenuExpanded() {
  const navbar = document.querySelector<HTMLElement>("[data-site-navbar]")
  const navbarMain = document.querySelector<HTMLElement>("[data-site-navbar-main]")
  const navbarHeight = navbar?.getBoundingClientRect().height ?? 0
  const navbarMainHeight = navbarMain?.getBoundingClientRect().height ?? 0

  return navbarMainHeight > 0 && navbarHeight > navbarMainHeight + 16
}

function getHashElement(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""))
  return id ? document.getElementById(id) : null
}

function getTargetViewportTop() {
  return Math.max(0, getHeaderHeight() - SECTION_OVERLAP)
}

function isAlreadyAtHash(hash: string) {
  const element = getHashElement(hash)
  if (!element) return false

  return Math.abs(element.getBoundingClientRect().top - getTargetViewportTop()) <= 4
}

function cancelPendingScroll() {
  window.clearTimeout(pendingScrollTimer)
  window.cancelAnimationFrame(pendingAnimationFrame)
}

function closeMobileMenu() {
  window.dispatchEvent(new Event("nacho-close-mobile-menu"))
}

function scrollToHash(hash: string, behavior: ScrollBehavior = getScrollBehavior()) {
  const element = getHashElement(hash)
  if (!element) return false

  const elementTop = element.getBoundingClientRect().top + window.scrollY
  const scrollTop = elementTop - getTargetViewportTop()

  window.scrollTo({ top: Math.max(0, scrollTop), behavior })
  return true
}

function scrollWhenLayoutIsReady(hash: string, behavior: ScrollBehavior = getScrollBehavior()) {
  cancelPendingScroll()

  const startedAt = performance.now()

  function attempt() {
    if (isAlreadyAtHash(hash)) return

    const waitedLongEnough = performance.now() - startedAt >= MAX_LAYOUT_WAIT_MS
    if (!isMobileMenuExpanded() || waitedLongEnough) {
      scrollToHash(hash, behavior)
      return
    }

    pendingAnimationFrame = window.requestAnimationFrame(attempt)
  }

  pendingTimerAfterEvent(() => {
    pendingAnimationFrame = window.requestAnimationFrame(attempt)
  })
}

function pendingTimerAfterEvent(callback: () => void) {
  pendingScrollTimer = window.setTimeout(callback, 0)
}

function updateUrl(pathname: string, search: string, hash: string, mode: "push" | "replace") {
  const nextUrl = `${pathname}${search}${hash}`

  if (mode === "replace") {
    window.history.replaceState(null, "", nextUrl)
    return
  }

  if (window.location.pathname + window.location.search + window.location.hash !== nextUrl) {
    window.history.pushState(null, "", nextUrl)
  }
}

export function HashScrollHandler() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const anchor = (event.target as Element | null)?.closest("a[href*='#']")
      if (!(anchor instanceof HTMLAnchorElement)) return

      const url = new URL(anchor.href)
      if (url.origin !== window.location.origin || url.hash.length <= 1) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const samePage = url.pathname === window.location.pathname && url.search === window.location.search
      const finalUrl = `${url.pathname}${url.search}${url.hash}`

      if (samePage) {
        if (window.location.hash === url.hash) {
          cancelPendingScroll()
          if (isMobileMenuExpanded()) {
            closeMobileMenu()
            scrollWhenLayoutIsReady(url.hash)
          }
          return
        }

        closeMobileMenu()
        updateUrl(url.pathname, url.search, url.hash, "push")
        window.dispatchEvent(new HashChangeEvent("hashchange"))
        scrollWhenLayoutIsReady(url.hash)
        return
      }

      cancelPendingScroll()
      closeMobileMenu()
      sessionStorage.setItem(PENDING_HASH_KEY, url.hash)
      sessionStorage.setItem(PENDING_URL_KEY, finalUrl)
      router.push(`${url.pathname}${url.search}`, { scroll: false })
    }

    document.addEventListener("click", handleClick, true)
    return () => {
      cancelPendingScroll()
      document.removeEventListener("click", handleClick, true)
    }
  }, [router])

  useEffect(() => {
    function handlePopState() {
      cancelPendingScroll()

      if (window.location.hash) {
        scrollWhenLayoutIsReady(window.location.hash)
        return
      }

      if (window.location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: getScrollBehavior() })
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    const pendingHash = sessionStorage.getItem(PENDING_HASH_KEY)
    const pendingUrl = sessionStorage.getItem(PENDING_URL_KEY)
    const hash = pendingHash || window.location.hash

    if (!hash) return

    sessionStorage.removeItem(PENDING_HASH_KEY)
    sessionStorage.removeItem(PENDING_URL_KEY)

    let attempts = 0

    function attemptScroll() {
      attempts += 1

      if (getHashElement(hash)) {
        if (pendingUrl) {
          window.history.replaceState(null, "", pendingUrl)
        }
        scrollWhenLayoutIsReady(hash)
        return
      }

      if (attempts < 20) {
        pendingAnimationFrame = window.requestAnimationFrame(attemptScroll)
      }
    }

    cancelPendingScroll()
    pendingAnimationFrame = window.requestAnimationFrame(attemptScroll)
    return cancelPendingScroll
  }, [pathname])

  return null
}
