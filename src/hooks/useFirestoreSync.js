import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { STORAGE_KEYS, FIRESTORE_FIELDS as F } from '../constants/storageKeys'

export function mergeUsage(cloud, local) {
  const merged = { ...cloud }
  for (const [id, count] of Object.entries(local)) merged[id] = Math.max(merged[id] ?? 0, count)
  return merged
}

export function mergeFaves(cloud, local) {
  return [...new Set([...cloud, ...local])]
}

export function mergeLog(cloud, local) {
  const byUse = new Map([...cloud, ...local].map(entry => [`${entry.dealId}|${entry.usedAt}`, entry]))
  return [...byUse.values()].sort((a, b) => String(a.usedAt).localeCompare(String(b.usedAt)))
}

// Firestore returns map keys sorted, so maps are compared by sorted entries.
const print = value => JSON.stringify(Array.isArray(value) ? value : Object.entries(value).sort())

// Keeps usage, faves and usageLog in step with users/{userId}. The cloud copy is
// the official one: each launch reads it and replaces what's on the phone.
//
// The one exception is STORAGE_KEYS.synced, which says "this phone holds nothing
// the cloud lacks." Without it (first launch of this version, or a change made
// before the launch read finished) the two copies are merged instead, so
// nothing that only exists on the phone can be lost.
//
// Each of usage/faves/usageLog is a [value, setter] pair. userId is deliberately
// left out of the dependency lists: a change of user must not write the previous
// user's data into the new user's document.
export function useFirestoreSync(userId, usage, faves, usageLog) {
  const fields = [
    { key: F.usage, value: usage[0], set: usage[1], merge: mergeUsage },
    { key: F.faves, value: faves[0], set: faves[1], merge: mergeFaves },
    { key: F.usageLog, value: usageLog[0], set: usageLog[1], merge: mergeLog },
  ]
  const [launchPrints] = useState(() => fields.map(field => print(field.value)))
  const latest = useRef(fields)
  const sent = useRef(null) // what the cloud holds, per field; null until the launch read finishes
  const cloudRead = useRef(false)

  useEffect(() => {
    latest.current = fields
  })

  // mergeFields replaces the whole field, so a deal removed by Undo really goes.
  function save(field, value) {
    setDoc(doc(db, 'users', userId), { [field.key]: value }, { mergeFields: [field.key] })
    sent.current[field.key] = print(value)
  }

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'users', userId))
      .then(snap => (snap.exists() ? snap.data() : null), () => null)
      .then(cloud => {
        if (cancelled) return
        sent.current = {}
        if (!cloud) {
          latest.current.forEach(field => { sent.current[field.key] = print(field.value) })
          return
        }
        const trusted = localStorage.getItem(STORAGE_KEYS.synced) === '1'
        for (const field of latest.current) {
          const remote = cloud[field.key]
          if (remote === undefined) {
            save(field, field.value)
            continue
          }
          sent.current[field.key] = print(remote)
          const next = trusted ? remote : field.merge(remote, field.value)
          if (print(next) !== print(field.value)) field.set(next)
          if (print(next) !== print(remote)) save(field, next)
        }
        localStorage.setItem(STORAGE_KEYS.synced, '1')
        cloudRead.current = true
      })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sent.current) {
      if (fields.some((field, i) => print(field.value) !== launchPrints[i])) localStorage.removeItem(STORAGE_KEYS.synced)
      return
    }
    fields.filter(field => print(field.value) !== sent.current[field.key]).forEach(field => save(field, field.value))
    if (cloudRead.current) localStorage.setItem(STORAGE_KEYS.synced, '1')
  }, [usage[0], faves[0], usageLog[0]]) // eslint-disable-line react-hooks/exhaustive-deps
}
