import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { renderHook, act } from '@testing-library/react'
import { STORAGE_KEYS, FIRESTORE_FIELDS as F } from '../constants/storageKeys'

const getDocMock = vi.fn()
const setDocMock = vi.fn()
vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'ref'),
  getDoc: (...args) => getDocMock(...args),
  setDoc: (...args) => setDocMock(...args),
}))

import { useFirestoreSync, mergeUsage, mergeFaves, mergeLog } from './useFirestoreSync'

const cloudDoc = data => ({ exists: () => true, data: () => data })
const trust = () => localStorage.setItem(STORAGE_KEYS.synced, '1')
const isTrusted = () => localStorage.getItem(STORAGE_KEYS.synced) === '1'

function start({ usage = {}, faves = [], log = [] } = {}) {
  return renderHook(() => {
    const u = useState(usage)
    const f = useState(faves)
    const l = useState(log)
    useFirestoreSync('user1', u, f, l)
    return { usage: u[0], setUsage: u[1], faves: f[0], setFaves: f[1], log: l[0] }
  })
}

const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() })

beforeEach(() => {
  localStorage.clear()
  getDocMock.mockReset()
  setDocMock.mockReset()
})

describe('merging', () => {
  it('keeps the higher count per deal', () => {
    expect(mergeUsage({ a: 1, b: 3 }, { a: 2, c: 1 })).toEqual({ a: 2, b: 3, c: 1 })
  })

  it('combines favorites without duplicates', () => {
    expect(mergeFaves(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('combines history without duplicates, oldest first', () => {
    const one = { dealId: 'a', usedAt: '2026-10-01T00:00:00Z' }
    const two = { dealId: 'b', usedAt: '2026-10-02T00:00:00Z' }
    expect(mergeLog([two], [one, two])).toEqual([one, two])
  })
})

describe('useFirestoreSync', () => {
  it('a synced phone takes the cloud copy on launch and writes nothing', async () => {
    trust()
    getDocMock.mockResolvedValue(cloudDoc({ [F.usage]: { a: 2 }, [F.faves]: ['x'], [F.usageLog]: [] }))
    const { result } = start({ usage: { a: 1, old: 1 } })
    await settle()
    expect(result.current.usage).toEqual({ a: 2 })
    expect(result.current.faves).toEqual(['x'])
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('same data in a different key order writes nothing', async () => {
    trust()
    getDocMock.mockResolvedValue(cloudDoc({ [F.usage]: { a: 1, b: 2 }, [F.faves]: [], [F.usageLog]: [] }))
    start({ usage: { b: 2, a: 1 } })
    await settle()
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('first launch of this version merges and uploads only what the cloud lacks', async () => {
    getDocMock.mockResolvedValue(cloudDoc({ [F.usage]: { a: 1 }, [F.faves]: ['x'], [F.usageLog]: [] }))
    const { result } = start({ usage: { b: 1 }, faves: ['x'] })
    await settle()
    expect(result.current.usage).toEqual({ a: 1, b: 1 })
    expect(setDocMock).toHaveBeenCalledTimes(1)
    expect(setDocMock.mock.calls[0][1]).toEqual({ [F.usage]: { a: 1, b: 1 } })
    expect(isTrusted()).toBe(true)
  })

  it('Undo replaces the whole usage field in the cloud', async () => {
    trust()
    getDocMock.mockResolvedValue(cloudDoc({ [F.usage]: { a: 1, b: 1 }, [F.faves]: [], [F.usageLog]: [] }))
    const { result } = start({ usage: { a: 1, b: 1 } })
    await settle()
    act(() => result.current.setUsage({ a: 1 }))
    expect(setDocMock).toHaveBeenCalledTimes(1)
    expect(setDocMock.mock.calls[0][1]).toEqual({ [F.usage]: { a: 1 } })
    expect(setDocMock.mock.calls[0][2]).toEqual({ mergeFields: [F.usage] })
  })

  it('a redemption made before the cloud read finishes is kept', async () => {
    trust()
    let resolve
    getDocMock.mockReturnValue(new Promise(r => { resolve = r }))
    const { result } = start({ usage: { a: 1 } })
    act(() => result.current.setUsage({ a: 1, b: 1 }))
    expect(isTrusted()).toBe(false)
    expect(setDocMock).not.toHaveBeenCalled()

    await act(async () => { resolve(cloudDoc({ [F.usage]: { a: 1, c: 1 }, [F.faves]: [], [F.usageLog]: [] })) })
    await settle()
    expect(result.current.usage).toEqual({ a: 1, b: 1, c: 1 })
    expect(setDocMock.mock.calls[0][1]).toEqual({ [F.usage]: { a: 1, b: 1, c: 1 } })
    expect(isTrusted()).toBe(true)
  })

  it('with no cloud read, keeps the phone copy and saves only what changes', async () => {
    getDocMock.mockRejectedValue(new Error('offline'))
    const { result } = start({ usage: { a: 1 }, faves: ['x'] })
    await settle()
    expect(result.current.usage).toEqual({ a: 1 })
    expect(setDocMock).not.toHaveBeenCalled()

    act(() => result.current.setFaves(['x', 'y']))
    expect(setDocMock).toHaveBeenCalledTimes(1)
    expect(setDocMock.mock.calls[0][1]).toEqual({ [F.faves]: ['x', 'y'] })
    expect(isTrusted()).toBe(false)
  })

  it('a missing account document writes nothing on launch', async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => undefined })
    start({ usage: { a: 1 } })
    await settle()
    expect(setDocMock).not.toHaveBeenCalled()
  })
})
