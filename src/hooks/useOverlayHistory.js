import { useEffect, useRef } from 'react'

// Shared across every useOverlayHistory instance (there's only ever one
// App), so a single physical back press closes only the topmost open thing
// even when several are stacked (e.g. a deal modal opened from Home's
// filtered list, or from the multi-deal location picker).
const overlayStack = []
let listenerBound = false

// Some state transitions close one of these and open another in the exact
// same React commit (e.g. picking a deal from the multi-deal picker closes
// the picker and opens that deal's modal together). history.back() doesn't
// fire its popstate synchronously, so calling back() for the close and
// pushState() for the open in the same tick isn't reliably ordered — a
// close and an open recorded in the same microtask are batched here and
// resolved as one replaceState swap (net stack depth unchanged, no real
// back-navigation) instead of racing a back() against a pushState().
let pendingClose = null
let pendingOpens = []
let flushScheduled = false

function scheduleFlush() {
  if (flushScheduled) return
  flushScheduled = true
  queueMicrotask(flush)
}

function flush() {
  flushScheduled = false
  const close = pendingClose
  const opens = pendingOpens
  pendingClose = null
  pendingOpens = []

  if (close && opens.length) {
    const idx = overlayStack.lastIndexOf(close)
    if (idx !== -1) overlayStack.splice(idx, 1)
    overlayStack.push(...opens)
    window.history.replaceState({ sscOverlay: true }, '')
  } else if (close) {
    // Left in overlayStack until the resulting popstate's listener removes
    // it below — that keeps the array in lockstep with the real history
    // depth, since the browser hasn't actually traversed back yet.
    window.history.back()
  } else if (opens.length) {
    for (const entry of opens) {
      overlayStack.push(entry)
      window.history.pushState({ sscOverlay: true }, '')
    }
  }
}

function ensureListener() {
  if (listenerBound) return
  listenerBound = true
  window.addEventListener('popstate', () => {
    const top = overlayStack.pop()
    // `top.closed` is already true when this popstate was caused by our
    // own programmatic history.back() (an in-app close consuming its
    // entry) rather than a real back gesture — skip re-closing in that case.
    if (top && !top.closed) {
      top.closed = true
      top.close()
    }
  })
}

// Makes `isOpen` participate in browser/PWA back navigation: opening pushes
// one history entry, and back (hardware button, edge-swipe, or browser UI)
// calls `close` instead of leaving the app. Closing via in-app UI (an X
// button, a "clear filters" tap, etc.) consumes the same entry so the
// history stack never grows unbounded.
export function useOverlayHistory(isOpen, close) {
  const closeRef = useRef(close)
  closeRef.current = close
  const entryRef = useRef(null)
  const wasOpen = useRef(isOpen)

  useEffect(() => {
    ensureListener()
  }, [])

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const entry = { closed: false, close: () => closeRef.current() }
      entryRef.current = entry
      pendingOpens.push(entry)
      scheduleFlush()
    } else if (!isOpen && wasOpen.current) {
      const entry = entryRef.current
      entryRef.current = null
      if (entry && !entry.closed) {
        entry.closed = true
        pendingClose = entry
        scheduleFlush()
      }
    }
    wasOpen.current = isOpen
  }, [isOpen])
}
