import { useEffect, useRef } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Syncs usage, faves, and usageLog to Firestore whenever they change.
// Skips the initial render so we don't overwrite Firestore with the
// locally-seeded values that were just read from it.
export function useFirestoreSync(userId, usageMap, faves, usageLog) {
  const usageReady = useRef(false)
  const favesReady = useRef(false)
  const logReady = useRef(false)

  useEffect(() => {
    if (!usageReady.current) { usageReady.current = true; return }
    setDoc(doc(db, 'users', userId), { usage: usageMap }, { merge: true })
  }, [usageMap])

  useEffect(() => {
    if (!favesReady.current) { favesReady.current = true; return }
    setDoc(doc(db, 'users', userId), { faves }, { merge: true })
  }, [faves])

  useEffect(() => {
    if (!logReady.current) { logReady.current = true; return }
    setDoc(doc(db, 'users', userId), { usageLog }, { merge: true })
  }, [usageLog])
}
