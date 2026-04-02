import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isSignUp) {
        await signUp(email, password, firstName.trim())
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  function friendlyError(code) {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found': return 'Invalid email or password.'
      case 'auth/email-already-in-use': return 'An account with that email already exists.'
      case 'auth/weak-password': return 'Password must be at least 6 characters.'
      case 'auth/invalid-email': return 'Please enter a valid email address.'
      default: return 'Something went wrong. Please try again.'
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', backgroundColor: '#f0f4f8', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--ssc-blue)' }}>
            Starving Student Card
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isSignUp && (
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <p style={{ fontSize: '13px', color: '#ef4444', textAlign: 'center', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '4px', padding: '13px', borderRadius: '12px', border: 'none',
              backgroundColor: 'var(--ssc-blue)', color: '#fff',
              fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '15px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => { setIsSignUp(v => !v); setError('') }}
            style={{ color: 'var(--ssc-blue)', fontWeight: 600, cursor: 'pointer' }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </span>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '12px 14px', borderRadius: '12px',
  border: '1px solid #e2e8f0', backgroundColor: '#fff',
  fontSize: '15px', color: '#0f172a', outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
}
