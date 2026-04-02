import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useCardYear, getExpiryDate } from '../../hooks/useCardYear'

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function CardYearScreen({ onBack }) {
  const { startYear, daysRemaining, isExpired, isExpiring } = useCardYear()

  const expiryDate = getExpiryDate(startYear)
  const startDate = new Date(startYear, 6, 31)

  const statusColor = isExpired ? '#ef4444' : isExpiring ? '#f97316' : '#22c55e'
  const statusText = isExpired
    ? 'Your card has expired'
    : isExpiring
    ? `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    : `${daysRemaining} days remaining`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f0f4f8', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 12px', backgroundColor: '#fff', borderBottom: '1px solid #e8edf3' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginRight: '8px', color: '#0f172a' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '17px', color: '#0f172a', margin: 0 }}>
          Card Year
        </h2>
      </div>

      {/* Status card */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '22px', color: '#0f172a' }}>
            {startYear}–{startYear + 1}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            {formatDate(startDate)} – {formatDate(expiryDate)}
          </div>
          <div style={{
            display: 'inline-block', marginTop: '12px',
            padding: '5px 14px', borderRadius: '999px',
            backgroundColor: `${statusColor}18`,
            color: statusColor,
            fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '13px',
          }}>
            {statusText}
          </div>
        </div>
      </div>

      {/* Buy new card */}
      {(isExpiring || isExpired) && (
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '14px', color: '#9a3412', marginBottom: '6px' }}>
              {isExpired ? 'Time for a new card!' : 'Your card is expiring soon!'}
            </div>
            <p style={{ fontSize: '13px', color: '#c2410c', lineHeight: '1.5', margin: '0 0 12px' }}>
              {isExpired
                ? "Don't miss out on hundreds of local deals — grab next year's Starving Student Card today!"
                : "Don't let your savings run out! Pick up next year's card before this one expires."}
            </p>
            <a
              href="https://sscdeals.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', borderRadius: '10px',
                backgroundColor: '#ea580c', color: '#fff',
                fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Buy at sscdeals.com <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}

      <div style={{ height: '24px' }} />
    </div>
  )
}
