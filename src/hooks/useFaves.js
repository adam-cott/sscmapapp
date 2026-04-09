import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '../constants/storageKeys'

export function useFaves() {
  const [faves, setFaves] = useLocalStorage(STORAGE_KEYS.faves, [])

  const toggleFave = (dealId) => {
    setFaves(prev =>
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    )
  }

  const isFave = (dealId) => faves.includes(dealId)
  const clearFaves = () => setFaves([])

  return { faves, toggleFave, isFave, clearFaves }
}
