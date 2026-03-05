import { useEffect } from 'react'

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <>
      <div
        className="fixed inset-0 z-[1100] animate-fade-in"
        style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onCancel}
      />
      <div
        className="fixed z-[1200] animate-modal-in"
        style={{
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '320px',
          padding: '24px',
        }}
      >
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '14px', fontWeight: '600', fontFamily: 'Sora, sans-serif', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: '14px', fontWeight: '600', fontFamily: 'Sora, sans-serif', cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
