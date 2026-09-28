import { useEffect, useRef } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { FIRESTORE_FIELDS as F } from '../constants/storageKeys'

// Syncs usage, faves, and usageLog to Firestore whenever they change.
// Skips the initial render so we don't overwrite Firestore with the
// locally-seeded values that were just read from it.
// userId is deliberately left out of each dependency list: a change of user
// must not write the previous user's data into the new user's document.
export function useFirestoreSync(userId, usageMap, faves, usageLog) {
  const usageReady = useRef(false)
  const favesReady = useRef(false)
  const logReady = useRef(false)

  useEffect(() => {
    if (!usageReady.current) { usageReady.current = true; return }
    setDoc(doc(db, 'users', userId), { [F.usage]: usageMap }, { merge: true })
  }, [usageMap]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!favesReady.current) { favesReady.current = true; return }
    setDoc(doc(db, 'users', userId), { [F.faves]: faves }, { merge: true })
  }, [faves]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!logReady.current) { logReady.current = true; return }
    setDoc(doc(db, 'users', userId), { [F.usageLog]: usageLog }, { merge: true })
  }, [usageLog]) // eslint-disable-line react-hooks/exhaustive-deps
}
