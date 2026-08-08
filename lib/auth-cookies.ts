// ─────────────────────────────────────────────────────────────
//  Maarkbh · مركبة — Server-side Auth Cookie Helpers
//  Centralizes HttpOnly cookie handling for the BFF auth pattern.
//  Tokens NEVER reach client-side JavaScript: they live only in
//  HttpOnly cookies read by Next.js API routes (route handlers).
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

export const COOKIE_ACCESS_TOKEN = 'mk_access_token';
export const COOKIE_REFRESH_TOKEN = 'mk_refresh_token';
export const COOKIE_ID_TOKEN = 'mk_id_token';

// Refresh tokens from this backend typically live longer than access tokens.
// We don't know the exact backend-side lifetime, so we use a conservative
// 7-day ceiling; the cookie is still invalidated server-side whenever the
// backend rejects the refresh_token grant.
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 3600;

interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    // Secure cookies require HTTPS. Disable only in local (http) dev so
    // testing on http://localhost still works.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };
}

/**
 * Sets the access/refresh/id token cookies on the given response.
 * Call this from any route that receives fresh tokens from the backend
 * (login, refresh).
 */
export function setAuthCookies(res: NextResponse, tokens: TokenSet) {
  const opts = baseCookieOptions();
  const accessMaxAge = tokens.expiresIn && tokens.expiresIn > 0 ? tokens.expiresIn : DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS;

  res.cookies.set(COOKIE_ACCESS_TOKEN, tokens.accessToken, { ...opts, maxAge: accessMaxAge });

  if (tokens.refreshToken) {
    res.cookies.set(COOKIE_REFRESH_TOKEN, tokens.refreshToken, { ...opts, maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS });
  }

  if (tokens.idToken) {
    // id_token is only needed server-side (to decode user claims for /api/auth/me),
    // so it stays HttpOnly as well instead of being exposed to the client.
    res.cookies.set(COOKIE_ID_TOKEN, tokens.idToken, { ...opts, maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS });
  }
}

/**
 * Clears all auth cookies on the given response. Call this on logout,
 * or whenever a refresh attempt fails (session considered dead).
 */
export function clearAuthCookies(res: NextResponse) {
  const opts = { ...baseCookieOptions(), maxAge: 0 };
  res.cookies.set(COOKIE_ACCESS_TOKEN, '', opts);
  res.cookies.set(COOKIE_REFRESH_TOKEN, '', opts);
  res.cookies.set(COOKIE_ID_TOKEN, '', opts);
}

/**
 * Reads the access token from the incoming request's cookies.
 * Use this in every proxy route instead of `request.headers.get('Authorization')`.
 *
 * Example:
 *   const token = getAccessTokenFromRequest(request);
 *   headers: { Authorization: token ? `Bearer ${token}` : '' }
 */
export function getAccessTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_ACCESS_TOKEN)?.value || null;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_REFRESH_TOKEN)?.value || null;
}

export function getIdTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_ID_TOKEN)?.value || null;
}

/**
 * Decodes a JWT payload without verifying the signature. Verification is
 * unnecessary here because the token was issued and freshly validated by
 * our own backend seconds earlier (same trust boundary) — this is purely
 * to extract display claims (name, email, exp...) for the UI.
 */
export function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}
