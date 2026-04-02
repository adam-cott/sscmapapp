import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useCardYear, getExpiryDate } from '../../hooks/useCardYear'

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function getYearOptions() {
  const now = new Date()
  const y = now.getFullYear()
  return [y - 1, y, y + 1]
}

export default function CardYearScreen({ onBack }) {
  const { startYear, setStartYear, daysRemaining, isExpired, isExpiring } = useCardYear()

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

      {/* Year picker */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '13px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select Your Card Year
          </h3>
        </div>
        {getYearOptions().map((y, i, arr) => {
          const selected = y === startYear
          const expiry = getExpiryDate(y)
          const expired = new Date() > expiry
          return (
            <div
              key={y}
              onClick={() => setStartYear(y)}
              style={{
                display: 'flex', alignItems: 'center', padding: '14px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer', backgroundColor: selected ? '#f0f7ff' : 'transparent',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '15px', color: selected ? 'var(--ssc-blue)' : '#0f172a' }}>
                  {y}–{y + 1}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Jul 31, {y} – Jul 31, {y + 1} {expired ? '· Expired' : ''}
                </div>
              </div>
              {selected && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ssc-blue)' }} />
              )}
            </div>
          )
        })}
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
