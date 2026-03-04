import DealCard from './DealCard'

export default function ListView({ deals, onSelectDeal }) {
  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          🔍
        </div>
        <p
          className="font-bold text-base mb-1"
          style={{ fontFamily: 'Sora, sans-serif', color: '#0f172a' }}
        >
          No deals found
        </p>
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          Try adjusting your search or filters
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2.5">
      {deals.map((deal, i) => (
        <div
          key={deal.id}
          className="animate-slide-up"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <DealCard deal={deal} onClick={() => onSelectDeal(deal)} />
        </div>
      ))}
    </div>
  )
}
