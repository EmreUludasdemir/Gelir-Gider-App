export const SUBSCRIPTION_REASON_LABELS: Record<string, string> = {
  recurring_pattern_detected: 'Benzer odeme deseni tekrar ediyor.',
  known_merchant_match: 'Bilinen abonelik saglayicisi ile eslesti.',
  frequency_history_strong: 'Birden fazla donem boyunca tekrarlandi.',
  amount_consistent: 'Tutarlar birbirine yakin ilerliyor.',
  cadence_stable: 'Odeme araliklari duzenli gorunuyor.',
  merchant_similarity_high: 'Aciklamalar ayni satıcıya isaret ediyor.',
  frequency_stable: 'Haftalik, aylik veya yillik ritim net.',
  active_recently: 'Son odeme yakin tarihte goruldu.',
  user_confirmed_history: 'Daha once kullanici tarafindan onaylandi.',
  user_rejected_history: 'Daha once reddedildi.',
}

export function describeSubscriptionReason(code: string) {
  return SUBSCRIPTION_REASON_LABELS[code] || 'Tekrarlayan odeme sinyali.'
}
