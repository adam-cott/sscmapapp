import { useLocalStorage } from './useLocalStorage'

export function useFaves() {
  const [faves, setFaves] = useLocalStorage('ssc_faves_v1', [])

  const toggleFave = (dealId) => {
    setFaves(prev =>
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    )
  }

  const isFave = (dealId) => faves.includes(dealId)
  const clearFaves = () => setFaves([])

  return { faves, toggleFave, isFave, clearFaves }
}
