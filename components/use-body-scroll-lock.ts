"use client"

import * as React from "react"

let lockCount = 0
let previousBodyOverflow = ""
let previousHtmlOverflow = ""
let previousBodyOverscroll = ""
let previousHtmlOverscroll = ""

function lockScroll() {
  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    previousHtmlOverflow = document.documentElement.style.overflow
    previousBodyOverscroll = document.body.style.overscrollBehavior
    previousHtmlOverscroll = document.documentElement.style.overscrollBehavior

    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    document.body.style.overscrollBehavior = "none"
    document.documentElement.style.overscrollBehavior = "none"
  }

  lockCount += 1
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)

  if (lockCount === 0) {
    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow
    document.body.style.overscrollBehavior = previousBodyOverscroll
    document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
  }
}

export function useBodyScrollLock(locked: boolean) {
  React.useEffect(() => {
    if (!locked) return

    lockScroll()
    return unlockScroll
  }, [locked])
}
