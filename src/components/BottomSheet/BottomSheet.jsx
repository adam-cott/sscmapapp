import { useState } from 'react'
import { CATEGORY_COLORS } from '../../utils/categoryColors'
import DealDetails from '../UI/DealDetails'
import RedemptionScreen from '../UI/RedemptionScreen'

export default function BottomSheet({ deal, onUse, onRedeemDone, onClose, ...detailProps }) {
  const isExhausted = deal.usage.status === 'exhausted'
  const [showRedemption, setShowRedemption] = useState(false)

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
          overflow: 'hidden',
        }}
      >
        <div style={{ height: '4px', background: isExhausted ? '#e2e8f0' : (CATEGORY_COLORS[deal.category] || '#0170B9') }} />
        <div className="flex justify-center pt-3">
          <div style={{ width: '36px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '99px' }} />
        </div>
        <DealDetails
          deal={deal}
          onClose={onClose}
          onRedeem={() => { onUse(); setShowRedemption(true) }}
          footerStyle={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
          {...detailProps}
        />
      </div>

      {showRedemption && (
        <RedemptionScreen
          deal={deal}
          onDone={() => {
            setShowRedemption(false)
            onRedeemDone()
          }}
        />
      )}
    </>
  )
}
