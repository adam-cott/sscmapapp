import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { useGeolocation } from './useGeolocation'

let permState
const getCurrentPosition = vi.fn((ok) => ok({ coords: { latitude: 40, longitude: -111 } }))

beforeEach(() => {
  localStorage.clear()
  getCurrentPosition.mockClear()
  permState = 'prompt'
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
  Object.defineProperty(navigator, 'permissions', {
    value: { query: () => Promise.resolve({ state: permState }) }, configurable: true,
  })
})

describe('useGeolocation', () => {
  it('remembers "Not now" across launches', () => {
    const first = renderHook(() => useGeolocation())
    expect(first.result.current.hasRequested).toBe(false)
    act(() => first.result.current.decline())
    expect(localStorage.getItem(STORAGE_KEYS.locationAsked)).toBe('1')
    expect(renderHook(() => useGeolocation()).result.current.hasRequested).toBe(true)
  })

  it('treats a browser-level block as answered', async () => {
    permState = 'denied'
    const { result } = renderHook(() => useGeolocation())
    await waitFor(() => expect(result.current.hasRequested).toBe(true))
  })

  it('re-reads location when the app comes back to the front', async () => {
    permState = 'granted'
    renderHook(() => useGeolocation())
    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalledTimes(1))
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalledTimes(2))
  })

  it('passes a fresher max age through for Near Me', () => {
    const { result } = renderHook(() => useGeolocation())
    act(() => result.current.requestLocation({ maximumAge: 60000 }))
    expect(getCurrentPosition.mock.calls[0][2].maximumAge).toBe(60000)
  })
})
