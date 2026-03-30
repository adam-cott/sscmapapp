import { useState, useCallback, useEffect } from 'react'

export function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)

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

  // Silently get location on mount if permission was already granted
  useEffect(() => {
    if (!navigator.permissions) return
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted') {
        setHasRequested(true)
        fetchPosition()
      }
    })
  }, [fetchPosition])

  // Call this when the user taps "Allow" on the in-app prompt.
  // This triggers the browser's native permission popup.
  const requestLocation = useCallback(() => {
    setHasRequested(true)

    if (!navigator.geolocation) {
      setPermissionDenied(true)
      return
    }
    fetchPosition()
  }, [fetchPosition])

  // Call this when the user taps "Not now".
  const decline = useCallback(() => {
    setHasRequested(true)
    setPermissionDenied(true)
  }, [])

  return { coords, error, loading, permissionDenied, hasRequested, requestLocation, decline }
}
