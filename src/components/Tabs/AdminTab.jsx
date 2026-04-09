import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useFeaturedDeals } from '../../hooks/useFeaturedDeals'

const DURATIONS = [
  { label: '1 week',   days: 7   },
  { label: '2 weeks',  days: 14  },
  { label: '1 month',  days: 30  },
  { label: 'Permanent', days: null },
]

function getUntil(days) {
  if (days === null) return null
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatUntil(until) {
  if (!until) return 'Permanent'
  return `Until ${new Date(until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

async function saveItems(items) {
  await setDoc(doc(db, 'config', 'featured'), { items })
}

export default function AdminTab({ deals }) {
  const { featuredItems } = useFeaturedDeals()
  const [search, setSearch] = useState('')
  const [picking, setPicking] = useState(null) // deal being added

  const featuredIds = new Set(featuredItems.map(i => i.id))

  const searchResults = search.trim().length > 0
    ? deals
        .filter(d => !featuredIds.has(d.id))
        .filter(d =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.deal.title.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 20)
    : []

  async function addDeal(deal, days) {
    const newItems = [...featuredItems, { id: deal.id, until: getUntil(days) }]
    await saveItems(newItems)
    setPicking(null)
    setSearch('')
  }

  async function removeDeal(id) {
    await saveItems(featuredItems.filter(i => i.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f0f4f8', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ padding: '16px', backgroundColor: '#fff', borderBottom: '1px solid #e8edf3' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '17px', color: '#0f172a' }}>
          Admin — Featured Deals
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
          {featuredItems.length} featured · visible to all users
        </div>
      </div>

      {/* Current featured */}
      <div style={{ padding: '12px 16px 4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Currently Featured
        </div>
        {featuredItems.length === 0 && (
          <div style={{ fontSize: '13px', color: '#cbd5e1', padding: '12px 0' }}>None yet — add some below.</div>
        )}
        {featuredItems.map(item => {
          const deal = deals.find(d => d.id === item.id)
          if (!deal) return null
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#fff', borderRadius: '10px', padding: '10px 12px',
              marginBottom: '6px', border: '1px solid #e8edf3',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deal.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deal.deal.title} · {formatUntil(item.until)}
                </div>
              </div>
              <button
                onClick={() => removeDeal(item.id)}
                style={{ marginLeft: '10px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )
        })}
      </div>

      {/* Add new */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Add a Deal
        </div>
        <input
          type="text"
          placeholder="Search by business or deal name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPicking(null) }}
          style={{
            width: '100%', padding: '9px 12px', fontSize: '13px', borderRadius: '8px',
            border: '1px solid #e2e8f0', backgroundColor: '#fff', outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {searchResults.map(deal => (
          <div key={deal.id}>
            <div
              onClick={() => setPicking(picking?.id === deal.id ? null : deal)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: picking?.id === deal.id ? '#eff6ff' : '#fff',
                borderRadius: '8px', padding: '9px 12px', marginTop: '6px',
                border: `1px solid ${picking?.id === deal.id ? '#bfdbfe' : '#e8edf3'}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deal.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deal.deal.title}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#0170B9', fontWeight: 600, marginLeft: '8px' }}>
                {picking?.id === deal.id ? 'Cancel' : 'Add'}
              </span>
            </div>

            {/* Duration picker */}
            {picking?.id === deal.id && (
              <div style={{ display: 'flex', gap: '6px', padding: '8px 4px 4px', flexWrap: 'wrap' }}>
                {DURATIONS.map(({ label, days }) => (
                  <button
                    key={label}
                    onClick={() => addDeal(deal, days)}
                    style={{
                      padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                      backgroundColor: '#0170B9', color: '#fff',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}
