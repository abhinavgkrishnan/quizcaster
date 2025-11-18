import useSound from 'use-sound'

export function useSounds() {
  // Correct answer sound
  const [playCorrect] = useSound('/sounds/correct-ans.mp3', {
    volume: 0.5,
    onError: (error: any) => {
      console.error('[Sound] Error playing correct sound:', error)
    }
  })

  // Wrong answer sound
  const [playWrong] = useSound('/sounds/wrong-ans.mp3', {
    volume: 0.5,
    onError: (error: any) => {
      console.error('[Sound] Error playing wrong sound:', error)
    }
  })

  return {
    playCorrect,
    playWrong
  }
}
