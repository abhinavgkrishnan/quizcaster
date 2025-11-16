/**
 * Centralized Topic Color Mapping
 * Maps database color_class values to actual CSS classes
 */

const TOPIC_COLOR_MAP: Record<string, string> = {
  'brutal-violet': 'brutal-violet',
  'brutal-beige': 'brutal-beige',
  'brutal-green': 'brutal-green',
  'brutal-white': 'brutal-white',
  'brutal-gray': 'brutal-gray',
} as const

/**
 * Get the CSS class for a topic's color
 * @param colorClass - The color_class from the database
 * @returns The CSS class to apply, defaults to brutal-violet if not found
 */
export function getTopicColorClass(colorClass: string | null | undefined): string {
  if (!colorClass) return 'brutal-violet'
  return TOPIC_COLOR_MAP[colorClass] || 'brutal-violet'
}

/**
 * Get all available topic color classes
 * Useful for validating or displaying color options
 */
export function getAvailableTopicColors(): string[] {
  return Object.keys(TOPIC_COLOR_MAP)
}
