import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { getDealUsageState } from '../utils/dealHelpers'

const STORAGE_KEY = 'ssc_usage_v1'

export function useDeals(deals) {
  const [usageMap, setUsageMap] = useLocalStorage(STORAGE_KEY, {})

  const recordUse = useCallback((dealId) => {
    setUsageMap(prev => ({
      ...prev,
      [dealId]: (prev[dealId] ?? 0) + 1,
    }))
  }, [setUsageMap])

  const resetAll = useCallback(() => {
    setUsageMap({})
  }, [setUsageMap])

  const dealsWithUsage = deals.map(deal => ({
    ...deal,
    usage: getDealUsageState(deal, usageMap),
  }))

  return { dealsWithUsage, usageMap, recordUse, resetAll }
}
