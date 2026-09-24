import { useRef, useState } from 'react';

// Server-issued payment session tokens are bound to userId + momoNumber and
// live for 10 minutes — mirrors donation-app's/gift-registry's useSessionToken.
const SESSION_TOKEN_TTL_MS = 10 * 60 * 1000;

interface SessionTokenHook {
  sessionToken: string | null;
  isTokenValidFor: (momoNumber: string) => boolean;
  storeSessionToken: (token: string, momoNumber: string) => void;
  clearSessionToken: () => void;
}

export function useSessionToken(): SessionTokenHook {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const issuedAtRef = useRef<number | null>(null);
  const momoNumberRef = useRef<string | null>(null);

  function isTokenValidFor(momoNumber: string): boolean {
    if (!sessionToken || issuedAtRef.current === null) return false;
    if (Date.now() - issuedAtRef.current >= SESSION_TOKEN_TTL_MS) return false;
    return momoNumberRef.current === momoNumber;
  }

  function storeSessionToken(token: string, momoNumber: string) {
    setSessionToken(token);
    issuedAtRef.current = Date.now();
    momoNumberRef.current = momoNumber;
  }

  function clearSessionToken() {
    setSessionToken(null);
    issuedAtRef.current = null;
    momoNumberRef.current = null;
  }

  return { sessionToken, isTokenValidFor, storeSessionToken, clearSessionToken };
}
