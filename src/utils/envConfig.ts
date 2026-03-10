/**
 * 環境変数設定ユーティリティ
 *
 * 注意: このファイルはブラウザ環境で実行されるため、
 * Node.js の process.env は使用できません。
 *
 * 開発環境では以下のいずれかの方法で設定してください：
 *
 * 方法1: .env ファイルを作成し、ビルド時に環境変数を埋め込む
 * 方法2: 以下の defaultConfig を直接編集する（推奨: ローカル開発のみ）
 * 方法3: HTML からグローバル変数として注入する
 */

// デフォルト設定（開発用）
// 本番環境ではビルドプロセスで上書きされます
const defaultConfig = {
  // Google Calendar API
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-callback',
  },

  // Outlook Calendar API (Azure AD)
  outlook: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID',
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://localhost:3000/outlook-callback',
    authority: import.meta.env.VITE_AZURE_AUTHORITY || 'https://login.microsoftonline.com/common/oauth2/v2.0',
  },

  // 開発サーバー
  server: {
    port: parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '3000', 10),
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  },
};

/**
 * 環境変数を取得するヘルパー関数
 */
export function getEnv(key: string): string | undefined {
  // Vite 環境変数（VITE_プレフィックス付き）
  const viteKey = `VITE_${key}`;
  if (import.meta.env && viteKey in import.meta.env) {
    return import.meta.env[viteKey];
  }

  // グローバル変数（HTMLから注入された場合）
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__[key];
  }

  return undefined;
}

/**
 * Google Calendar 認証情報を取得
 */
export function getGoogleConfig() {
  return {
    clientId: getEnv('GOOGLE_CLIENT_ID') || defaultConfig.google.clientId,
    clientSecret: getEnv('GOOGLE_CLIENT_SECRET') || defaultConfig.google.clientSecret,
    redirectUri: getEnv('GOOGLE_REDIRECT_URI') || defaultConfig.google.redirectUri,
  };
}

/**
 * Outlook Calendar 認証情報を取得
 */
export function getOutlookConfig() {
  return {
    clientId: getEnv('AZURE_CLIENT_ID') || defaultConfig.outlook.clientId,
    redirectUri: getEnv('AZURE_REDIRECT_URI') || defaultConfig.outlook.redirectUri,
    authority: getEnv('AZURE_AUTHORITY') || defaultConfig.outlook.authority,
  };
}

/**
 * 設定が有効かチェックする
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const googleConfig = getGoogleConfig();
  if (!googleConfig.clientId || googleConfig.clientId === 'your-client-id.apps.googleusercontent.com') {
    errors.push('Google Client ID が設定されていません');
  }
  if (!googleConfig.clientSecret || googleConfig.clientSecret === 'your-client-secret') {
    errors.push('Google Client Secret が設定されていません');
  }

  const outlookConfig = getOutlookConfig();
  if (!outlookConfig.clientId || outlookConfig.clientId === 'YOUR_CLIENT_ID') {
    errors.push('Outlook Client ID が設定されていません');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default defaultConfig;
