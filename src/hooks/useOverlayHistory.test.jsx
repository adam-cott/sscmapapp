import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
    await new Promise(resolve => setTimeout(resolve, 0))
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
    await new Promise(resolve => setTimeout(resolve, 0))

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
})
