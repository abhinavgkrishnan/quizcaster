/**
 * GameScreen - Socket.IO Version
 * Clean, simple component that just renders server state
 * ALL game logic handled by server via Socket.IO
 */

"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { Swords, Zap } from "lucide-react"
import GameQuestion from "./game-question"
import GameOver from "./game-over"
import PlayerHeader from "./player-header"
import ScoreBars from "./score-bars"
import { useSocketGame } from "@/lib/hooks/useSocketGame"
import { GAME_CONFIG } from "@/lib/constants"
import type { PlayerData } from "@/lib/types"

interface GameScreenProps {
  topic: string
  matchId: string
  myPlayer: PlayerData
  opponent: PlayerData
  onGameEnd: () => void
  onPlayAgain: () => void
  onRematchReady: (newMatchId: string) => void
}

export default function GameScreen({ topic, matchId, myPlayer, opponent, onGameEnd, onPlayAgain, onRematchReady }: GameScreenProps) {
  // Single hook manages everything
  const game = useSocketGame(matchId, myPlayer, opponent, topic);
  const [show2xBadge, setShow2xBadge] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  // Handle rematch ready - start new match with new matchId
  useEffect(() => {
    if (game.rematchReady) {
      onRematchReady(game.rematchReady);
    }
  }, [game.rematchReady, onRematchReady]);

  // Show confetti on correct answer
  useEffect(() => {
    if (game.lastAnswerResult?.isCorrect && game.lastAnswerResult.fid === myPlayer.fid) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#CFB8FF', '#FEFFDD', '#000000']
      });
    }
  }, [game.lastAnswerResult, myPlayer.fid]);

  // Show 2X badge for final question
  useEffect(() => {
    if (game.isFinalQuestion && game.currentQuestion) {
      setShow2xBadge(true);
    }
  }, [game.isFinalQuestion, game.currentQuestion]);

  // Handle answer submission
  const handleAnswer = (answer: string, timeTaken: number) => {
    game.submitAnswer(answer);
  };

  // Connecting state
  if (game.phase === 'connecting' || !game.isConnected) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full brutal-violet brutal-border flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="w-3 h-3 rounded-full bg-foreground" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
            Connecting to game...
          </p>
        </div>
      </div>
    );
  }

  // Waiting for opponent
  if (game.isWaitingForOpponent) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 rounded-full brutal-violet brutal-border flex items-center justify-center mx-auto mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <Swords className="w-16 h-16 text-foreground" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
            Waiting for opponent...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (game.error) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-muted">
        <div className="text-center px-6">
          <p className="text-foreground font-bold text-lg mb-4">Error</p>
          <p className="text-sm text-muted-foreground mb-4">{game.error}</p>
          <button
            onClick={onGameEnd}
            className="brutal-violet brutal-border px-6 py-3 rounded-2xl font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  // Game complete
  if (game.isComplete) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-muted">
        <GameOver
          playerScore={game.myScore}
          opponentScore={game.opponentScore}
          playerAnswers={game.myAnswers}
          opponent={opponent}
          opponentRequestedRematch={game.opponentRequestedRematch}
          forfeitedBy={game.forfeitedBy}
          myFid={myPlayer.fid}
          onPlayAgain={onPlayAgain}
          onGoHome={onGameEnd}
          onChallenge={game.requestRematch}
        />
      </div>
    );
  }

  // No current question yet
  if (!game.currentQuestion) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
            Loading question...
          </p>
        </div>
      </div>
    );
  }

  // Main game UI
  const wasMyLastAnswer = game.lastAnswerResult?.fid === myPlayer.fid;
  const wasCorrect = wasMyLastAnswer ? game.lastAnswerResult?.isCorrect : null;

  return (
    <div className="relative w-full h-screen bg-muted overflow-hidden">
      {/* Forfeit Modal */}
      {showForfeitModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center px-[5%]" onClick={() => setShowForfeitModal(false)}>
          <div className="brutal-white brutal-border rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-foreground mb-2 uppercase tracking-tight text-center">
              Forfeit Match?
            </h3>
            <p className="text-xs text-muted-foreground mb-6 text-center uppercase tracking-wide">
              You will lose this match
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowForfeitModal(false);
                  game.forfeitGame();
                }}
                className="flex-1 py-3 rounded-2xl brutal-violet brutal-border font-bold text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all text-foreground uppercase tracking-wide"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                }}
              >
                Yes, Forfeit
              </button>
              <button
                onClick={() => setShowForfeitModal(false)}
                className="flex-1 py-3 rounded-2xl brutal-beige brutal-border font-bold text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all text-foreground uppercase tracking-wide"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                }}
              >
                No, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto px-[4%] py-[3%] h-full flex flex-col">
        {/* Score bars */}
        <ScoreBars playerScore={game.myScore} opponentScore={game.opponentScore} />

        {/* Player header */}
        <div className="relative z-10 mb-2 flex-shrink-0">
        <PlayerHeader
          playerName={myPlayer.displayName || myPlayer.username}
          playerScore={game.myScore}
          playerLevel="Novice"
          playerAvatar={myPlayer.pfpUrl || ""}
          opponentName={opponent.displayName || opponent.username}
          opponentScore={game.opponentScore}
          opponentLevel={game.opponentOnline ? "🟢 Online" : "🔴 Offline"}
          opponentAvatar={opponent.pfpUrl || ""}
          timer={Math.ceil(game.timeRemaining)}
          onMenuClick={() => setShowForfeitModal(true)}
        />
      </div>

      {/* Question Counter with 2X Badge */}
      <div className="relative z-10 text-center mb-1.5 flex-shrink-0">
        <div className="flex items-center justify-center gap-2">
          <motion.div
            key={game.questionNumber}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block brutal-white brutal-border px-4 py-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
              Question {game.questionNumber} of {game.totalQuestions}
            </p>
          </motion.div>

          {/* 2X Badge for Final Question */}
          <AnimatePresence>
            {show2xBadge && (
              <motion.div
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  duration: 0.6
                }}
                className="inline-block brutal-violet brutal-border px-3 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-foreground fill-foreground" />
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                    2X POINTS
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

        {/* Question Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={game.questionNumber}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            className="relative z-10 flex-1 flex flex-col justify-center pb-[2%] overflow-visible px-[2%]"
          >
            <GameQuestion
              question={game.currentQuestion}
              onAnswer={handleAnswer}
              isDisabled={game.isAnswered}
              showResult={game.isAnswered}
              wasCorrect={wasCorrect ?? null}
              correctAnswer={game.correctAnswer}
              timeRemaining={game.timeRemaining}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
