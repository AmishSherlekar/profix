import { useEffect, useRef } from 'react'

/**
 * Returns true when the browser tab is visible.
 * Used to pause background polling when the user is not looking at the page.
 */
export function usePageVisibility() {
  const isVisible = useRef(!document.hidden)

  useEffect(() => {
    const handler = () => {
      isVisible.current = !document.hidden
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return isVisible
}
