import { Heart } from 'lucide-react'
import DealCard from '../ListView/DealCard'

export default function FavesTab({ deals, onSelectDeal, onToggleFave, userCoords }) {
  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <Heart size={48} strokeWidth={1.5} color="#e2e8f0" />
        <p className="text-lg font-bold mt-4 text-gray-700" style={{ fontFamily: 'var(--font-display)' }}>No favorites yet</p>
        <p className="text-sm text-gray-400 mt-1">Open any deal and tap the heart to save it here</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Favorites</h2>
        <p className="text-xs text-gray-400 mt-0.5">{deals.length} saved deal{deals.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 overflow-y-auto ssc-scroll px-4 pb-4 space-y-3">
        {deals.map(deal => (
          <div key={deal.id} style={{ position: 'relative' }}>
            <DealCard deal={deal} onClick={() => onSelectDeal(deal)} userCoords={userCoords} />
            <button
              onClick={() => onToggleFave(deal.id)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1,
              }}
            >
              <Heart size={14} fill="#ef4444" color="#ef4444" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
