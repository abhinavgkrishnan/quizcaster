"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useWorld } from "@/lib/world-sdk"

interface WorldIDVerifyProps {
  action?: string
  onSuccess?: () => void
  onError?: (error: any) => void
}

export default function WorldIDVerify({
  action = "play_quiz",
  onSuccess,
  onError
}: WorldIDVerifyProps) {
  const { verifyWorldID, isWorldApp } = useWorld()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  if (!isWorldApp) {
    return null
  }

  const handleVerify = async () => {
    try {
      setIsVerifying(true)
      setVerificationStatus('idle')
      setErrorMessage('')

      const result = await verifyWorldID(action)

      if (result && result.success) {
        setVerificationStatus('success')
        onSuccess?.()
      } else {
        setVerificationStatus('error')
        setErrorMessage(result?.error || 'Verification failed')
        onError?.(result)
      }
    } catch (error: any) {
      setVerificationStatus('error')
      setErrorMessage(error?.message || 'Verification failed')
      onError?.(error)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="w-full">
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ y: 2 }}
        onClick={handleVerify}
        disabled={isVerifying || verificationStatus === 'success'}
        className={`w-full py-4 rounded-2xl brutal-border font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all uppercase tracking-wide flex items-center justify-center gap-2 ${
          verificationStatus === 'success'
            ? 'brutal-green text-foreground'
            : verificationStatus === 'error'
            ? 'brutal-red text-foreground'
            : 'brutal-violet text-foreground'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying...
          </>
        ) : verificationStatus === 'success' ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Verified Human
          </>
        ) : verificationStatus === 'error' ? (
          <>
            <XCircle className="w-5 h-5" />
            Verification Failed
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Verify with World ID
          </>
        )}
      </motion.button>

      {errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-red-500 text-center"
        >
          {errorMessage}
        </motion.p>
      )}

      {verificationStatus === 'idle' && !isVerifying && (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Prove you're a unique human to prevent bots
        </p>
      )}
    </div>
  )
}
