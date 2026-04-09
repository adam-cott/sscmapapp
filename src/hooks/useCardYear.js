// Cards valid Aug 1 of startYear → Jul 31 of startYear+1.
// Start year is derived from today's date so no manual update is needed each year.
function getStartYear() {
  const today = new Date()
  return today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1
}

export function useCardYear() {
  const startYear = getStartYear()
  const expiry = new Date(startYear + 1, 6, 31) // month is 0-indexed; 6 = July
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  const isExpired = daysRemaining <= 0
  const isExpiring = !isExpired && daysRemaining <= 30

  return { startYear, expiryDate: expiry, daysRemaining, isExpired, isExpiring }
}
