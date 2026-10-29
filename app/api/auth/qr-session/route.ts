import { NextResponse } from 'next/server';
import { createQrSession, getQrSession } from '@/lib/qr-session-store';

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const role = body?.role === 'stylist' ? 'stylist' : 'owner';
    const session = createQrSession(role);

    // Deep link format for Mobile App scanner
    const qrData = `stylefleet://link?session_id=${session.sessionId}&role=${role}`;

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      pairCode: session.pairCode,
      qrData,
      expiresIn: Math.round((session.expiresAt - session.createdAt) / 1000),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    const session = getQrSession(sessionId);

    if (!session) {
      return NextResponse.json({ success: false, status: 'expired', error: 'Session not found or expired' }, { status: 404 });
    }

    if (session.status === 'authenticated') {
      return NextResponse.json({
        success: true,
        status: 'authenticated',
        shopId: session.shopId,
        role: session.role,
        phone: session.phone,
        shopName: session.shopName,
        authSession: session.sessionPayload,
      });
    }

    return NextResponse.json({
      success: true,
      status: session.status,
      pairCode: session.pairCode,
      expiresIn: Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000)),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
