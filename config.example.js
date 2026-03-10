/**
 * カレンダー連携の認証情報設定
 *
 * このファイルはテンプレートです。
 * カレンダー連携を使用する場合は、このファイルを config.js としてコピーし、
 * 各認証情報を設定してください。
 *
 * 設定手順:
 * 1. このファイルを config.js としてコピー
 * 2. Google Calendar: docs/GOOGLE_CALENDAR_SETUP.md を参照
 * 3. Outlook Calendar: README.md の Outlook 同期設定を参照
 */

// ============================================
// Google Calendar API 設定
// ============================================
const GOOGLE_CONFIG = {
  // Google Cloud Console から取得した Client ID
  // 例: 123456789-abcdefghijklmnop.apps.googleusercontent.com
  CLIENT_ID: '',

  // Google Cloud Console から取得した Client Secret
  CLIENT_SECRET: '',

  // リダイレクトURI（本番環境用）
  REDIRECT_URI: 'https://weekly-task.maeda.coffee/google-callback',

  // OAuth 認証エンドポイント
  OAUTH_AUTHORITY: 'https://accounts.google.com/o/oauth2/v2',
};

// ============================================
// Outlook Calendar API 設定 (Azure AD)
// ============================================
const OUTLOOK_CONFIG = {
  // Azure Portal から取得した Client ID
  // 例: 12345678-1234-1234-1234-123456789012
  CLIENT_ID: '',

  // リダイレクトURI（本番環境用）
  REDIRECT_URI: 'https://weekly-task.maeda.coffee/outlook-callback',

  // OAuth 認証エンドポイント
  AUTHORITY: 'https://login.microsoftonline.com/common/oauth2/v2.0',
};

// ============================================
// バリデーション
// ============================================
function validateConfig() {
  const errors = [];

  // Google設定のチェック
  if (!GOOGLE_CONFIG.CLIENT_ID) {
    errors.push('Google Client ID が設定されていません');
  }
  if (!GOOGLE_CONFIG.CLIENT_SECRET) {
    errors.push('Google Client Secret が設定されていません');
  }

  // Outlook設定のチェック
  if (!OUTLOOK_CONFIG.CLIENT_ID) {
    errors.push('Outlook Client ID が設定されていません');
  }

  if (errors.length > 0) {
    console.warn('⚠️ カレンダー連携の設定が不完全です:');
    errors.forEach(error => console.warn('  - ' + error));
    console.warn('設定方法については、各カレンダーの設定ドキュメントを参照してください。');
  }

  return errors.length === 0;
}

// ============================================
// エクスポート
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GOOGLE_CONFIG,
    OUTLOOK_CONFIG,
    validateConfig,
  };
}

// ブラウザ環境の場合はグローバル変数として設定
if (typeof window !== 'undefined') {
  window.CALENDAR_CONFIG = {
    google: GOOGLE_CONFIG,
    outlook: OUTLOOK_CONFIG,
    validateConfig,
  };

  // 起動時にバリデーションを実行
  document.addEventListener('DOMContentLoaded', () => {
    validateConfig();
  });
}
