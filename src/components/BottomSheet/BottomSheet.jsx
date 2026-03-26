import { useEffect } from 'react'
import { Heart, MapPin, Clock, Phone, Globe, Calendar } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_LIGHT, CATEGORY_LABELS, CATEGORY_ICON } from '../../utils/categoryColors'
import UsageTracker from '../UI/UsageTracker'

export default function BottomSheet({ deal, onUse, onClose, isFave, onToggleFave }) {
  const { usage } = deal
  const isExhausted = usage.status === 'exhausted'
  const catColor = CATEGORY_COLORS[deal.category] || '#0170B9'
  const catLight = CATEGORY_LIGHT[deal.category] || '#f0f9ff'
  const CategoryIcon = CATEGORY_ICON[deal.category]

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
        style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[1000] animate-sheet-up flex flex-col"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          maxHeight: '88vh',
        }}
      >
        {/* Category bar */}
        <div style={{ height: '4px', background: isExhausted ? '#e2e8f0' : catColor, borderRadius: '20px 20px 0 0' }} />

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: '36px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '99px' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 20px 16px' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: '40px', height: '40px', backgroundColor: isExhausted ? '#f1f5f9' : catLight }}
              >
                {CategoryIcon && <CategoryIcon size={18} color={isExhausted ? '#94a3b8' : catColor} />}
              </div>
              <div className="min-w-0">
                <h2
                  className="font-bold leading-snug"
                  style={{ fontFamily: 'Sora, sans-serif', fontSize: '17px', color: '#0f172a' }}
                >
                  {deal.name}
                </h2>
                <div
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ fontFamily: 'Sora, sans-serif', color: isExhausted ? '#94a3b8' : catColor, letterSpacing: '0.08em' }}
                >
                  {CATEGORY_LABELS[deal.category]}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onToggleFave(deal.id)}
                className="flex items-center justify-center rounded-full"
                style={{ width: '30px', height: '30px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer' }}
              >
                <Heart size={14} strokeWidth={2} fill={isFave ? '#ef4444' : 'none'} color={isFave ? '#ef4444' : '#94a3b8'} />
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-full"
                style={{ width: '30px', height: '30px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto ssc-scroll" style={{ padding: '0 20px' }}>
          {/* Deal value hero */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: isExhausted ? '#f8fafc' : catLight, border: `1px solid ${isExhausted ? '#e2e8f0' : catColor + '25'}` }}
          >
            <div
              className="font-bold mb-1"
              style={{ fontFamily: 'Sora, sans-serif', fontSize: '14px', color: isExhausted ? '#94a3b8' : '#0f172a' }}
            >
              {deal.deal.title}
            </div>
            <div
              className="font-bold"
              style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', color: isExhausted ? '#94a3b8' : catColor }}
            >
              {deal.deal.value}
            </div>
          </div>

          <p className="text-sm mb-4" style={{ color: '#64748b', lineHeight: '1.6' }}>
            {deal.deal.description}
          </p>

          {/* Usage */}
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <div
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ fontFamily: 'Sora, sans-serif', color: '#94a3b8', fontSize: '9px' }}
            >
              Usage Tracker
            </div>
            <UsageTracker used={usage.usedCount} maxUses={deal.deal.maxUses} />
          </div>

          {/* Info */}
          <div className="space-y-3 mb-4">
            {[
              deal.address && { Icon: MapPin, text: deal.address, href: `https://www.google.com/maps/dir/?api=1&destination=${deal.lat},${deal.lng}`, external: true },
              deal.locationRestriction && { Icon: MapPin, text: `Valid at: ${deal.locationRestriction}` },
              deal.contact?.hours && { Icon: Clock, text: deal.contact.hours },
              deal.contact?.phone && { Icon: Phone, text: deal.contact.phone, href: `tel:${deal.contact.phone}` },
              deal.contact?.website && { Icon: Globe, text: deal.contact.website.replace(/^https?:\/\//, ''), href: deal.contact.website, external: true },
              deal.deal.expiresAt && { Icon: Calendar, text: `Expires ${deal.deal.expiresAt}` },
            ].filter(Boolean).map((row, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <row.Icon size={13} color="#94a3b8" className="flex-shrink-0 mt-0.5" />
                {row.href ? (
                  <a href={row.href} target={row.external ? '_blank' : undefined}
                    rel={row.external ? 'noopener noreferrer' : undefined}
                    className="text-sm" style={{ color: '#0170B9' }}>{row.text}</a>
                ) : (
                  <span className="text-sm" style={{ color: '#475569' }}>{row.text}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex gap-3"
          style={{ padding: '14px 20px 24px', borderTop: '1px solid #f1f5f9' }}
        >
          <button
            onClick={onClose}
            className="flex-1 font-semibold rounded-xl py-3.5 text-sm"
            style={{ fontFamily: 'Sora, sans-serif', backgroundColor: '#f1f5f9', color: '#475569', border: 'none' }}
          >
            Close
          </button>
          <button
            onClick={onUse}
            disabled={isExhausted}
            className="flex-1 font-semibold rounded-xl py-3.5 text-sm transition-all"
            style={{
              fontFamily: 'Sora, sans-serif',
              backgroundColor: isExhausted ? '#f1f5f9' : '#059669',
              color: isExhausted ? '#94a3b8' : 'white',
              border: 'none',
              cursor: isExhausted ? 'not-allowed' : 'pointer',
            }}
          >
            {isExhausted ? 'No Uses Remaining' : 'Use This Deal'}
          </button>
        </div>
      </div>
    </>
  )
}
