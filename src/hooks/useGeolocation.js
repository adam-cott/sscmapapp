import { useState, useCallback, useEffect } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'

const wasAsked = () => {
  try { return localStorage.getItem(STORAGE_KEYS.locationAsked) === '1' } catch { return false }
}
const markAsked = () => {
  try { localStorage.setItem(STORAGE_KEYS.locationAsked, '1') } catch { /* private mode */ }
}

export function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [hasRequested, setHasRequested] = useState(wasAsked)

  const fetchPosition = useCallback((opts = {}) => {
    if (!navigator.geolocation) return
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        if (err.code === 1) setPermissionDenied(true)
        else setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000, ...opts }
    )
  }, [])

  // Silently get location on launch and whenever the app comes back to the
  // front, if permission was already granted. A browser-level block counts as answered.
  useEffect(() => {
    if (!navigator.permissions) return
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          setHasRequested(true)
          fetchPosition()
        } else if (result.state === 'denied') {
          setHasRequested(true)
          setPermissionDenied(true)
        }
      }).catch(() => {})
    }
    refresh()
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [fetchPosition])

  // Call this when the user taps "Allow" on the in-app prompt, or Near Me.
  // This triggers the browser's native permission popup if needed.
  const requestLocation = useCallback((opts) => {
    setHasRequested(true)
    markAsked()

    if (!navigator.geolocation) {
      setPermissionDenied(true)
      return
    }
    fetchPosition(opts)
  }, [fetchPosition])

  // Call this when the user taps "Not now".
  const decline = useCallback(() => {
    setHasRequested(true)
    setPermissionDenied(true)
    markAsked()
  }, [])

  return { coords, error, loading, permissionDenied, hasRequested, requestLocation, decline }
}
