import { useLocalStorage } from './useLocalStorage'

export function useUsageLog() {
  const [usageLog, setUsageLog] = useLocalStorage('ssc_usage_log_v1', [])

  const logUse = (dealId) => {
    setUsageLog(prev => [...prev, { dealId, usedAt: new Date().toISOString() }])
  }

  const clearLog = () => setUsageLog([])

  return { usageLog, logUse, clearLog }
}
