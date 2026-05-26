import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateGoogleOAuthUrl,
  generateOutlookOAuthUrl,
  generateState,
  loadTokenFromLocalStorage,
} from '../utils/pkceOAuth';

type CalendarProvider = 'google' | 'outlook';

function getClientId(elementId: string): string {
  const input = document.getElementById(elementId) as HTMLInputElement | null;
  return input ? input.value.trim() : '';
}

function isInvalidGoogleClientId(clientId: string): boolean {
  return !clientId || clientId === 'your-client-id.apps.googleusercontent.com';
}

function isInvalidOutlookClientId(clientId: string): boolean {
  return !clientId || clientId === 'your-client-id' || clientId === 'YOUR_CLIENT_ID';
}

export async function connectGoogleCalendar(): Promise<void> {
  const clientId = getClientId('google-client-id');

  if (isInvalidGoogleClientId(clientId)) {
    showAuthStatus('google', 'error', 'Client ID を入力してください');
    return;
  }

  localStorage.setItem('calendar_client_id_google', clientId);

  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem('google_code_verifier', codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_provider', 'google');

  const authUrl = generateGoogleOAuthUrl(
    clientId,
    'http://localhost:3000/google-callback',
    codeChallenge,
    state
  );

  window.location.href = authUrl;
}

export async function connectOutlookCalendar(): Promise<void> {
  const clientId = getClientId('outlook-client-id');

  if (isInvalidOutlookClientId(clientId)) {
    showAuthStatus('outlook', 'error', 'Client ID を入力してください');
    return;
  }

  localStorage.setItem('calendar_client_id_outlook', clientId);

  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem('outlook_code_verifier', codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_provider', 'outlook');

  const authUrl = generateOutlookOAuthUrl(
    clientId,
    'http://localhost:3000/outlook-callback',
    codeChallenge,
    state
  );

  window.location.href = authUrl;
}

async function handleGoogleCallback(_code: string): Promise<void> {
}

async function handleOutlookCallback(_code: string): Promise<void> {
}

function clearOAuthSessionStorage(): void {
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_provider');
  sessionStorage.removeItem('google_code_verifier');
  sessionStorage.removeItem('outlook_code_verifier');
}

export async function handleOAuthCallback(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  if (error) {
    console.error('OAuth エラー:', error);
    const provider = sessionStorage.getItem('oauth_provider') as CalendarProvider | null;
    showAuthStatus(provider ?? 'all', 'error', `認証エラー: ${error}`);
    clearOAuthSessionStorage();
    return;
  }

  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    console.error('State 検証失敗');
    showAuthStatus('all', 'error', 'セッションが無効です。もう一度やり直してください。');
    clearOAuthSessionStorage();
    return;
  }

  const oauthProvider = sessionStorage.getItem('oauth_provider');

  try {
    if (oauthProvider === 'google' && code) {
      await handleGoogleCallback(code);
    } else if (oauthProvider === 'outlook' && code) {
      await handleOutlookCallback(code);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('コールバック処理エラー:', err);
    showAuthStatus(
      oauthProvider as CalendarProvider | null,
      'error',
      `エラー: ${message}`
    );
  } finally {
    window.history.replaceState({}, document.title, window.location.pathname);
    clearOAuthSessionStorage();
  }
}

export function disconnectGoogleCalendar(): void {
  localStorage.removeItem('calendar_token_google');
  localStorage.removeItem('calendar_client_id_google');
  showAuthStatus('google', 'not-configured', '⚪ 未設定');
  updateCalendarAuthButtons();

  const googleSyncBtn = document.getElementById('google-sync-btn');
  if (googleSyncBtn) googleSyncBtn.style.display = 'none';
}

export function disconnectOutlookCalendar(): void {
  localStorage.removeItem('calendar_token_outlook');
  localStorage.removeItem('calendar_client_id_outlook');
  showAuthStatus('outlook', 'not-configured', '⚪ 未設定');
  updateCalendarAuthButtons();

  const outlookSyncBtn = document.getElementById('outlook-sync-btn');
  if (outlookSyncBtn) outlookSyncBtn.style.display = 'none';
}

export function showAuthStatus(
  _provider: CalendarProvider | 'all' | null,
  _type: string,
  _message: string
): void {
}

export function updateCalendarAuthButtons(): void {
}

export function openCalendarSettings(): void {
  const panel = document.getElementById('calendar-settings-panel');
  if (panel) panel.style.display = 'flex';
  updateCalendarAuthButtons();
}

export function closeCalendarSettings(): void {
  const panel = document.getElementById('calendar-settings-panel');
  if (panel) panel.style.display = 'none';
}

function checkOAuthCallback(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  if (code && state) {
    handleOAuthCallback();
  }
}

export function showSettingsHelp(): void {
  const helpContent =
    '📋 カレンダー同期設定方法\n\n' +
    '🔵 Google Calendar の設定:\n' +
    '1. Google Cloud Console (https://console.cloud.google.com) にアクセス\n' +
    '2. 新しいプロジェクトを作成\n' +
    '3. 「APIとサービス」→「ライブラリ」で「Google Calendar API」を有効化\n' +
    '4. 「APIとサービス」→「認証情報」で「OAuth 2.0 クライアントID」を作成\n' +
    '   - アプリケーションの種類: Webアプリケーション\n' +
    '   - 承認済みのリダイレクト URI: http://localhost:3000/google-callback\n' +
    '5. 作成された Client ID をコピーして入力欄に貼り付け\n\n' +
    '📅 Outlook Calendar の設定:\n' +
    '1. Azure Portal (https://portal.azure.com) にアクセス\n' +
    '2.「Azure Active Directory」→「アプリの登録」で「新規登録」\n' +
    '3. 名前を入力し、リダイレクト URI を追加:\n' +
    '   - http://localhost:3000/outlook-callback\n' +
    '4. 作成された「アプリケーション (クライアント) ID」をコピー\n' +
    '5. 「認証」で「ID トークン」のチェックを外し、「アクセストークン」を使用するように設定\n' +
    '6. Client ID を入力欄に貼り付け\n\n' +
    '⚠️ 注意:\n' +
    '- Client Secret は不要です（PKCE方式を使用）\n' +
    '- リダイレクト URI は正確に入力してください';

  alert(helpContent);
}

function setupGoogleClientIdInput(): void {
  const googleClientIdInput = document.getElementById('google-client-id') as HTMLInputElement | null;
  const savedGoogleClientId = localStorage.getItem('calendar_client_id_google');
  if (googleClientIdInput && savedGoogleClientId) {
    googleClientIdInput.value = savedGoogleClientId;
  }

  if (googleClientIdInput) {
    googleClientIdInput.addEventListener('input', () => {
      const clientId = googleClientIdInput.value.trim();
      const connectBtn = document.querySelector('.btn-connect-google') as HTMLButtonElement | null;
      if (connectBtn) {
        connectBtn.disabled = isInvalidGoogleClientId(clientId);
      }
    });
  }
}

function setupOutlookClientIdInput(): void {
  const outlookClientIdInput = document.getElementById('outlook-client-id') as HTMLInputElement | null;
  const savedOutlookClientId = localStorage.getItem('calendar_client_id_outlook');
  if (outlookClientIdInput && savedOutlookClientId) {
    outlookClientIdInput.value = savedOutlookClientId;
  }

  if (outlookClientIdInput) {
    outlookClientIdInput.addEventListener('input', () => {
      const clientId = outlookClientIdInput.value.trim();
      const connectBtn = document.querySelector('.btn-connect-outlook') as HTMLButtonElement | null;
      if (connectBtn) {
        connectBtn.disabled = isInvalidOutlookClientId(clientId);
      }
    });
  }
}

function restoreSyncButtonVisibility(): void {
  const googleToken = loadTokenFromLocalStorage('google');
  const outlookToken = loadTokenFromLocalStorage('outlook');

  const googleSyncBtn = document.getElementById('google-sync-btn');
  if (googleSyncBtn && googleToken) {
    googleSyncBtn.style.display = 'inline-block';
  }

  const outlookSyncBtn = document.getElementById('outlook-sync-btn');
  if (outlookSyncBtn && outlookToken) {
    outlookSyncBtn.style.display = 'inline-block';
  }
}

export function initCalendarSettings(): void {
  const calendarSettingsBtn = document.getElementById('calendar-settings-btn');
  if (calendarSettingsBtn) {
    calendarSettingsBtn.addEventListener('click', openCalendarSettings);
  }

  setupGoogleClientIdInput();
  setupOutlookClientIdInput();
  checkOAuthCallback();
  updateCalendarAuthButtons();
  restoreSyncButtonVisibility();
}
