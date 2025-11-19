/**
 * useTouchClick Hook
 * Provides optimized touch and click handling for mobile-first interactions
 */

"use client"

import { useCallback, useRef, useState, useEffect } from 'react'

interface UseTouchClickOptions {
  /** Callback fired when element is clicked/tapped */
  onPress: () => void
  /** Disabled state */
  disabled?: boolean
  /** Enable active state visual feedback */
  enableActiveState?: boolean
  /** Custom active state transform */
  activeTransform?: string
  /** Custom active state shadow */
  activeShadow?: string
}

interface UseTouchClickReturn {
  /** Props to spread on the target element */
  touchClickProps: {
    onClick: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onTouchCancel: (e: React.TouchEvent) => void
    style?: React.CSSProperties
  }
  /** Whether element is currently being pressed */
  isActive: boolean
  /** Whether the device supports touch */
  isTouchDevice: boolean
}

/**
 * Hook for handling both touch and click interactions properly
 *
 * @example
 * const { touchClickProps, isActive } = useTouchClick({
 *   onPress: handleClick,
 *   disabled: isDisabled
 * })
 *
 * return <button {...touchClickProps} disabled={isDisabled}>Click Me</button>
 */
export function useTouchClick({
  onPress,
  disabled = false,
  enableActiveState = true,
  activeTransform = 'translate3d(0, -2px, 0)',
  activeShadow = '6px 6px 0px 0px rgba(0,0,0,1)'
}: UseTouchClickOptions): UseTouchClickReturn {
  const [isActive, setIsActive] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const touchStartedRef = useRef(false)
  const touchHandledRef = useRef(false)

  // Detect touch device
  useEffect(() => {
    const hasTouchSupport = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    setIsTouchDevice(hasTouchSupport)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return

    touchStartedRef.current = true
    touchHandledRef.current = false

    if (enableActiveState) {
      setIsActive(true)
    }
  }, [disabled, enableActiveState])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return

    setIsActive(false)

    // Only fire onPress if touch started on this element
    if (touchStartedRef.current && !touchHandledRef.current) {
      touchHandledRef.current = true
      onPress()
    }

    // Reset after a delay to prevent click event from firing
    setTimeout(() => {
      touchStartedRef.current = false
    }, 500)
  }, [disabled, onPress])

  const handleTouchCancel = useCallback((e: React.TouchEvent) => {
    if (disabled) return

    setIsActive(false)
    touchStartedRef.current = false
    touchHandledRef.current = false
  }, [disabled])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return

    // Prevent click if touch was recently handled
    if (touchHandledRef.current) {
      e.preventDefault()
      return
    }

    // Only handle click on non-touch devices or if touch didn't start
    if (!touchStartedRef.current) {
      onPress()
    }
  }, [disabled, onPress])

  const touchClickProps: UseTouchClickReturn['touchClickProps'] = {
    onClick: handleClick,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  }

  // Add active state styles if enabled
  if (enableActiveState && isActive) {
    touchClickProps.style = {
      transform: activeTransform,
      boxShadow: activeShadow,
      WebkitTransform: activeTransform,
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
    }
  }

  return {
    touchClickProps,
    isActive,
    isTouchDevice
  }
}

/**
 * Hook for hover effects that only apply on non-touch devices
 *
 * @example
 * const { hoverProps, isHovered } = useTouchHover()
 * return <div {...hoverProps}>Hover me</div>
 */
export function useTouchHover() {
  const [isHovered, setIsHovered] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const hasTouchSupport = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    setIsTouchDevice(hasTouchSupport)
  }, [])

  const handleMouseEnter = useCallback(() => {
    // Only enable hover on non-touch devices
    if (!isTouchDevice) {
      setIsHovered(true)
    }
  }, [isTouchDevice])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  return {
    hoverProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    isHovered: isTouchDevice ? false : isHovered,
    isTouchDevice
  }
}

/**
 * Hook for combined touch, click, and hover handling
 *
 * @example
 * const { interactionProps, isActive, isHovered } = useTouchInteraction({
 *   onPress: handleClick
 * })
 * return <button {...interactionProps}>Interactive</button>
 */
export function useTouchInteraction(options: UseTouchClickOptions) {
  const { touchClickProps, isActive, isTouchDevice } = useTouchClick(options)
  const { hoverProps, isHovered } = useTouchHover()

  return {
    interactionProps: {
      ...touchClickProps,
      ...hoverProps,
    },
    isActive,
    isHovered,
    isTouchDevice
  }
}
