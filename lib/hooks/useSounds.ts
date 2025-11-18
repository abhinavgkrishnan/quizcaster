import useSound from 'use-sound'

export function useSounds() {
  // Correct answer sound
  const [playCorrect] = useSound('/sounds/correct-ans.mp3', {
    volume: 0.5,
    onError: () => {
      // Silently ignore sound errors
    }
  })

  // Wrong answer sound
  const [playWrong] = useSound('/sounds/wrong-ans.mp3', {
    volume: 0.5,
    onError: () => {
      // Silently ignore sound errors
    }
  })

  return {
    playCorrect,
    playWrong
  }
}
