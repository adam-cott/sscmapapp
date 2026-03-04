/**
 * Compute derived usage state for a deal.
 * maxUses === null means unlimited (can never be exhausted).
 */
export function getDealUsageState(deal, usageMap) {
  const usedCount = usageMap[deal.id] ?? 0
  if (deal.deal.maxUses === null) {
    return { usedCount, remaining: null, status: usedCount > 0 ? 'partial' : 'unused' }
  }
  const remaining = Math.max(0, deal.deal.maxUses - usedCount)
  let status = 'unused'
  if (usedCount >= deal.deal.maxUses) status = 'exhausted'
  else if (usedCount > 0) status = 'partial'
  return { usedCount, remaining, status }
}

/**
 * Filter deals by active categories and search query.
 */
export function filterDeals(deals, searchQuery, activeCategories) {
  let result = deals

  if (activeCategories.length > 0) {
    result = result.filter(d => activeCategories.includes(d.category))
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.deal.title.toLowerCase().includes(q) ||
      (d.deal.description || '').toLowerCase().includes(q) ||
      (d.locationRestriction || '').toLowerCase().includes(q) ||
      (d.tags || []).some(t => t.toLowerCase().includes(q))
    )
  }

  return result
}
