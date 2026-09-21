import { useEffect, useState } from 'react'

/**
 * Returns true only after `isLoading` has been true for at least `delay` ms.
 * Prevents skeleton flashes when data arrives faster than a single render cycle.
 */
export function useDelayedLoading(isLoading: boolean, delay = 250): boolean {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShow(false)
      return
    }
    const id = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(id)
  }, [isLoading, delay])

  return show
}
