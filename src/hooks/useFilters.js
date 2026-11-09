import { useState, useMemo, useCallback } from 'react'
import { filterDeals, getNearestDistance, searchCities, parsePlaceQuery, getMapFocusLocations } from '../utils/dealHelpers'

export function useFilters(deals, userCoords) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState([])
  // Non-null = show only these deal ids, ignoring activeCategories (used by
  // Home tab "See all" cards for sections with no category equivalent, e.g.
  // Featured, Use Again, Unlimited Deals).
  const [pinnedIds, setPinnedIds] = useState(null)
  // True whenever the user explicitly asked to see a full list (a "See all"
  // tap), even when that list has no active search/category/pinnedIds of its
  // own — e.g. "Deals Near Me" See all, which is just everything sorted by
  // distance with no restriction at all.
  const [listMode, setListMode] = useState(false)

  const toggleCategory = useCallback((category) => {
    setPinnedIds(null)
    setActiveCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setActiveCategories([])
    setPinnedIds(null)
    setListMode(false)
  }, [])

  // Set exactly one active category, replacing whatever filter state was
  // there before (used by category-section "See all" cards).
  const showCategory = useCallback((category) => {
    setSearchQuery('')
    setPinnedIds(null)
    setActiveCategories([category])
    setListMode(true)
  }, [])

  // Show exactly this set of deal ids, replacing whatever filter state was
  // there before (used by "See all" cards with no category equivalent).
  const showPinned = useCallback((ids) => {
    setSearchQuery('')
    setActiveCategories([])
    setPinnedIds(ids)
    setListMode(true)
  }, [])

  // "Deals Near Me" See all: every deal, no restriction (lists are always nearest first).
  const showAllNearest = useCallback(() => {
    setSearchQuery('')
    setActiveCategories([])
    setPinnedIds(null)
    setListMode(true)
  }, [])

  // Cities come from the full list so a pinned subset can't shrink them.
  const cities = useMemo(() => searchCities(deals), [deals])

  // The city or venue a search names in full ("American Fork", "UVU pizza"),
  // for the map to zoom to. Partial names ("Americ") don't zoom.
  const searchPlace = useMemo(() => {
    const match = parsePlaceQuery(searchQuery, cities)
    return match?.full ? (match.places[0].venue ?? match.places[0].city) : null
  }, [searchQuery, cities])

  // Counts per category based on search query only (category filter excluded so
  // each chip always shows how many deals exist in that category for the current search).
  // The map's chips only count deals that have a pin (not online-only ones).
  const [categoryCounts, mapCategoryCounts] = useMemo(() => {
    const searchOnly = filterDeals(deals, searchQuery, [], cities)
    const count = list => {
      const counts = { all: list.length }
      list.forEach(deal => { counts[deal.category] = (counts[deal.category] ?? 0) + 1 })
      return counts
    }
    return [count(searchOnly), count(searchOnly.filter(d => getMapFocusLocations(d)?.length))]
  }, [deals, searchQuery, cities])

  const filteredDeals = useMemo(() => {
    const base = pinnedIds ? deals.filter(d => pinnedIds.includes(d.id)) : deals
    const filtered = filterDeals(base, searchQuery, pinnedIds ? [] : activeCategories, cities)
    const sorted = [...filtered]

    // Nearest first when we know where the user is, otherwise A-Z.
    if (userCoords) {
      const distances = new Map(filtered.map(d => [d, getNearestDistance(d, userCoords)]))
      sorted.sort((a, b) => {
        const da = distances.get(a)
        const db = distances.get(b)
        if (da === null && db === null) return a.name.localeCompare(b.name)
        if (da === null) return 1
        if (db === null) return -1
        if (da !== db) return da - db
        return a.name.localeCompare(b.name)
      })
    } else {
      sorted.sort((a, b) => {
        const nc = a.name.localeCompare(b.name)
        if (nc !== 0) return nc
        return (a.deal.title || '').localeCompare(b.deal.title || '')
      })
    }

    return sorted
  }, [deals, searchQuery, activeCategories, pinnedIds, userCoords, cities])

  const isListMode = listMode || searchQuery.trim().length > 0 || activeCategories.length > 0

  return {
    searchQuery,
    setSearchQuery,
    activeCategories,
    toggleCategory,
    clearFilters,
    filteredDeals,
    searchPlace,
    categoryCounts,
    mapCategoryCounts,
    pinnedIds,
    showCategory,
    showPinned,
    showAllNearest,
    isListMode,
  }
}
