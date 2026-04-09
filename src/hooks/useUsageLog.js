import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '../constants/storageKeys'

export function useUsageLog() {
  const [usageLog, setUsageLog] = useLocalStorage(STORAGE_KEYS.usageLog, [])

  const logUse = (dealId) => {
    setUsageLog(prev => [...prev, { dealId, usedAt: new Date().toISOString() }])
  }

  const undoLog = (dealId) => {
    setUsageLog(prev => {
      const lastIdx = [...prev].map((e, i) => ({ e, i })).reverse().find(({ e }) => e.dealId === dealId)?.i
      return lastIdx !== undefined ? prev.filter((_, i) => i !== lastIdx) : prev
    })
  }

  const clearLog = () => setUsageLog([])

  return { usageLog, logUse, undoLog, clearLog }
}
