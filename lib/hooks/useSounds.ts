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

  // 2X points sound (final question)
  const [play2X] = useSound('/sounds/2X.mp3', {
    volume: 0.5,
    onError: (error: any) => {
      console.error('[Sound] Error playing 2X sound:', error)
    }
  })

  // Game start sound
  const [playGameStart] = useSound('/sounds/Game-start.mp3', {
    volume: 0.5,
    onError: (error: any) => {
      console.error('[Sound] Error playing game start sound:', error)
    }
  })

  // Victory sound
  const [playVictory] = useSound('/sounds/Victory.mp3', {
    volume: 0.5,
    onError: (error: any) => {
      console.error('[Sound] Error playing victory sound:', error)
    }
  })

  // Defeat sound
  const [playDefeat] = useSound('/sounds/Defeat.mp3', {
    volume: 0.5,
    onError: (error: any) => {
      console.error('[Sound] Error playing defeat sound:', error)
    }
  })

  // Draw sound
  const [playDraw] = useSound('/sounds/Draw.mp3', {
    volume: 0.5,
    onError: (error: any) => {
      console.error('[Sound] Error playing draw sound:', error)
    }
  })

  return {
    playCorrect,
    playWrong,
    play2X,
    playGameStart,
    playVictory,
    playDefeat,
    playDraw
  }
}
