import { NextResponse } from 'next/server';

const API_KEY = process.env.TWO_FACTOR_API_KEY || 'e11be203-4f77-11f1-9800-0200cd936042';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = body?.sessionId;
    const otp = body?.otp;

    if (!sessionId || !otp) {
      return NextResponse.json(
        { success: false, error: 'Session ID and OTP code are required' },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();

    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${cleanOtp}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.Status === 'Success' && data.Details === 'OTP Matched') {
      return NextResponse.json({
        success: true,
        matched: true,
        message: 'OTP verified successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          matched: false,
          error: data.Details || 'Invalid OTP. Please check and try again.',
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error verifying OTP';
    console.error('[2Factor Verify Exception]:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
