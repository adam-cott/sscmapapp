import { useEffect, useState } from 'react'
import { Trophy, Utensils, Repeat, Target, Compass, HeartHandshake } from 'lucide-react'
import { STORAGE_KEYS } from '../../constants/storageKeys'

// stat: which number from the usage counts toward the badge.
const BADGES = [
  { id: 'first-bite',  name: 'First Bite',  hint: 'Use a deal',               stat: 'total',      goal: 1,  Icon: Utensils,       color: '#ea580c' },
  { id: 'regular',     name: 'Regular',     hint: 'Use 5 deals',              stat: 'total',      goal: 5,  Icon: Repeat,         color: '#0170B9' },
  { id: 'deal-hunter', name: 'Deal Hunter', hint: 'Use 25 deals',             stat: 'total',      goal: 25, Icon: Target,         color: '#7c3aed' },
  { id: 'explorer',    name: 'Explorer',    hint: '4 different categories',   stat: 'categories', goal: 4,  Icon: Compass,        color: '#059669' },
  { id: 'loyal',       name: 'Loyal',       hint: 'Same place 3 times',       stat: 'topPlace',   goal: 3,  Icon: HeartHandshake, color: '#db2777' },
]

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Counts up from 0 to `value` with an ease-out, a bit longer for bigger numbers.
function CountUp({ value }) {
  const [n, setN] = useState(() => (reduceMotion() ? value : 0))
  useEffect(() => {
    if (reduceMotion()) return
    const duration = Math.min(1000, 400 + value * 40)
    let frame, start
    const tick = t => {
      start ??= t
      const p = Math.min((t - start) / duration, 1)
      setN(Math.round(value * (1 - (1 - p) ** 3)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return n
}

function formatDate(iso) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

export default function RewardsTab({ usageLog, dealsWithUsage, usageMap }) {
  const dealById = Object.fromEntries(dealsWithUsage.map(d => [d.id, d]))
  const totalRedemptions = Object.values(usageMap).reduce((a, b) => a + b, 0)
  const usesByPlace = {}
  const categories = new Set()
  for (const [id, n] of Object.entries(usageMap)) {
    const deal = dealById[id]
    if (!deal || n <= 0) continue
    usesByPlace[deal.name] = (usesByPlace[deal.name] ?? 0) + n
    categories.add(deal.category)
  }
  const placesVisited = Object.keys(usesByPlace).length
  const stats = { total: totalRedemptions, categories: categories.size, topPlace: Math.max(0, ...Object.values(usesByPlace)) }

  // Badges earned since the tab was last opened get a one-time shine and buzz.
  const earnedKey = BADGES.filter(b => stats[b.stat] >= b.goal).map(b => b.id).join(',')
  const [fresh] = useState(() => {
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.badgesSeen) || '[]')
    return earnedKey.split(',').filter(id => id && !seen.includes(id))
  })
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.badgesSeen, JSON.stringify(earnedKey.split(',').filter(Boolean)))
  }, [earnedKey])
  useEffect(() => {
    if (fresh.length) navigator.vibrate?.([15, 60, 15])
  }, [fresh])

  const badgeSection = (
    <div className="w-full text-left">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1" style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.1em' }}>
        Badges
      </p>
      <div className="grid grid-cols-3 gap-2">
        {BADGES.map(({ id, name, hint, stat, goal, Icon, color }) => {
          const have = Math.min(stats[stat], goal)
          const earned = have >= goal
          return (
            <div key={id} className="rounded-2xl bg-white p-3 flex flex-col items-center text-center shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
              <div
                className={fresh.includes(id) ? 'badge-new' : undefined}
                style={{
                  position: 'relative', overflow: 'hidden',
                  width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: earned ? color : '#f1f5f9',
                  boxShadow: earned ? `0 4px 12px ${color}55` : 'none',
                }}
              >
                <Icon size={20} strokeWidth={2.2} color={earned ? '#fff' : '#cbd5e1'} />
              </div>
              <p className="text-xs font-bold mt-2 leading-tight" style={{ fontFamily: 'var(--font-display)', color: earned ? '#0f172a' : '#94a3b8' }}>
                {name}
              </p>
              <p className="mt-0.5 leading-tight" style={{ fontSize: '10px', color: earned ? color : '#94a3b8', fontWeight: earned ? 600 : 400 }}>
                {fresh.includes(id) ? 'New!' : earned ? 'Earned' : goal > 1 ? `${have} of ${goal}` : hint}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )

  // usageLog only exists from when logging was added. usageMap has ALL usage
  // including deals used before the log existed. Build a combined history:
  // real log entries (with timestamps) + synthetic entries for the gap.
  const logCountById = usageLog.reduce((acc, e) => {
    acc[e.dealId] = (acc[e.dealId] ?? 0) + 1
    return acc
  }, {})

  const syntheticEntries = Object.entries(usageMap).flatMap(([dealId, count]) => {
    const missing = count - (logCountById[dealId] ?? 0)
    return Array.from({ length: missing }, () => ({ dealId, usedAt: null }))
  })

  const fullHistory = [...[...usageLog].reverse(), ...syntheticEntries]

  if (totalRedemptions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 overflow-y-auto ssc-scroll" style={{ backgroundColor: '#f0f4f8' }}>
        <Trophy size={48} strokeWidth={1.5} color="#cbd5e1" />
        <p className="text-lg font-bold mt-4 text-gray-700" style={{ fontFamily: 'var(--font-display)' }}>No deals used yet</p>
        <p className="text-sm text-gray-400 mt-1 mb-6">Use your first deal to start earning badges</p>
        {badgeSection}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#f0f4f8' }}>

      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Rewards</h2>
      </div>

      <div className="flex-1 overflow-y-auto ssc-scroll px-4 pb-4 space-y-4">

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Deals Used', value: totalRedemptions, sub: `redemption${totalRedemptions !== 1 ? 's' : ''} this year` },
            { label: 'Places Visited', value: placesVisited, sub: `different business${placesVisited !== 1 ? 'es' : ''}` },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.1em' }}>
                {s.label}
              </p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ssc-blue)', fontVariantNumeric: 'tabular-nums' }}>
                <CountUp value={s.value} />
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {badgeSection}

        {/* Usage history */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1" style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.1em' }}>
            History
          </p>
          <div className="rounded-2xl bg-white overflow-hidden shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
            {fullHistory.map((entry, i) => {
              const deal = dealById[entry.dealId]
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < fullHistory.length - 1 ? '1px solid #f8fafc' : 'none' }}
                >
                  <div
                    className="flex-shrink-0 mt-0.5 rounded-full flex items-center justify-center"
                    style={{ width: '32px', height: '32px', backgroundColor: 'var(--ssc-blue-light)' }}
                  >
                    <Trophy size={14} color="var(--ssc-blue)" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                      {deal?.name ?? 'Unknown business'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {deal?.deal?.title ?? entry.dealId}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                      {entry.usedAt ? formatDate(entry.usedAt) : 'Date not recorded'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
