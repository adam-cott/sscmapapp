import { useState } from 'react'
import { CATEGORY_COLORS } from '../../utils/categoryColors'
import DealDetails from '../UI/DealDetails'
import RedemptionScreen from '../UI/RedemptionScreen'

export default function DealModal({ deal, onUse, onRedeemDone, onClose, ...detailProps }) {
  const isExhausted = deal.usage.status === 'exhausted'
  const [showRedemption, setShowRedemption] = useState(false)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[900] animate-fade-in"
        style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal — RedemptionScreen stays outside it: this box's transform would trap a fixed overlay */}
      <div
        className="fixed z-[1000] animate-modal-in flex flex-col"
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
        <div style={{ height: '5px', background: isExhausted ? '#e2e8f0' : (CATEGORY_COLORS[deal.category] || '#0170B9') }} />
        <DealDetails
          deal={deal}
          onClose={onClose}
          onRedeem={() => { onUse(); setShowRedemption(true) }}
          bodyStyle={{ maxHeight: '55vh' }}
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
