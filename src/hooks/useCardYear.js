const START_YEAR = 2025

// Cards valid Jul 31 of startYear → Jul 31 of startYear+1
export function getExpiryDate(startYear) {
  return new Date(startYear + 1, 6, 31) // month is 0-indexed; 6 = July
}

export function useCardYear() {
  const expiry = getExpiryDate(START_YEAR)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  const isExpired = daysRemaining <= 0
  const isExpiring = !isExpired && daysRemaining <= 30

  return { startYear: START_YEAR, daysRemaining, isExpired, isExpiring }
}
