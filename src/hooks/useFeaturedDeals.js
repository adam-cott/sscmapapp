import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Reads featured deal items from Firestore and filters out any that have expired.
// Returns { featuredIds, featuredItems, loading } where:
//   featuredIds  — plain array of deal ID strings (for HomeTab lookup)
//   featuredItems — full objects { id, until } (for AdminTab display)
export function useFeaturedDeals() {
  const [featuredItems, setFeaturedItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'featured'), (snap) => {
      const items = snap.exists() ? (snap.data().items ?? []) : []
      const now = new Date()
      const active = items.filter(item => !item.until || new Date(item.until) > now)
      setFeaturedItems(active)
      setLoading(false)
    })
    return unsub
  }, [])

  const featuredIds = featuredItems.map(item => item.id)
  return { featuredIds, featuredItems, loading }
}
