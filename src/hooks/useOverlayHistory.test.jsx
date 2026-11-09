import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useOverlayHistory } from './useOverlayHistory'

function flushMicrotasks() {
  return new Promise(resolve => queueMicrotask(resolve))
}

describe('useOverlayHistory', () => {
  beforeEach(() => {
    // Reset to a clean history stack for each test.
    window.history.replaceState(null, '')
  })

  it('pure open pushes one entry, pure close consumes it via back()', async () => {
    const close = vi.fn()
    let isOpen = false
    const { rerender } = renderHook(() => useOverlayHistory(isOpen, close))

    const startLength = window.history.length
    isOpen = true
    rerender()
    await flushMicrotasks()
    expect(window.history.length).toBe(startLength + 1)

    isOpen = false
    rerender()
    await flushMicrotasks()
    // history.back() dispatches popstate asynchronously
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(close).not.toHaveBeenCalled() // closed via in-app path, not popstate
  })

  it('real popstate (hardware back) calls close exactly once', async () => {
    const close = vi.fn()
    let isOpen = false
    const { rerender } = renderHook(() => useOverlayHistory(isOpen, close))
    isOpen = true
    rerender()
    await flushMicrotasks()

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('back closes only the topmost of two stacked overlays', async () => {
    const closeList = vi.fn()
    const closeModal = vi.fn()
    let listOpen = false
    let modalOpen = false
    const { rerender } = renderHook(() => {
      useOverlayHistory(listOpen, closeList)
      useOverlayHistory(modalOpen, closeModal)
    })

    listOpen = true
    rerender()
    await flushMicrotasks()
    modalOpen = true
    rerender()
    await flushMicrotasks()

    // One physical back press -> one popstate
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(closeModal).toHaveBeenCalledTimes(1)
    expect(closeList).not.toHaveBeenCalled()

    // simulate React applying the modal's close (isOpen -> false)
    modalOpen = false
    rerender()
    await flushMicrotasks()

    // second back press should now close the list
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(closeList).toHaveBeenCalledTimes(1)
  })

  it('same-tick close+open (picker -> modal handoff) does not misfire a stray close', async () => {
    const closePicker = vi.fn()
    const closeModal = vi.fn()
    let pickerOpen = false
    let modalOpen = false
    const { rerender } = renderHook(() => {
      useOverlayHistory(pickerOpen, closePicker)
      useOverlayHistory(modalOpen, closeModal)
    })

    pickerOpen = true
    rerender()
    await flushMicrotasks()

    const lengthWithPickerOpen = window.history.length

    // Same commit: picker closes, modal opens (handleSelectFromPicker)
    pickerOpen = false
    modalOpen = true
    rerender()
    await flushMicrotasks()
    await new Promise(resolve => setTimeout(resolve, 20))

    // Net depth should be unchanged (replaceState swap, not back()+pushState)
    expect(window.history.length).toBe(lengthWithPickerOpen)
    expect(closePicker).not.toHaveBeenCalled()
    expect(closeModal).not.toHaveBeenCalled()

    // One back press should now close the modal (the current top), not
    // silently do nothing and not throw
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(closeModal).toHaveBeenCalledTimes(1)
    expect(closePicker).not.toHaveBeenCalled()
  })

  it('an in-app close of a lower overlay leaves the top one open', async () => {
    const closeLower = vi.fn()
    const closeTop = vi.fn()
    let lowerOpen = false
    let topOpen = false
    const { rerender } = renderHook(() => {
      useOverlayHistory(lowerOpen, closeLower)
      useOverlayHistory(topOpen, closeTop)
    })
    lowerOpen = true
    rerender()
    await flushMicrotasks()
    topOpen = true
    rerender()
    await flushMicrotasks()

    lowerOpen = false
    rerender()
    await flushMicrotasks()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(closeTop).not.toHaveBeenCalled()

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(closeTop).toHaveBeenCalledTimes(1)
    expect(closeLower).not.toHaveBeenCalled()
  })

  it('an onTop overlay closes first even if something opened behind it', async () => {
    const closeMenu = vi.fn()
    const closeList = vi.fn()
    let menuOpen = false
    let listOpen = false
    const { rerender } = renderHook(() => {
      useOverlayHistory(menuOpen, closeMenu, true)
      useOverlayHistory(listOpen, closeList)
    })
    menuOpen = true
    rerender()
    await flushMicrotasks()
    listOpen = true
    rerender()
    await flushMicrotasks()

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(closeMenu).toHaveBeenCalledTimes(1)
    expect(closeList).not.toHaveBeenCalled()

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(closeList).toHaveBeenCalledTimes(1)
  })
})
