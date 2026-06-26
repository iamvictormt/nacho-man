"use client"

import { useEffect } from "react"

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior
    const originalBodyOverflow = document.body.style.overflow
    const originalBodyPaddingRight = document.body.style.paddingRight
    const originalBodyOverscrollBehavior = document.body.style.overscrollBehavior
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.documentElement.style.overflow = "hidden"
    document.documentElement.style.overscrollBehavior = "none"
    document.body.style.overflow = "hidden"
    document.body.style.overscrollBehavior = "none"
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow
      document.documentElement.style.overscrollBehavior = originalHtmlOverscrollBehavior
      document.body.style.overflow = originalBodyOverflow
      document.body.style.paddingRight = originalBodyPaddingRight
      document.body.style.overscrollBehavior = originalBodyOverscrollBehavior
    }
  }, [locked])
}
