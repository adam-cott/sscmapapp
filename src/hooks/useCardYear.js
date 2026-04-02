import { useLocalStorage } from './useLocalStorage'

// Cards valid Jul 31 of startYear → Jul 31 of startYear+1
export function getExpiryDate(startYear) {
  return new Date(startYear + 1, 6, 31) // month is 0-indexed; 6 = July
}

export function getDaysRemaining(startYear) {
  const expiry = getExpiryDate(startYear)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
}

export function getDefaultStartYear() {
  const now = new Date()
  const year = now.getFullYear()
  const cutoff = new Date(year, 6, 31) // July 31 of current year
  return now > cutoff ? year : year - 1
}

export function useCardYear() {
  const [startYear, setStartYear] = useLocalStorage('ssc_card_year_v1', getDefaultStartYear())
  const daysRemaining = getDaysRemaining(startYear)
  const isExpired = daysRemaining <= 0
  const isExpiring = !isExpired && daysRemaining <= 30

  return { startYear, setStartYear, daysRemaining, isExpired, isExpiring }
}
