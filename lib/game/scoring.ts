/**
 * Calculate points based on answer time
 * Faster answers = more points
 */
export function calculatePoints(timeTakenMs: number): number {
  const timeSec = timeTakenMs / 1000

  if (timeSec < 1) return 20
  if (timeSec < 2) return 18
  if (timeSec < 3) return 16
  if (timeSec < 4) return 14
  if (timeSec < 5) return 12
  if (timeSec < 10) return 10

  return 0
}

/**
 * Validate answer time is reasonable
 */
export function isValidAnswerTime(timeTakenMs: number): boolean {
  return timeTakenMs >= 0 && timeTakenMs <= 10000
}
