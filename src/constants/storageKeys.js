// Usage, history and favorites are saved per card year. Changing CARD_YEAR for
// a new card starts everyone fresh; last year's data stays untouched under its
// old localStorage keys and Firestore fields.
export const CARD_YEAR = '2026_27'

export const STORAGE_KEYS = {
  usage:    `ssc_usage_${CARD_YEAR}`,
  faves:    `ssc_faves_${CARD_YEAR}`,
  usageLog: `ssc_usage_log_${CARD_YEAR}`,
  uid:      'ssc_uid',
}

// Field names on users/{uid} in Firestore.
export const FIRESTORE_FIELDS = {
  usage:    `usage_${CARD_YEAR}`,
  faves:    `faves_${CARD_YEAR}`,
  usageLog: `usageLog_${CARD_YEAR}`,
}
