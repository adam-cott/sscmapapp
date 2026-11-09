import { CARD_YEAR } from '../constants/storageKeys'

// The card runs Oct 1 → Oct 1, and CARD_YEAR ("2026_27") is bumped at each card switch.
const startYear = Number(CARD_YEAR.slice(0, 4))

export function useCardYear() {
  const expiry = new Date(startYear + 1, 9, 1) // month is 0-indexed; 9 = October
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  const isExpired = daysRemaining < 0
  const isExpiring = !isExpired && daysRemaining <= 30

  return { startYear, expiryDate: expiry, daysRemaining, isExpired, isExpiring }
}
