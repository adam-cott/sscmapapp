import { useState, useMemo, useCallback } from 'react'
import { filterDeals } from '../utils/dealHelpers'

export function useFilters(deals) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState([])

  const toggleCategory = useCallback((category) => {
    setActiveCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setActiveCategories([])
  }, [])

  const filteredDeals = useMemo(
    () => filterDeals(deals, searchQuery, activeCategories),
    [deals, searchQuery, activeCategories]
  )

  return {
    searchQuery,
    setSearchQuery,
    activeCategories,
    toggleCategory,
    clearFilters,
    filteredDeals,
  }
}
