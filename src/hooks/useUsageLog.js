import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '../constants/storageKeys'

export function useUsageLog() {
  const [usageLog, setUsageLog] = useLocalStorage(STORAGE_KEYS.usageLog, [])

  const logUse = (dealId) => {
    setUsageLog(prev => [...prev, { dealId, usedAt: new Date().toISOString() }])
  }

  const clearLog = () => setUsageLog([])

  return { usageLog, logUse, clearLog }
}
