import { useLocalStorage } from '../../hooks/useLocalStorage'
import { getNearestDistance } from '../../utils/dealHelpers'
import HomeCard from '../UI/HomeCard'
import { ChevronRight } from 'lucide-react'

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

function Section({ title, action, onAction, deals, onSelectDeal, userCoords, emptyMessage }) {
  return (
    <div style={{
      margin: '14px 16px 0',
      backgroundColor: '#ffffff',
      borderRadius: '18px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Title row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 12px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: 0 }}>
          {title}
        </h3>
        {action && (
          <button
            onClick={onAction}
            style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              fontSize: '12px', fontWeight: 600, color: 'var(--ssc-blue)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            {action}
            <ChevronRight size={13} color="var(--ssc-blue)" />
          </button>
        )}
      </div>

      {/* Content */}
      {!deals.length ? (
        <p style={{ fontSize: '13px', color: '#94a3b8', padding: '14px 16px' }}>
          {emptyMessage}
        </p>
      ) : (
        <div style={{
          display: 'flex', gap: '10px', overflowX: 'auto',
          padding: '14px 16px', scrollbarWidth: 'none',
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

// Pick up to `perCat` deals per category, spread across all categories, up to `max` total
function spreadAcrossCategories(deals, max = 8, perCat = 2) {
  const byCategory = {}
  for (const deal of deals) {
    if (!byCategory[deal.category]) byCategory[deal.category] = []
    if (byCategory[deal.category].length < perCat) byCategory[deal.category].push(deal)
  }
  return Object.values(byCategory).flat().slice(0, max)
}

export default function HomeTab({ deals, usageLog, userCoords, onSelectDeal, onSwitchToDeals }) {
  const [profile] = useLocalStorage('ssc_profile_v1', {})
  const userName = profile.name || 'Student'

  // Deals Near Me — sorted by distance, fallback to spread across categories
  const nearbyDeals = userCoords
    ? [...deals]
        .map(d => ({ deal: d, dist: getNearestDistance(d, userCoords) }))
        .filter(({ dist }) => dist !== null)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 8)
        .map(({ deal }) => deal)
    : spreadAcrossCategories(deals)

  // Use Again — unique deal IDs from log, most recent first, non-exhausted
  const seenIds = new Set()
  const usedDealIds = [...usageLog].reverse().map(e => e.dealId).filter(id => {
    if (seenIds.has(id)) return false
    seenIds.add(id)
    return true
  })
  const usedDeals = usedDealIds
    .map(id => deals.find(d => d.id === id))
    .filter(d => d && d.usage.status !== 'exhausted')
    .slice(0, 8)

  // Featured — static curated selection
  const featuredDeals = FEATURED_IDS
    .map(id => deals.find(d => d.id === id))
    .filter(Boolean)

  // Search All — one per category sample
  const sampleDeals = spreadAcrossCategories(deals, 8, 1)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ backgroundColor: '#f0f4f8' }}>
      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px 14px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e8edf3',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--ssc-blue)', letterSpacing: '-0.01em' }}>
          Starving Student Card
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>
          {getGreeting()}, {userName}!
        </div>
      </header>

      <Section title="Deals Near Me" deals={nearbyDeals} onSelectDeal={onSelectDeal} userCoords={userCoords} emptyMessage="No deals found nearby." />
      <Section title="Use Again" deals={usedDeals} onSelectDeal={onSelectDeal} userCoords={userCoords} emptyMessage="Use a deal to see it here." />
      <Section title="Featured" deals={featuredDeals} onSelectDeal={onSelectDeal} userCoords={userCoords} emptyMessage="No featured deals right now." />
      <Section title="Search All Deals" action="See All" onAction={onSwitchToDeals} deals={sampleDeals} onSelectDeal={onSelectDeal} userCoords={userCoords} emptyMessage="" />

      <div style={{ height: '16px' }} />
    </div>
  )
}
