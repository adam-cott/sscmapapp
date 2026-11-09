import { useEffect, useState } from 'react'
import { MapPin, Clock, Globe, Copy, Check, Navigation, Phone, Map as MapIcon } from 'lucide-react'
import BusinessLogo from './BusinessLogo'
import FaveButton from './FaveButton'
import SwipeToConfirm from './SwipeToConfirm'
import { CATEGORY_COLORS, CATEGORY_LIGHT, CATEGORY_LABELS } from '../../utils/categoryColors'
import { getDisplayValue, getMapFocusLocations, getDirectionsLocation } from '../../utils/dealHelpers'

function usesLabel(used, maxUses) {
  if (maxUses === null) return { text: 'Unlimited uses', color: '#047857', bg: '#d1fae5' }
  const left = Math.max(0, maxUses - used)
  if (left === 0) return { text: 'All used', color: '#b91c1c', bg: '#fee2e2' }
  if (used === 0) return { text: maxUses === 1 ? '1 use left' : `${maxUses} uses left`, color: '#047857', bg: '#d1fae5' }
  return { text: `${left} of ${maxUses} left`, color: '#b45309', bg: '#fef3c7' }
}

// Shared body of the deal sheet (phones) and deal popup (desktop): header,
// deal card, action buttons, details and slide-to-redeem. The wrappers own
// the backdrop, container and RedemptionScreen.
export default function DealDetails({ deal, onClose, onRedeem, isFave, onToggleFave, onViewOnMap, userCoords, bodyStyle, footerStyle }) {
  const isExhausted = deal.usage.status === 'exhausted'
  const catColor = isExhausted ? '#94a3b8' : (CATEGORY_COLORS[deal.category] || '#0170B9')
  const catLight = isExhausted ? '#f8fafc' : (CATEGORY_LIGHT[deal.category] || '#f0f9ff')
  const displayValue = getDisplayValue(deal)
  const uses = usesLabel(deal.usage.usedCount, deal.deal.maxUses)
  const directions = getDirectionsLocation(deal, userCoords)
  const canViewOnMap = onViewOnMap && !!getMapFocusLocations(deal)?.length
  const phone = directions?.phone
  const [copied, setCopied] = useState(false)

  const copyAddress = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const actions = [
    directions && { Icon: Navigation, label: 'Directions', href: `https://www.google.com/maps/dir/?api=1&destination=${directions.lat},${directions.lng}`, external: true },
    phone && { Icon: Phone, label: 'Call', href: `tel:${phone}` },
    canViewOnMap && { Icon: MapIcon, label: 'On map', onClick: onViewOnMap },
  ].filter(Boolean)

  const details = [
    directions?.address && { Icon: MapPin, text: directions.address, copy: true },
    deal.locationRestriction && { Icon: MapPin, text: `Valid at: ${deal.locationRestriction}` },
    deal.contact?.hours && { Icon: Clock, text: deal.contact.hours },
    deal.contact?.website && { Icon: Globe, text: deal.contact.website.replace(/^https?:\/\//, '') },
  ].filter(Boolean)

  const actionStyle = {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '10px 4px', borderRadius: '14px', backgroundColor: '#f1f5f9', color: '#0170B9',
    border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, textDecoration: 'none',
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3" style={{ padding: '14px 20px 14px' }}>
        <div style={{ opacity: isExhausted ? 0.5 : 1 }}>
          <BusinessLogo name={deal.name} size={52} padding={0} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold leading-snug" style={{ fontFamily: 'Sora, sans-serif', fontSize: '17px', color: '#0f172a' }}>
            {deal.name}
          </h2>
          <div className="text-xs font-semibold uppercase" style={{ fontFamily: 'Sora, sans-serif', color: catColor, letterSpacing: '0.08em' }}>
            {CATEGORY_LABELS[deal.category]}
          </div>
        </div>
        <FaveButton isFave={isFave} onToggle={() => onToggleFave(deal.id)} size={32} />
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 press flex-shrink-0"
          style={{ width: '32px', height: '32px', color: '#64748b', border: 'none', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto ssc-scroll" style={{ padding: '0 20px', ...bodyStyle }}>
        {/* Deal card */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: catLight, border: `1px solid ${catColor}30` }}>
          <div className="font-bold" style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', lineHeight: 1.35, color: isExhausted ? '#94a3b8' : '#0f172a' }}>
            {deal.deal.title}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {displayValue && (
              <span className="font-semibold rounded-full" style={{ fontSize: '12px', padding: '4px 11px', backgroundColor: catColor, color: '#fff' }}>
                {displayValue}
              </span>
            )}
            <span className="font-semibold rounded-full flex items-center gap-1.5" style={{ fontSize: '12px', padding: '4px 11px', backgroundColor: uses.bg, color: uses.color }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: uses.color }} />
              {uses.text}
            </span>
          </div>
          {deal.deal.description && (
            <p className="text-sm mt-2.5" style={{ color: '#475569', lineHeight: 1.5 }}>{deal.deal.description}</p>
          )}
        </div>

        {/* Action buttons */}
        {actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map(({ Icon, label, href, external, onClick }) => {
              const content = <><Icon size={18} strokeWidth={2.2} />{label}</>
              return href ? (
                <a key={label} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="press" style={actionStyle}>{content}</a>
              ) : (
                <button key={label} onClick={onClick} className="press" style={actionStyle}>{content}</button>
              )
            })}
          </div>
        )}

        {/* Details */}
        <div className="space-y-1.5 mt-4 mb-4">
          {details.map(({ Icon, text, copy }) => {
            const Row = copy ? 'button' : 'div'
            const CopyIcon = copied ? Check : Copy
            return (
              <Row
                key={text}
                onClick={copy ? () => copyAddress(text) : undefined}
                className="flex items-start gap-2 w-full text-left"
                style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.4, background: 'none', border: 'none', padding: 0, cursor: copy ? 'pointer' : undefined }}
              >
                <Icon size={13} className="flex-shrink-0" style={{ marginTop: '2px', color: '#94a3b8' }} />
                <span className="flex-1">{copy && copied ? 'Address copied' : text}</span>
                {copy && <CopyIcon size={13} className="flex-shrink-0" style={{ marginTop: '2px', color: copied ? '#047857' : '#94a3b8' }} />}
              </Row>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 20px 20px', borderTop: '1px solid #f1f5f9', ...footerStyle }}>
        <SwipeToConfirm onConfirm={onRedeem} disabled={isExhausted} />
      </div>
    </>
  )
}
