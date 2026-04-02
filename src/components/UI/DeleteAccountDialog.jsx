import { useEffect, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import { useAuth } from '../../hooks/useAuth'

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password': return 'Incorrect password.'
    case 'auth/requires-recent-login': return 'Please sign out and sign back in, then try again.'
    default: return 'Something went wrong. Please try again.'
  }
}

export default function DeleteAccountDialog({ onCancel }) {
  const { deleteAccount } = useAuth()
  const [step, setStep] = useState('warn')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  async function handleDelete() {
    if (!password) return
    setError('')
    setDeleting(true)
    try {
      await deleteAccount(password)
    } catch (err) {
      setError(friendlyError(err.code))
      setDeleting(false)
    }
  }

  if (step === 'warn') {
    return (
      <ConfirmDialog
        title="Delete your account?"
        message="This permanently deletes your account, saved favorites, and all usage history. This cannot be undone."
        confirmLabel="Continue"
        onConfirm={() => setStep('password')}
        onCancel={onCancel}
      />
    )
  }

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
          backgroundColor: 'white', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '320px', padding: '24px',
        }}
      >
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>
          Enter your password to confirm
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '14px' }}>
          Type your current password to permanently delete your account.
        </p>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          placeholder="Current password"
          autoFocus
          style={{
            width: '100%', padding: '11px 13px', borderRadius: '10px',
            border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
            fontSize: '15px', color: '#0f172a', outline: 'none',
            fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
            marginBottom: '6px',
          }}
        />
        {error && (
          <p style={{ fontSize: '13px', color: '#ef4444', margin: '0 0 10px' }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '14px', fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || !password}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: deleting || !password ? 'not-allowed' : 'pointer', opacity: deleting || !password ? 0.7 : 1 }}
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </div>
    </>
  )
}
