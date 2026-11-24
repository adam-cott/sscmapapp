import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { STORAGE_KEYS } from '../constants/storageKeys'

let authCallback
vi.mock('../firebase', () => ({ auth: {}, db: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, cb) => { authCallback = cb; return () => {} },
  signOut: vi.fn(),
}))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: () => Promise.resolve({ exists: () => true, data: () => ({ firstName: 'New' }) }),
}))

import { AuthProvider, useAuth } from './useAuth'

beforeEach(() => localStorage.clear())

describe('useAuth account switch', () => {
  it("a different account doesn't inherit the last person's saved data", async () => {
    localStorage.setItem(STORAGE_KEYS.uid, 'old-user')
    localStorage.setItem(STORAGE_KEYS.usage, '{"deal-1":2}')
    localStorage.setItem(STORAGE_KEYS.faves, '["deal-1"]')
    localStorage.setItem(STORAGE_KEYS.locationAsked, '1')

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    authCallback({ uid: 'new-user' })
    await waitFor(() => expect(result.current.user?.uid).toBe('new-user'))

    expect(localStorage.getItem(STORAGE_KEYS.usage)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.faves)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.uid)).toBe('new-user')
    expect(localStorage.getItem(STORAGE_KEYS.locationAsked)).toBe('1')
  })
})
