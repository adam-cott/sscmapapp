import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useCardYear } from '../../hooks/useCardYear'
import { getNearestDistance, getNearestLocation } from '../../utils/dealHelpers'
import HomeCard from '../UI/HomeCard'
import SearchBar from '../Sidebar/SearchBar'
import FilterPanel from '../Sidebar/FilterPanel'
import SortControl from '../Sidebar/SortControl'
import ListView from '../ListView/ListView'


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

// Same footprint as HomeCard so the row stays even, but visually reads as
// an action (solid SSC-blue tile + chevron) rather than a business.
function SeeAllCard({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 'min(39vw, 158px)',
        flexShrink: 0,
        textAlign: 'left',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 18,
        backgroundColor: 'var(--ssc-blue)',
        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ChevronRight size={28} color="#ffffff" strokeWidth={2.5} />
      </div>
      <div style={{ width: '100%', overflow: 'hidden', marginTop: '8px' }}>
        <span style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'var(--hc-name, 13px)',
          color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          display: 'block', width: '100%',
        }}>
          See all
        </span>
        <p style={{ margin: '2px 0 0', fontSize: 'var(--hc-desc, 12px)', color: '#64748b', lineHeight: 1.35 }}>
          {count} deal{count === 1 ? '' : 's'}
        </p>
      </div>
    </button>
  )
}

function Section({ title, cards, onSelectCard, onSeeAll, seeAllCount }) {
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
        {onSeeAll && <SeeAllCard count={seeAllCount} onClick={onSeeAll} />}
      </div>
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

// Sorts by nearest-location distance when userCoords is available; deals
// with no computable distance sort last rather than being dropped, since
// (unlike the "Deals Near Me" pool) a category section should still show
// its full lineup even without a location fix.
function sortByDistance(deals, userCoords) {
  if (!userCoords) return deals
  return [...deals]
    .map(deal => ({ deal, dist: getNearestDistance(deal, userCoords) }))
    .sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity))
    .map(({ deal }) => deal)
}

const CATEGORY_SECTIONS = [
  { category: 'free', title: 'Freebies' },
  { category: 'treats', title: 'Sweet Treats + Drinks' },
  { category: 'restaurants', title: 'Restaurants' },
  { category: 'sandwiches', title: 'Want a Sandwich?' },
  { category: 'entertainment', title: 'Entertainment & Fun' },
  { category: 'pizza', title: 'Pizza' },
  { category: 'retail', title: 'Services & Shops' },
]

export default function HomeTab({
  deals, filteredDeals, usageLog, userCoords, onSelectDeal, onSelectLocation,
  searchQuery, onSearchChange, activeCategories, onCategoryToggle,
  onClearFilters, sortBy, setSortBy, categoryCounts,
  permissionDenied, geoLoading, hasCoords, onNearestRequest, dealCount,
  featuredIds, faves, pinnedIds, isListMode,
  onShowCategory, onShowPinned, onShowAllNearest, onNavigateFaves,
}) {
  const { daysRemaining, isExpired, isExpiring } = useCardYear()
  const showBanner = isExpired || isExpiring

  // Label shown above the list when it's not obvious from the category
  // chips alone what's being shown (a "See all" card was tapped). Cleared
  // whenever the user interacts with the chips directly, since those
  // already say what's active.
  const [listLabel, setListLabel] = useState(null)
  const handleCategoryToggle = (category) => { setListLabel(null); onCategoryToggle(category) }
  const handleClearFilters = () => { setListLabel(null); onClearFilters() }

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

  // Most-recently-favorited first — faves is stored oldest-to-newest.
  const favesPool = [...(faves ?? [])].reverse()
    .map(id => activeDeals.find(d => d.id === id))
    .filter(Boolean)
  const favesCards = buildHomeCards(favesPool, userCoords, 8)

  const categorySections = CATEGORY_SECTIONS.map(({ category, title }) => {
    const pool = sortByDistance(activeDeals.filter(d => d.category === category), userCoords)
    return {
      key: category,
      title,
      cards: buildHomeCards(pool, userCoords, 8),
      seeAllCount: pool.length,
      onSeeAll: () => { setListLabel(null); onShowCategory(category) },
    }
  })

  // maxUses === null can never be exhausted, so this is already the full
  // set regardless of activeDeals' exhausted filter — no separate
  // "unfiltered" pool needed the way Use Again/Featured need one below.
  const unlimitedPool = sortByDistance(activeDeals.filter(d => d.deal.maxUses === null), userCoords)
  const unlimitedCards = buildHomeCards(unlimitedPool, userCoords, 8)
  const unlimitedIds = unlimitedPool.map(d => d.id)

  // Sections with no cards (new user, nothing used/favorited yet, no
  // Firestore-set Featured items) are dropped entirely rather than shown
  // with an empty-state message — the page grows as the user does.
  const sections = [
    {
      key: 'near-me', title: 'Deals Near Me', cards: nearbyCards,
      // seeAllCount uses activeDeals directly rather than nearbyPool, since
      // nearbyPool is sampled (spreadAcrossCategories) when there's no
      // location fix — the See all tap always shows every active deal.
      seeAllCount: activeDeals.length,
      onSeeAll: () => { setListLabel('Deals Near Me'); onShowAllNearest() },
    },
    {
      key: 'featured', title: 'Featured Deals', cards: featuredCards,
      seeAllCount: (featuredIds ?? []).length,
      onSeeAll: () => { setListLabel('Featured Deals'); onShowPinned(featuredIds ?? []) },
    },
    {
      key: 'use-again', title: 'Use Again', cards: usedCards,
      seeAllCount: usedDealIds.length,
      onSeeAll: () => { setListLabel('Use Again'); onShowPinned(usedDealIds) },
    },
    {
      key: 'favorites', title: 'Your Favorites', cards: favesCards,
      seeAllCount: (faves ?? []).length,
      // Favorites already has its own full tab — send there instead of
      // duplicating that screen as a list-mode filter.
      onSeeAll: () => onNavigateFaves(),
    },
    ...categorySections,
    {
      key: 'unlimited', title: 'Unlimited Deals', cards: unlimitedCards,
      seeAllCount: unlimitedIds.length,
      onSeeAll: () => { setListLabel('Unlimited Deals'); onShowPinned(unlimitedIds) },
    },
  ].filter(section => section.cards.length > 0)

  const handleSelectCard = (card) => {
    if (card.dealCount > 1) {
      onSelectLocation({ loc: card.loc, items: card.items })
    } else {
      onSelectDeal(card.deal)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#f0f4f8' }}>

      {/* Always-pinned top: title header + search + category filters */}
      <div style={{ flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #e8edf3', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--ssc-blue)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Starving Student Card
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
            activeCategories={activeCategories}
            onToggle={handleCategoryToggle}
            onClear={handleClearFilters}
            categoryCounts={categoryCounts}
            pinnedActive={!!pinnedIds}
          />
        </div>
      </div>

      {isListMode ? (
        /* SEARCH MODE — sort controls + full deal list */
        <>
          {listLabel && (
            <div style={{ flexShrink: 0, padding: '10px 12px 0', backgroundColor: '#ffffff' }}>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                {listLabel}
              </span>
            </div>
          )}
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
          {sections.map(section => (
            <Section
              key={section.key}
              title={section.title}
              cards={section.cards}
              onSelectCard={handleSelectCard}
              onSeeAll={section.onSeeAll}
              seeAllCount={section.seeAllCount}
            />
          ))}
        </div>
      )}

    </div>
  )
}
