(function() {
    'use strict';

    // ===== カレンダー同期機能（PKCE OAuth 方式）=====

    /**
     * PKCE OAuth で Google Calendar に接続
     */
    async function connectGoogleCalendar() {
        var clientIdInput = document.getElementById('google-client-id');
        var clientId = clientIdInput ? clientIdInput.value.trim() : '';

        if (!clientId || clientId === 'your-client-id.apps.googleusercontent.com') {
            showAuthStatus('google', 'error', 'Client ID \u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044');
            return;
        }

        // Client ID を保存
        localStorage.setItem('calendar_client_id_google', clientId);

        // PKCE のコード verifier と challenge を生成
        var codeVerifier = generateCodeVerifier();
        sessionStorage.setItem('google_code_verifier', codeVerifier);

        var codeChallenge = await generateCodeChallenge(codeVerifier);
        var state = generateState();

        // state を保存
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_provider', 'google');

        // OAuth URL を生成して遷移
        var authUrl = generateGoogleOAuthUrl(
            clientId,
            'http://localhost:3000/google-callback',
            codeChallenge,
            state
        );

        window.location.href = authUrl;
    }

    /**
     * PKCE OAuth で Outlook Calendar に接続
     */
    async function connectOutlookCalendar() {
        var clientIdInput = document.getElementById('outlook-client-id');
        var clientId = clientIdInput ? clientIdInput.value.trim() : '';

        if (!clientId || clientId === 'your-client-id' || clientId === 'YOUR_CLIENT_ID') {
            showAuthStatus('outlook', 'error', 'Client ID \u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044');
            return;
        }

        // Client ID を保存
        localStorage.setItem('calendar_client_id_outlook', clientId);

        // PKCE のコード verifier と challenge を生成
        var codeVerifier = generateCodeVerifier();
        sessionStorage.setItem('outlook_code_verifier', codeVerifier);

        var codeChallenge = await generateCodeChallenge(codeVerifier);
        var state = generateState();

        // state を保存
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_provider', 'outlook');

        // OAuth URL を生成して遷移
        var authUrl = generateOutlookOAuthUrl(
            clientId,
            'http://localhost:3000/outlook-callback',
            codeChallenge,
            state
        );

        window.location.href = authUrl;
    }

    /**
     * OAuth コールバックを処理
     */
    async function handleOAuthCallback() {
        var urlParams = new URLSearchParams(window.location.search);
        var code = urlParams.get('code');
        var state = urlParams.get('state');
        var error = urlParams.get('error');

        // エラーチェック
        if (error) {
            console.error('OAuth \u30a8\u30e9\u30fc:', error);
            var provider = sessionStorage.getItem('oauth_provider');
            showAuthStatus(provider, 'error', '\u8a8d\u8a3c\u30a8\u30e9\u30fc: ' + error);
            clearOAuthSessionStorage();
            return;
        }

        // State 検証
        var savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
            console.error('State \u691c\u8a3c\u5931\u6557');
            showAuthStatus('all', 'error', '\u30bb\u30c3\u30b7\u30e7\u30f3\u304c\u7121\u52b9\u3067\u3059\u3002\u3082\u3046\u4e00\u5ea6\u3084\u308a\u76f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
            clearOAuthSessionStorage();
            return;
        }

        var oauthProvider = sessionStorage.getItem('oauth_provider');

        try {
            if (oauthProvider === 'google') {
                await handleGoogleCallback(code);
            } else if (oauthProvider === 'outlook') {
                await handleOutlookCallback(code);
            }
        } catch (err) {
            console.error('\u30b3\u30fc\u30eb\u30d0\u30c3\u30af\u51e6\u7406\u30a8\u30e9\u30fc:', err);
            showAuthStatus(oauthProvider, 'error', '\u30a8\u30e9\u30fc: ' + err.message);
        } finally {
            // URL パラメータをクリア
            window.history.replaceState({}, document.title, window.location.pathname);
            clearOAuthSessionStorage();
        }
    }

    /**
     * Google コールバックを処理 (カレンダー連携パネル削除により無効化)
     */
    async function handleGoogleCallback(code) {
        // カレンダー連携パネルは削除されたため、何もしない
    }

    /**
     * Outlook コールバックを処理 (カレンダー連携パネル削除により無効化)
     */
    async function handleOutlookCallback(code) {
        // カレンダー連携パネルは削除されたため、何もしない
    }

    /**
     * Google Calendar を切断
     */
    function disconnectGoogleCalendar() {
        localStorage.removeItem('calendar_token_google');
        localStorage.removeItem('calendar_client_id_google');

        showAuthStatus('google', 'not-configured', '\u26aa \u672a\u8a2d\u5b9a');

        // ボタンを無効化
        updateCalendarAuthButtons();

        // 同期ボタンを非表示
        var googleSyncBtn = document.getElementById('google-sync-btn');
        if (googleSyncBtn) googleSyncBtn.style.display = 'none';
    }

    /**
     * Outlook Calendar を切断
     */
    function disconnectOutlookCalendar() {
        localStorage.removeItem('calendar_token_outlook');
        localStorage.removeItem('calendar_client_id_outlook');

        showAuthStatus('outlook', 'not-configured', '\u26aa \u672a\u8a2d\u5b9a');

        // ボタンを無効化
        updateCalendarAuthButtons();

        // 同期ボタンを非表示
        var outlookSyncBtn = document.getElementById('outlook-sync-btn');
        if (outlookSyncBtn) outlookSyncBtn.style.display = 'none';
    }

    /**
     * 認証状態を UI に表示 (カレンダー連携パネル削除により無効化)
     */
    function showAuthStatus(provider, type, message) {
        // カレンダー連携パネルは削除されたため、何もしない
    }

    /**
     * カレンダー認証ボタンの状態を更新 (カレンダー連携パネル削除により無効化)
     */
    function updateCalendarAuthButtons() {
        // カレンダー連携パネルは削除されたため、何もしない
    }

    /**
     * LocalStorage からトークンを読み込む
     */
    function loadTokenFromLocalStorage(provider) {
        var key = 'calendar_token_' + provider;
        var data = localStorage.getItem(key);
        if (!data) return null;

        try {
            var tokenData = JSON.parse(data);

            // トークンの有効期限をチェック
            if (Date.now() >= tokenData.expires_at) {
                localStorage.removeItem(key);
                return null;
            }

            return tokenData;
        } catch (error) {
            console.error('\u30c8\u30fc\u30af\u30f3\u8aad\u307f\u8fbc\u307f\u30a8\u30e9\u30fc:', error);
            localStorage.removeItem(key);
            return null;
        }
    }

    /**
     * OAuth セッションストレージをクリア
     */
    function clearOAuthSessionStorage() {
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_provider');
        sessionStorage.removeItem('google_code_verifier');
        sessionStorage.removeItem('outlook_code_verifier');
    }

    /**
     * カレンダー設定パネルを開く
     */
    function openCalendarSettings() {
        var panel = document.getElementById('calendar-settings-panel');
        if (panel) panel.style.display = 'flex';
        updateCalendarAuthButtons();
    }

    /**
     * カレンダー設定パネルを閉じる
     */
    function closeCalendarSettings() {
        var panel = document.getElementById('calendar-settings-panel');
        if (panel) panel.style.display = 'none';
    }

    // ===== PKCE ユーティリティ関数 =====

    /**
     * SHA-256 ハッシュを生成
     */
    async function sha256(plain) {
        var encoder = new TextEncoder();
        var data = encoder.encode(plain);
        var hashBuffer = await crypto.subtle.digest('SHA-256', data);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    /**
     * Base64 URL エンコード
     */
    function base64UrlEncode(str) {
        return str
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    /**
     * PKCE 用の code verifier を生成
     */
    function generateCodeVerifier() {
        var array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return base64UrlEncode(
            Array.from(array, function(byte) { return String.fromCharCode(byte); }).join('')
        );
    }

    /**
     * code verifier から code challenge を生成
     */
    async function generateCodeChallenge(verifier) {
        var hash = await sha256(verifier);
        return base64UrlEncode(hash);
    }

    /**
     * PKCE 認証 URL を生成（Google Calendar 用）
     */
    function generateGoogleOAuthUrl(clientId, redirectUri, codeChallenge, state) {
        var scopes = [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events.readonly'
        ];

        var authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
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
    function generateOutlookOAuthUrl(clientId, redirectUri, codeChallenge, state) {
        var scopes = [
            'Calendars.Read',
            'offline_access'
        ];

        var authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
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
    function generateState() {
        return base64UrlEncode(
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }

    /**
     * PKCE でトークンを取得（Google Calendar 用）
     */
    async function exchangeCodeForTokenGoogle(clientId, redirectUri, code, codeVerifier) {
        var response = await fetch('https://oauth2.googleapis.com/token', {
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
            var errorText = await response.text();
            throw new Error('\u30c8\u30fc\u30af\u30f3\u53d6\u5f97\u5931\u6557: ' + response.statusText + ' - ' + errorText);
        }

        return await response.json();
    }

    /**
     * PKCE でトークンを取得（Outlook Calendar 用）
     */
    async function exchangeCodeForTokenOutlook(clientId, redirectUri, code, codeVerifier) {
        var response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
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
            var errorText = await response.text();
            throw new Error('\u30c8\u30fc\u30af\u30f3\u53d6\u5f97\u5931\u6557: ' + response.statusText + ' - ' + errorText);
        }

        return await response.json();
    }

    /**
     * ページ読み込み時に OAuth コールバックをチェック
     */
    function checkOAuthCallback() {
        var urlParams = new URLSearchParams(window.location.search);
        var code = urlParams.get('code');
        var state = urlParams.get('state');

        if (code && state) {
            // OAuth コールバック処理
            handleOAuthCallback();
        }
    }

    // ===== カレンダー設定ヘルプ =====

    /**
     * 設定方法のヘルプを表示
     */
    function showSettingsHelp() {
        var helpContent = '\ud83d\udccb \u30ab\u30ec\u30f3\u30c0\u30fc\u540c\u671f\u8a2d\u5b9a\u65b9\u6cd5\n\n\ud83d\udd35 Google Calendar \u306e\u8a2d\u5b9a:\n1. Google Cloud Console (https://console.cloud.google.com) \u306b\u30a2\u30af\u30bb\u30b9\n2. \u65b0\u3057\u3044\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u4f5c\u6210\n3. \u300cAPI\u3068\u30b5\u30fc\u30d3\u30b9\u300d\u2192\u300c\u30e9\u30a4\u30d6\u30e9\u30ea\u300d\u3067\u300cGoogle Calendar API\u300d\u3092\u6709\u52b9\u5316\n4. \u300cAPI\u3068\u30b5\u30fc\u30d3\u30b9\u300d\u2192\u300c\u8a8d\u8a3c\u60c5\u5831\u300d\u3067\u300cOAuth 2.0 \u30af\u30e9\u30a4\u30a2\u30f3\u30c8ID\u300d\u3092\u4f5c\u6210\n   - \u30a2\u30d7\u30ea\u30b1\u30fc\u30b7\u30e7\u30f3\u306e\u7a2e\u985e: Web\u30a2\u30d7\u30ea\u30b1\u30fc\u30b7\u30e7\u30f3\n   - \u627f\u8a8d\u6e08\u307f\u306e\u30ea\u30c0\u30a4\u30ec\u30af\u30c8 URI: http://localhost:3000/google-callback\n5. \u4f5c\u6210\u3055\u308c\u305f Client ID \u3092\u30b3\u30d4\u30fc\u3057\u3066\u5165\u529b\u6b04\u306b\u8cbc\u308a\u4ed8\u3051\n\n\ud83d\udcc5 Outlook Calendar \u306e\u8a2d\u5b9a:\n1. Azure Portal (https://portal.azure.com) \u306b\u30a2\u30af\u30bb\u30b9\n2.\u300cAzure Active Directory\u300d\u2192\u300c\u30a2\u30d7\u30ea\u306e\u767b\u9332\u300d\u3067\u300c\u65b0\u898f\u767b\u9332\u300d\n3. \u540d\u524d\u3092\u5165\u529b\u3057\u3001\u30ea\u30c0\u30a4\u30ec\u30af\u30c8 URI \u3092\u8ffd\u52a0:\n   - http://localhost:3000/outlook-callback\n4. \u4f5c\u6210\u3055\u308c\u305f\u300c\u30a2\u30d7\u30ea\u30b1\u30fc\u30b7\u30e7\u30f3 (\u30af\u30e9\u30a4\u30a2\u30f3\u30c8) ID\u300d\u3092\u30b3\u30d4\u30fc\n5. \u300c\u8a8d\u8a3c\u300d\u3067\u300cID \u30c8\u30fc\u30af\u30f3\u300d\u306e\u30c1\u30a7\u30c3\u30af\u3092\u5916\u3057\u3001\u300c\u30a2\u30af\u30bb\u30b9\u30c8\u30fc\u30af\u30f3\u300d\u3092\u4f7f\u7528\u3059\u308b\u3088\u3046\u8a2d\u5b9a\n6. Client ID \u3092\u5165\u529b\u6b04\u306b\u8cbc\u308a\u4ed8\u3051\n\n\u26a0\ufe0f \u6ce8\u610f:\n- Client Secret \u306f\u4e0d\u8981\u3067\u3059\uff08PKCE\u65b9\u5f0f\u3092\u4f7f\u7528\uff09\n- \u30ea\u30c0\u30a4\u30ec\u30af\u30c8 URI \u306f\u6b63\u78ba\u306b\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044';

        alert(helpContent);
    }

    /**
     * Initialize calendar settings panel event listeners.
     */
    function initCalendarSettings() {
        // カレンダー設定ボタン
        var calendarSettingsBtn = document.getElementById('calendar-settings-btn');
        if (calendarSettingsBtn) {
            calendarSettingsBtn.addEventListener('click', openCalendarSettings);
        }

        // Client ID 入力フィールド
        var googleClientIdInput = document.getElementById('google-client-id');
        var outlookClientIdInput = document.getElementById('outlook-client-id');

        // 保存された Client ID を読み込んで表示
        var savedGoogleClientId = localStorage.getItem('calendar_client_id_google');
        var savedOutlookClientId = localStorage.getItem('calendar_client_id_outlook');

        if (googleClientIdInput && savedGoogleClientId) {
            googleClientIdInput.value = savedGoogleClientId;
        }

        if (outlookClientIdInput && savedOutlookClientId) {
            outlookClientIdInput.value = savedOutlookClientId;
        }

        // Google Client ID 入力イベント
        if (googleClientIdInput) {
            googleClientIdInput.addEventListener('input', function() {
                var clientId = googleClientIdInput.value.trim();
                var connectBtn = document.querySelector('.btn-connect-google');

                if (connectBtn) {
                    connectBtn.disabled = !clientId || clientId === 'your-client-id.apps.googleusercontent.com';
                }
            });
        }

        // Outlook Client ID 入力イベント
        if (outlookClientIdInput) {
            outlookClientIdInput.addEventListener('input', function() {
                var clientId = outlookClientIdInput.value.trim();
                var connectBtn = document.querySelector('.btn-connect-outlook');

                if (connectBtn) {
                    connectBtn.disabled = !clientId || clientId === 'YOUR_CLIENT_ID';
                }
            });
        }

        // URL パラメータをチェック（OAuth コールバック）
        checkOAuthCallback();

        // 保存された認証状態を復元
        updateCalendarAuthButtons();

        // 同期ボタンの表示状態を更新
        var googleToken = loadTokenFromLocalStorage('google');
        var outlookToken = loadTokenFromLocalStorage('outlook');

        var googleSyncBtn = document.getElementById('google-sync-btn');
        if (googleSyncBtn && googleToken) {
            googleSyncBtn.style.display = 'inline-block';
        }

        var outlookSyncBtn = document.getElementById('outlook-sync-btn');
        if (outlookSyncBtn && outlookToken) {
            outlookSyncBtn.style.display = 'inline-block';
        }
    }

    // Export via window
    window.CalendarManager = {
        connectGoogleCalendar,
        connectOutlookCalendar,
        handleOAuthCallback,
        disconnectGoogleCalendar,
        disconnectOutlookCalendar,
        showAuthStatus,
        updateCalendarAuthButtons,
        loadTokenFromLocalStorage,
        clearOAuthSessionStorage,
        openCalendarSettings,
        closeCalendarSettings,
        sha256,
        base64UrlEncode,
        generateCodeVerifier,
        generateCodeChallenge,
        generateGoogleOAuthUrl,
        generateOutlookOAuthUrl,
        generateState,
        exchangeCodeForTokenGoogle,
        exchangeCodeForTokenOutlook,
        checkOAuthCallback,
        showSettingsHelp,
        initCalendarSettings
    };

})();
