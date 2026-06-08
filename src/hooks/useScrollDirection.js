import { useEffect, useState } from 'react'

export default function useScrollDirection({ threshold = 12 } = {}) {
  const [state, setState] = useState({ direction: 'up', scrollY: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    let previousY = window.scrollY || 0

    const onScroll = () => {
      const currentY = window.scrollY || 0
      const delta = currentY - previousY

      if (Math.abs(delta) >= threshold) {
        setState({
          direction: delta > 0 ? 'down' : 'up',
          scrollY: currentY
        })
        previousY = currentY
      } else {
        setState(current => ({ ...current, scrollY: currentY }))
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return state
}
