/**
 * Scoring utilities for game answers
 * Uses centralized constants for consistency
 */

import { SCORING } from '@/lib/constants';

/**
 * Calculate points based on answer time
 * Faster answers = more points
 */
export function calculatePoints(timeTakenMs: number): number {
  const timeSec = timeTakenMs / 1000;

  // Find matching time threshold
  for (const threshold of SCORING.TIME_THRESHOLDS) {
    if (timeSec < threshold.maxTime) {
      return threshold.points;
    }
  }

  return 0;
}

/**
 * Validate answer time is reasonable
 * Allows up to 15 seconds to account for network delays
 */
export function isValidAnswerTime(timeTakenMs: number): boolean {
  return timeTakenMs >= SCORING.MIN_TIME && timeTakenMs <= 15000; // Allow 15s for timeouts + network delay
}
