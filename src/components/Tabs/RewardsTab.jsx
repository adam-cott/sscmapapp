import { Trophy } from 'lucide-react'

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

  // Savings scaffold — when deal.dealValue is added to deals.json, replace null with:
  // usageLog.reduce((sum, e) => sum + (dealById[e.dealId]?.deal?.dealValue ?? 0), 0)
  const estimatedSavings = null

  const sortedLog = [...usageLog].reverse()

  if (totalRedemptions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <Trophy size={48} strokeWidth={1.5} color="#e2e8f0" />
        <p className="text-lg font-bold mt-4 text-gray-700" style={{ fontFamily: 'var(--font-display)' }}>No deals used yet</p>
        <p className="text-sm text-gray-400 mt-1">Your usage history will appear here</p>
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
          <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.1em' }}>
              Deals Used
            </p>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ssc-blue)' }}>
              {totalRedemptions}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">redemption{totalRedemptions !== 1 ? 's' : ''} this year</p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.1em' }}>
              Est. Savings
            </p>
            {estimatedSavings !== null ? (
              <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'var(--font-display)' }}>
                ${estimatedSavings.toFixed(2)}
              </p>
            ) : (
              <p className="text-lg font-bold text-gray-300" style={{ fontFamily: 'var(--font-display)' }}>—</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">Savings tracking coming soon</p>
          </div>
        </div>

        {/* Usage history */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1" style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.1em' }}>
            History
          </p>
          <div className="rounded-2xl bg-white overflow-hidden shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
            {sortedLog.map((entry, i) => {
              const deal = dealById[entry.dealId]
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < sortedLog.length - 1 ? '1px solid #f8fafc' : 'none' }}
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
                      {formatDate(entry.usedAt)}
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
