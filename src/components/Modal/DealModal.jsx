import { useEffect } from 'react'
import { CATEGORY_COLORS, CATEGORY_LIGHT, CATEGORY_LABELS, CATEGORY_ICON } from '../../utils/categoryColors'
import UsageTracker from '../UI/UsageTracker'

export default function DealModal({ deal, onUse, onClose }) {
  const { usage } = deal
  const isExhausted = usage.status === 'exhausted'
  const catColor = CATEGORY_COLORS[deal.category] || '#0170B9'
  const catLight = CATEGORY_LIGHT[deal.category] || '#f0f9ff'

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[900] animate-fade-in"
        style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-[1000] animate-modal-in"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
          overflow: 'hidden',
        }}
      >
        {/* Category color bar */}
        <div style={{ height: '5px', background: isExhausted ? '#e2e8f0' : catColor }} />

        {/* Header */}
        <div style={{ padding: '20px 20px 16px' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* Category icon blob */}
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0 text-lg"
                style={{
                  width: '44px', height: '44px',
                  backgroundColor: isExhausted ? '#f1f5f9' : catLight,
                  fontSize: '20px',
                }}
              >
                {CATEGORY_ICON[deal.category]}
              </div>
              <div className="min-w-0">
                <h2
                  className="font-bold leading-snug"
                  style={{ fontFamily: 'Sora, sans-serif', fontSize: '17px', color: '#0f172a' }}
                >
                  {deal.name}
                </h2>
                <div
                  className="text-xs font-semibold uppercase tracking-wider mt-0.5"
                  style={{ color: isExhausted ? '#94a3b8' : catColor, fontFamily: 'Sora, sans-serif', letterSpacing: '0.08em' }}
                >
                  {CATEGORY_LABELS[deal.category]}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 flex items-center justify-center rounded-full transition-colors"
              style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', color: '#64748b' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="ssc-scroll overflow-y-auto" style={{ maxHeight: '55vh', padding: '0 20px' }}>
          {/* Deal value — hero section */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: isExhausted ? '#f8fafc' : catLight, border: `1px solid ${isExhausted ? '#e2e8f0' : catColor + '25'}` }}
          >
            <div
              className="font-bold mb-1"
              style={{ fontFamily: 'Sora, sans-serif', fontSize: '15px', color: isExhausted ? '#94a3b8' : '#0f172a' }}
            >
              {deal.deal.title}
            </div>
            <div
              className="font-bold"
              style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', color: isExhausted ? '#94a3b8' : catColor }}
            >
              {deal.deal.value}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm mb-4" style={{ color: '#64748b', lineHeight: '1.6' }}>
            {deal.deal.description}
          </p>

          {/* Usage tracker */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}
          >
            <div
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: 'Sora, sans-serif', color: '#94a3b8', fontSize: '9px', letterSpacing: '0.1em' }}
            >
              Usage Tracker
            </div>
            <UsageTracker used={usage.usedCount} maxUses={deal.deal.maxUses} />
          </div>

          {/* Info rows */}
          <div className="space-y-3 mb-5">
            {[
              deal.lat && { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: deal.address || 'Get Directions', href: `https://www.google.com/maps/dir/?api=1&destination=${deal.lat},${deal.lng}`, external: true },
              deal.locationRestriction && { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: `Valid at: ${deal.locationRestriction}` },
              deal.contact?.hours && { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, text: deal.contact.hours },
              deal.contact?.phone && { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, text: deal.contact.phone, href: `tel:${deal.contact.phone}` },
              deal.contact?.website && { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, text: deal.contact.website.replace(/^https?:\/\//, ''), href: deal.contact.website, external: true },
              deal.deal.expiresAt && { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, text: `Expires ${deal.deal.expiresAt}` },
            ].filter(Boolean).map((row, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }}>{row.icon}</div>
                {row.href ? (
                  <a
                    href={row.href}
                    target={row.external ? '_blank' : undefined}
                    rel={row.external ? 'noopener noreferrer' : undefined}
                    className="text-sm truncate"
                    style={{ color: '#0170B9' }}
                  >
                    {row.text}
                  </a>
                ) : (
                  <span className="text-sm" style={{ color: '#475569' }}>{row.text}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3"
          style={{ padding: '16px 20px 20px', borderTop: '1px solid #f1f5f9' }}
        >
          <button
            onClick={onClose}
            className="flex-1 font-semibold rounded-xl transition-colors text-sm py-3"
            style={{
              fontFamily: 'Sora, sans-serif',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            Close
          </button>
          <button
            onClick={onUse}
            disabled={isExhausted}
            className="flex-1 font-semibold rounded-xl transition-all text-sm py-3"
            style={{
              fontFamily: 'Sora, sans-serif',
              backgroundColor: isExhausted ? '#f1f5f9' : '#059669',
              color: isExhausted ? '#94a3b8' : 'white',
              border: 'none',
              cursor: isExhausted ? 'not-allowed' : 'pointer',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!isExhausted) e.currentTarget.style.backgroundColor = '#047857' }}
            onMouseLeave={e => { if (!isExhausted) e.currentTarget.style.backgroundColor = '#059669' }}
          >
            {isExhausted ? 'No Uses Remaining' : 'Use This Deal'}
          </button>
        </div>
      </div>
    </>
  )
}
