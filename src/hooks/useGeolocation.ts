import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  isLoading: boolean
}

/**
 * Requests the user's browser geolocation (only after they grant permission).
 * Never used to expose precise location publicly — only for proximity search.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: false,
  })

  function request() {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser.' }))
      return
    }
    setState((s) => ({ ...s, isLoading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          isLoading: false,
        })
      },
      (err) => {
        setState({
          latitude: null,
          longitude: null,
          error: err.message,
          isLoading: false,
        })
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  return { ...state, request }
}
