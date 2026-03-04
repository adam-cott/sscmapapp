import { Marker, Popup } from 'react-leaflet'
import { useMemo } from 'react'
import { createMarkerIcon } from '../../utils/markerIcons'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_LIGHT } from '../../utils/categoryColors'

export default function BusinessMarker({ deal, isSelected, usageState, onClick }) {
  const icon = useMemo(
    () => createMarkerIcon(deal.category, usageState.status, isSelected),
    [deal.category, usageState.status, isSelected]
  )

  const catColor = CATEGORY_COLORS[deal.category] || '#64748b'
  const catLight = CATEGORY_LIGHT[deal.category] || '#f8fafc'
  const remaining = usageState.remaining
  const isExhausted = usageState.status === 'exhausted'
  const isUnlimited = deal.deal.maxUses === null

  return (
    <Marker
      position={[deal.lat, deal.lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif', width: '200px' }}>
          {/* Category stripe */}
          <div style={{ height: '4px', background: isExhausted ? '#e2e8f0' : catColor }} />

          <div style={{ padding: '12px' }}>
            <div style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: '700',
              fontSize: '14px',
              color: '#0f172a',
              marginBottom: '4px',
              lineHeight: '1.3',
            }}>
              {deal.name}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: catColor,
              backgroundColor: catLight,
              borderRadius: '99px',
              padding: '2px 8px',
              marginBottom: '8px',
              border: `1px solid ${catColor}30`,
            }}>
              {CATEGORY_LABELS[deal.category]}
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px', lineHeight: '1.4' }}>
              {deal.deal.title}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: 'Sora, sans-serif',
                color: isExhausted ? '#ef4444' : '#059669',
              }}>
                {isUnlimited
                  ? '∞ Unlimited uses'
                  : isExhausted
                    ? 'No uses left'
                    : `${remaining} use${remaining !== 1 ? 's' : ''} left`}
              </span>
              {!isUnlimited && (
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: deal.deal.maxUses }).map((_, i) => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: i < usageState.usedCount
                        ? '#e2e8f0'
                        : isExhausted ? '#fca5a5' : catColor,
                    }} />
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onClick}
              style={{
                display: 'block',
                width: '100%',
                padding: '7px',
                background: isExhausted ? '#f1f5f9' : '#0170B9',
                color: isExhausted ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isExhausted ? 'default' : 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Sora, sans-serif',
                letterSpacing: '0.01em',
              }}
            >
              {isExhausted ? 'Fully Redeemed' : 'View Deal →'}
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
