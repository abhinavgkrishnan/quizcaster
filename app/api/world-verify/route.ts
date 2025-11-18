import { NextRequest, NextResponse } from 'next/server'
import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal?: string
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload

    const app_id = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`

    if (!app_id) {
      return NextResponse.json(
        { success: false, error: 'World App ID not configured' },
        { status: 500 }
      )
    }

    // Verify the proof with the Developer Portal
    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal
    )) as IVerifyResponse

    if (verifyRes.success) {
      // This is where you should perform backend actions if the verification succeeds
      // Such as, marking a user as "verified" in the database
      // You can also store the nullifier hash to prevent duplicate verifications

      // Example: Store verification in database
      // await supabase.from('world_verifications').insert({
      //   nullifier_hash: payload.nullifier_hash,
      //   action,
      //   verified_at: new Date().toISOString()
      // })

      return NextResponse.json({
        success: true,
        verifyRes,
        status: 200
      })
    } else {
      // This is where you should handle errors from the World ID /verify endpoint.
      // Usually these errors are due to a user having already verified.
      return NextResponse.json({
        success: false,
        error: verifyRes.detail || 'Verification failed',
        verifyRes,
        status: 400
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('World ID verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
