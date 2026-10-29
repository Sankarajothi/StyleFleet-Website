export interface QrAuthSession {
  sessionId: string;
  pairCode: string;
  status: 'pending' | 'authenticated' | 'expired';
  role: 'owner' | 'stylist';
  shopId?: string;
  shopName?: string;
  phone?: string;
  ownerName?: string;
  staffId?: string;
  staffName?: string;
  sessionPayload?: any;
  createdAt: number;
  expiresAt: number;
}

// Persist in globalThis across Next.js API reloads
const globalStore = globalThis as unknown as {
  __sf_qr_sessions__?: Map<string, QrAuthSession>;
  __sf_qr_codes__?: Map<string, string>;
};

if (!globalStore.__sf_qr_sessions__) {
  globalStore.__sf_qr_sessions__ = new Map();
}
if (!globalStore.__sf_qr_codes__) {
  globalStore.__sf_qr_codes__ = new Map();
}

export const qrSessions = globalStore.__sf_qr_sessions__;
export const qrCodes = globalStore.__sf_qr_codes__;

export function purgeExpiredSessions() {
  const now = Date.now();
  qrSessions.forEach((sess, id) => {
    if (sess.expiresAt < now) {
      qrCodes.delete(sess.pairCode);
      qrSessions.delete(id);
    }
  });
}

export function createQrSession(role: 'owner' | 'stylist' = 'owner'): QrAuthSession {
  purgeExpiredSessions();

  // Generate unique session ID
  const sessionId = 'sf_qr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  
  // Generate random 6-digit PIN code (e.g., 492815)
  const pairCode = String(Math.floor(100000 + Math.random() * 900000));

  const now = Date.now();
  const session: QrAuthSession = {
    sessionId,
    pairCode,
    status: 'pending',
    role,
    createdAt: now,
    expiresAt: now + 3 * 60 * 1000, // 3 minutes validity
  };

  qrSessions.set(sessionId, session);
  qrCodes.set(pairCode, sessionId);

  return session;
}

export function getQrSession(sessionId: string): QrAuthSession | null {
  purgeExpiredSessions();
  const session = qrSessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    session.status = 'expired';
  }
  return session;
}

export function findSessionByCode(code: string): QrAuthSession | null {
  purgeExpiredSessions();
  const cleanCode = code.replace(/\D/g, '').trim();
  const sessionId = qrCodes.get(cleanCode);
  if (!sessionId) return null;
  return getQrSession(sessionId);
}

export function authorizeQrSession(
  targetIdOrCode: string,
  authData: {
    shopId: string;
    role?: 'owner' | 'stylist';
    phone: string;
    shopName?: string;
    ownerName?: string;
    staffId?: string;
    staffName?: string;
    sessionPayload?: any;
  }
): { success: boolean; session?: QrAuthSession; error?: string } {
  purgeExpiredSessions();

  let session = qrSessions.get(targetIdOrCode);
  if (!session) {
    session = findSessionByCode(targetIdOrCode) || undefined;
  }

  if (!session) {
    return { success: false, error: 'Session expired or not found. Please refresh QR code.' };
  }

  if (session.expiresAt < Date.now()) {
    session.status = 'expired';
    return { success: false, error: 'QR Code has expired. Please refresh the screen.' };
  }

  session.status = 'authenticated';
  session.shopId = authData.shopId;
  session.role = authData.role || session.role || 'owner';
  session.phone = authData.phone;
  session.shopName = authData.shopName || 'StyleFleet Salon';
  session.ownerName = authData.ownerName;
  session.staffId = authData.staffId;
  session.staffName = authData.staffName;
  session.sessionPayload = authData.sessionPayload || {
    isLoggedIn: true,
    role: session.role,
    phone: authData.phone,
    shopId: authData.shopId,
    shopName: authData.shopName || 'StyleFleet Salon',
    staffId: authData.staffId,
    staffName: authData.staffName,
    stylistName: authData.staffName || authData.ownerName || 'User',
    loginTime: new Date().toISOString(),
  };

  qrSessions.set(session.sessionId, session);

  return { success: true, session };
}
