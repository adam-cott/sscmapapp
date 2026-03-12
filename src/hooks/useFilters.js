import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { filterDeals, getNearestDistance } from '../utils/dealHelpers'
import { CATEGORY_LABELS } from '../utils/categoryColors'

export function useFilters(deals, userCoords) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState([])
  const [sortBy, setSortByState] = useState('az')

  // Track whether the user has explicitly chosen a sort mode so that a
  // late-resolving geolocation result doesn't override their explicit choice.
  const userHasPickedSort = useRef(false)

  const setSortBy = useCallback((val) => {
    userHasPickedSort.current = true
    setSortByState(val)
  }, [])

  // When coords first become available, default to 'nearest' — but only if
  // the user has not already made an explicit sort selection.
  useEffect(() => {
    if (userCoords && !userHasPickedSort.current) {
      setSortByState('nearest')
    }
  }, [userCoords])

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

  // Counts per category based on search query only (category filter excluded so
  // each chip always shows how many deals exist in that category for the current search).
  const categoryCounts = useMemo(() => {
    const searchOnly = filterDeals(deals, searchQuery, [])
    const counts = { all: searchOnly.length }
    searchOnly.forEach(deal => {
      counts[deal.category] = (counts[deal.category] ?? 0) + 1
    })
    return counts
  }, [deals, searchQuery])

  const filteredDeals = useMemo(() => {
    const filtered = filterDeals(deals, searchQuery, activeCategories)
    const sorted = [...filtered]

    if (sortBy === 'nearest') {
      sorted.sort((a, b) => {
        const da = getNearestDistance(a, userCoords)
        const db = getNearestDistance(b, userCoords)
        if (da === null && db === null) return a.name.localeCompare(b.name)
        if (da === null) return 1
        if (db === null) return -1
        if (da !== db) return da - db
        return a.name.localeCompare(b.name)
      })
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => {
        const la = CATEGORY_LABELS[a.category] || a.category
        const lb = CATEGORY_LABELS[b.category] || b.category
        if (la !== lb) return la.localeCompare(lb)
        return a.name.localeCompare(b.name)
      })
    } else {
      // 'az'
      sorted.sort((a, b) => {
        const nc = a.name.localeCompare(b.name)
        if (nc !== 0) return nc
        return (a.deal.title || '').localeCompare(b.deal.title || '')
      })
    }

    return sorted
  }, [deals, searchQuery, activeCategories, sortBy, userCoords])

  return {
    searchQuery,
    setSearchQuery,
    activeCategories,
    toggleCategory,
    clearFilters,
    filteredDeals,
    sortBy,
    setSortBy,
    categoryCounts,
  }
}
