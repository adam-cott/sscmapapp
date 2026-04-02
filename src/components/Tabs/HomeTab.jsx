import { useAuth } from '../../hooks/useAuth'
import { getNearestDistance } from '../../utils/dealHelpers'
import HomeCard from '../UI/HomeCard'
import SearchBar from '../Sidebar/SearchBar'
import FilterPanel from '../Sidebar/FilterPanel'
import SortControl from '../Sidebar/SortControl'
import ListView from '../ListView/ListView'

const FEATURED_IDS = [
  'restaurants-040', // Chili's — Free Item
  'sandwiches-416',  // Wendy's — Free Item
  'free-228',        // Jamba Juice — Free Item
  'restaurants-042', // Costa Vida — Buy 1 Get 1 Free
  'free-258',        // Sonic — Free Item
  'free-229',        // Jersey Mike's — Free Item
  'pizza-004',       // Domino's — 2 for 1
  'entertainment-097', // BYU Bowling — 2 for 1
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function Section({ title, deals, onSelectDeal, userCoords, emptyMessage }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      borderRadius: '18px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      <div style={{
        flexShrink: 0,
        padding: '10px 16px 8px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>
          {title}
        </h3>
      </div>
      {!deals.length ? (
        <p style={{ fontSize: '13px', color: '#94a3b8', padding: '14px 16px', backgroundColor: '#f0f4f8', margin: 0 }}>
          {emptyMessage}
        </p>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center',
          padding: '12px 14px', scrollbarWidth: 'none',
          backgroundColor: '#f0f4f8',
        }}>
          {deals.map(deal => (
            <HomeCard
              key={deal.id}
              deal={deal}
              onClick={() => onSelectDeal(deal)}
              userCoords={userCoords}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function spreadAcrossCategories(deals, max = 8, perCat = 2) {
  const byCategory = {}
  for (const deal of deals) {
    if (!byCategory[deal.category]) byCategory[deal.category] = []
    if (byCategory[deal.category].length < perCat) byCategory[deal.category].push(deal)
  }
  return Object.values(byCategory).flat().slice(0, max)
}

export default function HomeTab({
  deals, filteredDeals, usageLog, userCoords, onSelectDeal,
  searchQuery, onSearchChange, activeCategories, onCategoryToggle,
  onClearFilters, sortBy, setSortBy, categoryCounts,
  permissionDenied, geoLoading, hasCoords, onNearestRequest, dealCount,
}) {
  const { firstName } = useAuth()
  const userName = firstName || 'Student'

  // Sort is NOT part of the trigger — only search text and category filters switch modes
  const isSearching = searchQuery.trim().length > 0 || activeCategories.length > 0

  const activeDeals = deals.filter(d => d.usage.status !== 'exhausted')

  const nearbyDeals = userCoords
    ? [...activeDeals]
        .map(d => ({ deal: d, dist: getNearestDistance(d, userCoords) }))
        .filter(({ dist }) => dist !== null)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 8)
        .map(({ deal }) => deal)
    : spreadAcrossCategories(activeDeals)

  const seenIds = new Set()
  const usedDealIds = [...usageLog].reverse().map(e => e.dealId).filter(id => {
    if (seenIds.has(id)) return false
    seenIds.add(id)
    return true
  })
  const usedDeals = usedDealIds
    .map(id => activeDeals.find(d => d.id === id))
    .filter(Boolean)
    .slice(0, 8)

  const featuredDeals = FEATURED_IDS
    .map(id => activeDeals.find(d => d.id === id))
    .filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: '#f0f4f8' }}>

      {/* Always-pinned top: greeting header + search + category filters */}
      <div style={{ flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #e8edf3', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 16px 12px' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--ssc-blue)', letterSpacing: '-0.01em' }}>
            Starving Student Card
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>
            {getGreeting()}, {userName}!
          </div>
        </div>
        <div style={{ padding: '0 12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SearchBar value={searchQuery} onChange={onSearchChange} />
          <FilterPanel
            compact
            activeCategories={activeCategories}
            onToggle={onCategoryToggle}
            onClear={onClearFilters}
            categoryCounts={categoryCounts}
          />
        </div>
      </div>

      {isSearching ? (
        /* SEARCH MODE — sort controls + full deal list */
        <>
          <div style={{ flexShrink: 0, padding: '10px 12px', backgroundColor: '#ffffff', borderBottom: '1px solid #e8edf3' }}>
            <SortControl
              sortBy={sortBy}
              setSortBy={setSortBy}
              permissionDenied={permissionDenied}
              geoLoading={geoLoading}
              hasCoords={hasCoords}
              onNearestRequest={onNearestRequest}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', overscrollBehaviorY: 'contain' }}>
            <ListView deals={filteredDeals} onSelectDeal={onSelectDeal} userCoords={userCoords} />
          </div>
        </>
      ) : (
        /* DISCOVERY MODE — section carousels */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 20px', gap: '14px', minHeight: 0 }}>
          <Section title="Deals Near Me" deals={nearbyDeals} onSelectDeal={onSelectDeal} userCoords={userCoords} emptyMessage="No deals found nearby." />
          <Section title="Use Again" deals={usedDeals} onSelectDeal={onSelectDeal} userCoords={userCoords} emptyMessage="Use a deal to see it here." />
          <Section title="Featured" deals={featuredDeals} onSelectDeal={onSelectDeal} userCoords={userCoords} emptyMessage="No featured deals right now." />
        </div>
      )}

    </div>
  )
}
