import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password': return 'Incorrect password.'
    case 'auth/email-already-in-use': return 'That email is already in use.'
    case 'auth/invalid-email': return 'Please enter a valid email address.'
    case 'auth/weak-password': return 'Password must be at least 6 characters.'
    case 'auth/requires-recent-login': return 'Please sign out and sign back in, then try again.'
    default: return 'Something went wrong. Please try again.'
  }
}

function SectionCard({ children }) {
  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden bg-white shadow-sm">
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9' }}>
      <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '13px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
      </h3>
    </div>
  )
}

function StatusMsg({ status }) {
  if (!status) return null
  return (
    <p style={{ fontSize: '13px', color: status.type === 'success' ? '#22c55e' : '#ef4444', margin: '6px 0 0' }}>
      {status.msg}
    </p>
  )
}

export default function EditProfileScreen({ onBack }) {
  const { firstName: authFirstName, updateFirstName, updateCredentials } = useAuth()

  const [name, setName] = useState(authFirstName)
  const [nameStatus, setNameStatus] = useState(null)
  const [nameSaving, setNameSaving] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [emailPass, setEmailPass] = useState('')
  const [emailStatus, setEmailStatus] = useState(null)
  const [emailSaving, setEmailSaving] = useState(false)

  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passCurrentPass, setPassCurrentPass] = useState('')
  const [passStatus, setPassStatus] = useState(null)
  const [passSaving, setPassSaving] = useState(false)

  async function handleSaveName(e) {
    e.preventDefault()
    if (!name.trim()) return
    setNameSaving(true)
    setNameStatus(null)
    try {
      await updateFirstName(name.trim())
      setNameStatus({ type: 'success', msg: 'Name updated.' })
    } catch (err) {
      setNameStatus({ type: 'error', msg: friendlyError(err.code) })
    } finally {
      setNameSaving(false)
    }
  }

  async function handleSaveEmail(e) {
    e.preventDefault()
    if (!newEmail.trim() || !emailPass) return
    setEmailSaving(true)
    setEmailStatus(null)
    try {
      await updateCredentials({ currentPassword: emailPass, newEmail: newEmail.trim() })
      setEmailStatus({ type: 'success', msg: 'Email updated.' })
      setNewEmail('')
      setEmailPass('')
    } catch (err) {
      setEmailStatus({ type: 'error', msg: friendlyError(err.code) })
    } finally {
      setEmailSaving(false)
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault()
    if (!newPass || !confirmPass || !passCurrentPass) return
    if (newPass !== confirmPass) {
      setPassStatus({ type: 'error', msg: 'Passwords do not match.' })
      return
    }
    if (newPass.length < 6) {
      setPassStatus({ type: 'error', msg: 'Password must be at least 6 characters.' })
      return
    }
    setPassSaving(true)
    setPassStatus(null)
    try {
      await updateCredentials({ currentPassword: passCurrentPass, newPassword: newPass })
      setPassStatus({ type: 'success', msg: 'Password updated.' })
      setNewPass('')
      setConfirmPass('')
      setPassCurrentPass('')
    } catch (err) {
      setPassStatus({ type: 'error', msg: friendlyError(err.code) })
    } finally {
      setPassSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f0f4f8', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 12px', backgroundColor: '#fff', borderBottom: '1px solid #e8edf3' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginRight: '8px', color: '#0f172a' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '17px', color: '#0f172a', margin: 0 }}>
          Edit Profile
        </h2>
      </div>

      {/* Name */}
      <SectionCard>
        <SectionTitle>Name</SectionTitle>
        <form onSubmit={handleSaveName} style={{ padding: '14px 16px' }}>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setNameStatus(null) }}
            placeholder="First name"
            required
            style={inputStyle}
          />
          <StatusMsg status={nameStatus} />
          <button type="submit" disabled={nameSaving} style={saveBtn(nameSaving)}>
            {nameSaving ? 'Saving…' : 'Save Name'}
          </button>
        </form>
      </SectionCard>

      {/* Email */}
      <SectionCard>
        <SectionTitle>Email</SectionTitle>
        <form onSubmit={handleSaveEmail} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            value={newEmail}
            onChange={e => { setNewEmail(e.target.value); setEmailStatus(null) }}
            placeholder="New email address"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={emailPass}
            onChange={e => { setEmailPass(e.target.value); setEmailStatus(null) }}
            placeholder="Current password"
            required
            style={inputStyle}
          />
          <StatusMsg status={emailStatus} />
          <button type="submit" disabled={emailSaving} style={saveBtn(emailSaving)}>
            {emailSaving ? 'Saving…' : 'Save Email'}
          </button>
        </form>
      </SectionCard>

      {/* Password */}
      <SectionCard>
        <SectionTitle>Password</SectionTitle>
        <form onSubmit={handleSavePassword} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="password"
            value={newPass}
            onChange={e => { setNewPass(e.target.value); setPassStatus(null) }}
            placeholder="New password"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={confirmPass}
            onChange={e => { setConfirmPass(e.target.value); setPassStatus(null) }}
            placeholder="Confirm new password"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={passCurrentPass}
            onChange={e => { setPassCurrentPass(e.target.value); setPassStatus(null) }}
            placeholder="Current password"
            required
            style={inputStyle}
          />
          <StatusMsg status={passStatus} />
          <button type="submit" disabled={passSaving} style={saveBtn(passSaving)}>
            {passSaving ? 'Saving…' : 'Save Password'}
          </button>
        </form>
      </SectionCard>

      <div style={{ height: '24px' }} />
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 13px', borderRadius: '10px',
  border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
  fontSize: '15px', color: '#0f172a', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
}

const saveBtn = (disabled) => ({
  marginTop: '4px', padding: '11px', borderRadius: '10px', border: 'none',
  backgroundColor: 'var(--ssc-blue)', color: '#fff',
  fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '14px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  width: '100%',
})
