import { useAuth } from '../../hooks/useAuth'
import { useCardYear } from '../../hooks/useCardYear'
import { getNearestDistance, getNearestLocation } from '../../utils/dealHelpers'
import HomeCard from '../UI/HomeCard'
import SearchBar from '../Sidebar/SearchBar'
import FilterPanel from '../Sidebar/FilterPanel'
import SortControl from '../Sidebar/SortControl'
import ListView from '../ListView/ListView'


function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Groups deals by business name (trimmed, case-insensitive) so a stray
// whitespace/casing difference in deals.json can't split one business into
// two cards. Preserves first-occurrence order (nearest / most-recent / featured-order).
function groupByBusiness(deals) {
  const order = []
  const groups = new Map()
  for (const deal of deals) {
    const key = deal.name.trim().toLowerCase()
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key).push(deal)
  }
  return order.map(key => groups.get(key))
}

// Builds one Home-tab card per business from a pool of candidate deals.
// Dedupes BEFORE capping to `take` so a business with several deals
// clustered together (e.g. same distance) can't crowd out other businesses.
function buildHomeCards(deals, userCoords, take = Infinity) {
  return groupByBusiness(deals).slice(0, take).map(items => {
    const primary = items[0]
    const allLocations = items.flatMap(d => d.locations ?? [])
    const loc = getNearestLocation({ locations: allLocations }, userCoords)
      ?? primary.locations?.[0]
      ?? { lat: primary.lat, lng: primary.lng, address: primary.address, phone: primary.contact?.phone ?? null }
    return {
      key: primary.id,
      deal: primary,
      dealCount: items.length,
      loc,
      items: items.map(deal => ({ deal, usageState: deal.usage })),
    }
  })
}

function Section({ title, cards, onSelectCard, emptyMessage }) {
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flexShrink: 0,
        padding: '0 2px 8px',
      }}>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>
          {title}
        </h3>
      </div>
      {!cards.length ? (
        <p style={{ fontSize: '13px', color: '#94a3b8', padding: '14px 16px', margin: 0 }}>
          {emptyMessage}
        </p>
      ) : (
        <div style={{
          flexShrink: 0,
          display: 'flex', gap: '10px', overflowX: 'auto', overflowY: 'visible', alignItems: 'flex-start',
          padding: '2px', scrollbarWidth: 'none',
        }}>
          {cards.map(card => (
            <HomeCard
              key={card.key}
              deal={card.deal}
              dealCount={card.dealCount}
              onClick={() => onSelectCard(card)}
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
  deals, filteredDeals, usageLog, userCoords, onSelectDeal, onSelectLocation,
  searchQuery, onSearchChange, activeCategories, onCategoryToggle,
  onClearFilters, sortBy, setSortBy, categoryCounts,
  permissionDenied, geoLoading, hasCoords, onNearestRequest, dealCount,
  featuredIds,
}) {
  const { firstName } = useAuth()
  const userName = firstName || 'Student'
  const { daysRemaining, isExpired, isExpiring } = useCardYear()
  const showBanner = isExpired || isExpiring

  // Sort is NOT part of the trigger — only search text and category filters switch modes
  const isSearching = searchQuery.trim().length > 0 || activeCategories.length > 0

  const activeDeals = deals.filter(d => d.usage.status !== 'exhausted')

  // Candidate pools are built wider than the 8-card cap, then deduped by
  // business (see buildHomeCards) BEFORE slicing to 8 — otherwise a business
  // with several deals clustered together could crowd out other businesses.
  const nearbyPool = userCoords
    ? [...activeDeals]
        .map(d => ({ deal: d, dist: getNearestDistance(d, userCoords) }))
        .filter(({ dist }) => dist !== null)
        .sort((a, b) => a.dist - b.dist)
        .map(({ deal }) => deal)
    : spreadAcrossCategories(activeDeals, 100, 8)
  const nearbyCards = buildHomeCards(nearbyPool, userCoords, 8)

  const seenIds = new Set()
  const usedDealIds = [...usageLog].reverse().map(e => e.dealId).filter(id => {
    if (seenIds.has(id)) return false
    seenIds.add(id)
    return true
  })
  const usedPool = usedDealIds
    .map(id => activeDeals.find(d => d.id === id))
    .filter(Boolean)
  const usedCards = buildHomeCards(usedPool, userCoords, 8)

  const featuredPool = (featuredIds ?? [])
    .map(id => activeDeals.find(d => d.id === id))
    .filter(Boolean)
  const featuredCards = buildHomeCards(featuredPool, userCoords)

  const handleSelectCard = (card) => {
    if (card.dealCount > 1) {
      onSelectLocation({ loc: card.loc, items: card.items })
    } else {
      onSelectDeal(card.deal)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#f0f4f8' }}>

      {/* Always-pinned top: greeting header + search + category filters */}
      <div style={{ flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #e8edf3', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px 6px' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--ssc-blue)', letterSpacing: '-0.01em' }}>
            Starving Student Card
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '1px' }}>
            {getGreeting()}, {userName}!
          </div>
        </div>
        {showBanner && (
          <a
            href="https://sscdeals.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', margin: '0 12px 2px', padding: '10px 14px',
              borderRadius: '12px', textDecoration: 'none',
              backgroundColor: isExpired ? '#fef2f2' : '#fff7ed',
              border: `1px solid ${isExpired ? '#fecaca' : '#fed7aa'}`,
            }}
          >
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '13px', color: isExpired ? '#dc2626' : '#ea580c' }}>
              {isExpired ? 'Your card has expired! ' : `Card expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}! `}
            </span>
            <span style={{ fontSize: '13px', color: isExpired ? '#dc2626' : '#ea580c' }}>
              Grab next year's card at sscdeals.com →
            </span>
          </a>
        )}
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 20px', gap: '14px', overflowY: 'auto', overscrollBehaviorY: 'contain' }}>
          <Section title="Deals Near Me" cards={nearbyCards} onSelectCard={handleSelectCard} emptyMessage="No deals found nearby." />
          <Section title="Use Again" cards={usedCards} onSelectCard={handleSelectCard} emptyMessage="Use a deal to see it here." />
          <Section title="Featured" cards={featuredCards} onSelectCard={handleSelectCard} emptyMessage="No featured deals right now." />
        </div>
      )}

    </div>
  )
}
