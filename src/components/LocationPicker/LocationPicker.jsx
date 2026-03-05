import { useEffect } from 'react'
import { CATEGORY_COLORS } from '../../utils/categoryColors'

function DealRow({ deal, usageState, loc, onSelect }) {
  const catColor = CATEGORY_COLORS[deal.category] || '#64748b'
  const isExhausted = usageState.status === 'exhausted'
  const isUnlimited = deal.deal.maxUses === null

  return (
    <button
      onClick={() => onSelect({ ...deal, lat: loc.lat, lng: loc.lng, address: loc.address })}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'white',
        border: 'none',
        borderLeft: `3px solid ${isExhausted ? '#e2e8f0' : catColor}`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        cursor: 'pointer',
        opacity: isExhausted ? 0.65 : 1,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '2px' }}>
            {deal.name}
          </div>
          <div className="line-clamp-2" style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
            {deal.deal.title}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {isUnlimited ? (
            <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'Sora, sans-serif', color: '#059669' }}>∞ Unlimited</span>
          ) : isExhausted ? (
            <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'Sora, sans-serif', color: '#ef4444' }}>Used up</span>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end', marginBottom: '2px' }}>
                {Array.from({ length: deal.deal.maxUses }).map((_, i) => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: i < usageState.usedCount ? '#e2e8f0' : catColor }} />
                ))}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{usageState.usedCount}/{deal.deal.maxUses} used</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default function LocationPicker({ location, onSelectDeal, onClose }) {
  const { loc, items } = location

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const backdrop = (
    <div
      className="fixed inset-0 animate-fade-in"
      style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    />
  )

  const header = (
    <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', fontSize: '16px', color: '#0f172a', marginBottom: '2px' }}>
            {items.length} deals at this location
          </h2>
          {loc.address && (
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{loc.address}</p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )

  const dealList = (
    <div className="flex-1 overflow-y-auto ssc-scroll" style={{ padding: '12px 16px' }}>
      {items.map(({ deal, usageState }, i) => (
        <DealRow key={i} deal={deal} usageState={usageState} loc={loc} onSelect={onSelectDeal} />
      ))}
    </div>
  )

  return (
    <>
      {/* Mobile bottom sheet */}
      <div className="md:hidden">
        <div className="fixed inset-0 z-[900] animate-fade-in" style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }} onClick={onClose} />
        <div
          className="fixed bottom-0 left-0 right-0 z-[1000] animate-sheet-up flex flex-col"
          style={{ backgroundColor: '#f8fafc', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '80vh' }}
        >
          <div style={{ height: '4px', background: '#0170B9', borderRadius: '20px 20px 0 0' }} />
          <div className="flex justify-center pt-3 pb-1">
            <div style={{ width: '36px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '99px' }} />
          </div>
          {header}
          {dealList}
        </div>
      </div>

      {/* Desktop modal */}
      <div className="hidden md:block">
        <div className="fixed inset-0 z-[900] animate-fade-in" style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }} onClick={onClose} />
        <div
          className="fixed z-[1000] animate-modal-in flex flex-col"
          style={{
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            width: '420px',
            maxHeight: '70vh',
          }}
        >
          <div style={{ height: '4px', background: '#0170B9', borderRadius: '16px 16px 0 0' }} />
          {header}
          {dealList}
        </div>
      </div>
    </>
  )
}
