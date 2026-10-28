import { NextResponse } from 'next/server';

const API_KEY = process.env.TWO_FACTOR_API_KEY || 'e11be203-4f77-11f1-9800-0200cd936042';
const TEMPLATE_NAME = process.env.TWO_FACTOR_TEMPLATE_NAME || 'Login_Verification_OTP';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = body?.phone;
    const cleanPhone = String(phone || '').replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian mobile number' },
        { status: 400 }
      );
    }

    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/+91${cleanPhone}/AUTOGEN/${TEMPLATE_NAME}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.Status === 'Success') {
      return NextResponse.json({
        success: true,
        sessionId: data.Details,
        message: 'OTP sent successfully to +91 ' + cleanPhone,
      });
    } else {
      console.error('[2Factor Send OTP Error]:', data);
      return NextResponse.json(
        { success: false, error: data.Details || 'Failed to send OTP via SMS gateway' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error sending OTP';
    console.error('[2Factor Send Exception]:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
