/**
 * PKCE OAuth 2.0 Helper Utility
 * Proof Key for Code Exchange (RFC 7636)
 *
 * Client Secret を使用せず、安全にOAuth認証を行うためのユーティリティ
 * Google Calendar と Outlook Calendar で使用
 */

/**
 * SHA-256 ハッシュを生成
 */
export async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Base64 URL エンコード
 */
function base64UrlEncode(str: string): string {
  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * PKCE 用の code verifier を生成
 * ランダムな43〜128文字の文字列 using [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(
    Array.from(array, byte => String.fromCharCode(byte)).join('')
  );
}

/**
 * code verifier から code challenge を生成
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier);
  return base64UrlEncode(hash);
}

/**
 * PKCE 認証 URL を生成（Google Calendar 用）
 */
export function generateGoogleOAuthUrl(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string
): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
  ];

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  return authUrl.toString();
}

/**
 * PKCE 認証 URL を生成（Outlook Calendar 用）
 */
export function generateOutlookOAuthUrl(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string
): string {
  const scopes = [
    'Calendars.Read',
    'offline_access'
  ];

  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('response_mode', 'query');

  return authUrl.toString();
}

/**
 * ランダムな state パラメータを生成
 */
export function generateState(): string {
  return base64UrlEncode(
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * PKCE でトークンを取得（Google Calendar 用）
 */
export async function exchangeCodeForTokenGoogle(
  clientId: string,
  redirectUri: string,
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      code: code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`トークン取得失敗: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * PKCE でトークンを取得（Outlook Calendar 用）
 */
export async function exchangeCodeForTokenOutlook(
  clientId: string,
  redirectUri: string,
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      code: code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`トークン取得失敗: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * アクセストークンをリフレッシュ（Google）
 */
export async function refreshAccessTokenGoogle(
  clientId: string,
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('トークンリフレッシュ失敗');
  }

  return await response.json();
}

/**
 * アクセストークンをリフレッシュ（Outlook）
 */
export async function refreshAccessTokenOutlook(
  clientId: string,
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('トークンリフレッシュ失敗');
  }

  return await response.json();
}

/**
 * LocalStorage にトークンを保存
 */
export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  provider: 'google' | 'outlook';
}

export function saveTokenToLocalStorage(provider: 'google' | 'outlook', tokenData: TokenData): void {
  const key = `calendar_token_${provider}`;
  localStorage.setItem(key, JSON.stringify(tokenData));
}

/**
 * LocalStorage からトークンを読み込み
 */
export function loadTokenFromLocalStorage(provider: 'google' | 'outlook'): TokenData | null {
  const key = `calendar_token_${provider}`;
  const data = localStorage.getItem(key);
  if (!data) return null;

  try {
    const tokenData = JSON.parse(data) as TokenData;

    // トークンの有効期限をチェック
    if (Date.now() >= tokenData.expires_at) {
      // トークンが期限切れ
      localStorage.removeItem(key);
      return null;
    }

    return tokenData;
  } catch (error) {
    console.error('トークン読み込みエラー:', error);
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * LocalStorage からトークンを削除
 */
export function removeTokenFromLocalStorage(provider: 'google' | 'outlook'): void {
  const key = `calendar_token_${provider}`;
  localStorage.removeItem(key);
}

/**
 * Client ID を LocalStorage に保存
 */
export function saveClientId(provider: 'google' | 'outlook', clientId: string): void {
  const key = `calendar_client_id_${provider}`;
  localStorage.setItem(key, clientId);
}

/**
 * LocalStorage から Client ID を読み込み
 */
export function loadClientId(provider: 'google' | 'outlook'): string | null {
  const key = `calendar_client_id_${provider}`;
  return localStorage.getItem(key);
}

/**
 * Client ID を削除
 */
export function removeClientId(provider: 'google' | 'outlook'): void {
  const key = `calendar_client_id_${provider}`;
  localStorage.removeItem(key);
}
