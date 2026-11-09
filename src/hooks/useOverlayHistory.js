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
let pendingCloses = []
let pendingOpens = []
let flushScheduled = false

function scheduleFlush() {
  if (flushScheduled) return
  flushScheduled = true
  queueMicrotask(flush)
}

function removeEntry(entry) {
  overlayStack.splice(overlayStack.lastIndexOf(entry), 1)
}

// An onTop entry (the full-screen Filter menu) stays first in line for back,
// even if something opens behind it while it's up.
function addEntry(entry) {
  const end = overlayStack.length
  overlayStack.splice(overlayStack[end - 1]?.onTop ? end - 1 : end, 0, entry)
}

function flush() {
  flushScheduled = false
  const closes = pendingCloses.filter(entry => overlayStack.includes(entry))
  const opens = pendingOpens.filter(entry => !entry.closed)
  pendingCloses = []
  pendingOpens = []

  const swaps = Math.min(closes.length, opens.length)
  closes.slice(0, swaps).forEach(removeEntry)
  opens.slice(0, swaps).forEach(addEntry)
  if (swaps) window.history.replaceState({ sscOverlay: true }, '')

  // Left in overlayStack until the resulting popstate's listener removes
  // them — that keeps the array in lockstep with the real history depth,
  // since the browser hasn't actually traversed back yet.
  if (closes.length > swaps) window.history.go(swaps - closes.length)

  for (const entry of opens.slice(swaps)) {
    addEntry(entry)
    window.history.pushState({ sscOverlay: true }, '')
  }
}

function ensureListener() {
  if (listenerBound) return
  listenerBound = true
  window.addEventListener('popstate', () => {
    // Entries already marked closed mean this popstate came from our own
    // history.go() (an in-app close consuming its entry), not a real back
    // gesture — remove exactly those, even if something else is on top.
    const consumed = overlayStack.filter(entry => entry.closed)
    if (consumed.length) {
      consumed.forEach(removeEntry)
      return
    }
    const top = overlayStack.pop()
    if (top) {
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
export function useOverlayHistory(isOpen, close, onTop = false) {
  const closeRef = useRef(close)
  const entryRef = useRef(null)
  const wasOpen = useRef(isOpen)

  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    ensureListener()
  }, [])

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const entry = { closed: false, onTop, close: () => closeRef.current() }
      entryRef.current = entry
      pendingOpens.push(entry)
      scheduleFlush()
    } else if (!isOpen && wasOpen.current) {
      const entry = entryRef.current
      entryRef.current = null
      if (entry && !entry.closed) {
        entry.closed = true
        pendingCloses.push(entry)
        scheduleFlush()
      }
    }
    wasOpen.current = isOpen
  }, [isOpen, onTop])
}
