# Google Calendar Integration Setup Guide

This guide walks you through setting up Google Calendar integration for the Weekly Task Board application.

## Prerequisites

- A Google Account with access to [Google Cloud Console](https://console.cloud.google.com/)
- Administrator privileges (if setting up for an organization)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Weekly Task Board")
5. Click **"Create"**
6. Wait for the project to be created (may take a minute)

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, navigate to **"APIs & Services"** > **"Library"**
2. Search for **"Google Calendar API"**
3. Click on it and press **"Enable"**
4. Wait for the API to be enabled

## Step 3: Configure OAuth Consent Screen

1. Navigate to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"** user type (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: Weekly Task Board
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **"Save and Continue"**
5. Skip the "Scopes" step (we'll configure scopes later)
6. Skip the "Test users" step for now
7. Click **"Back to Dashboard"**

## Step 4: Create OAuth 2.0 Credentials

1. Navigate to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Select **"Web application"** as the application type
4. Configure the following:

   **Name**: Weekly Task Board Client

   **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```

   **Authorized redirect URIs**:
   ```
   http://localhost:3000/google-callback
   ```

5. Click **"Create"**
6. Copy the **Client ID** and **Client Secret** (you'll need them later)

## Step 5: Configure Environment Variables

Create a `.env` file in your project root (or `.env.example` as a template):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/google-callback
```

Replace the placeholder values with your actual credentials.

## Step 6: Update Application Configuration

In your application code, update the Google Connector initialization with your credentials:

```typescript
const googleConnector = new GoogleConnectorImpl(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
```

## Step 7: Enable the Google Sync UI

In `index.html`, uncomment the Google sync panel section:

```html
<!-- Find and uncomment this section -->
<div id="google-sync-panel" class="google-sync-panel">
    <!-- Google sync panel content -->
</div>
```

Also uncomment the Google sync button in the header:

```html
<button id="google-sync-btn" title="Google Calendar同期">📆</button>
```

## Step 8: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser
3. Click the **📆 Google Calendar** button
4. Click **"🔗 Google Calendar に接続"**
5. You'll be redirected to Google's OAuth consent screen
6. Sign in and grant permissions
7. After authorization, you should be connected

## Troubleshooting

### "redirect_uri_mismatch" Error

If you see this error:
- Verify the redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/google-callback`
- Make sure there are no trailing slashes
- Check that your application is running on the correct port (3000)

### "access_denied" Error

- Make sure the OAuth consent screen is properly configured
- Try adding your email as a test user in the OAuth consent screen

### API Not Enabled Error

- Verify that the Google Calendar API is enabled in the API Library
- Wait a few minutes after enabling the API (it may take time to propagate)

### Token Refresh Issues

- The application uses offline access to obtain a refresh token
- Make sure `access_type=offline` and `prompt=consent` are included in the OAuth request
- If refresh token is missing, try disconnecting and reconnecting

## Production Deployment

For production deployment, update the authorized origins and redirect URIs:

1. Go to **"APIs & Services"** > **"Credentials"**
2. Edit your OAuth 2.0 client ID
3. Add your production URLs to:
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://yourdomain.com/google-callback`

4. Update your `.env` file or environment variables:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/google-callback
   ```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. Use environment-specific configuration files (`.env.development`, `.env.production`)
3. Rotate your client secret periodically
4. Monitor your API usage in Google Cloud Console
5. Set up API quotas and alerts to prevent unexpected costs

## API Quotas and Limits

The Google Calendar API has the following default limits:

- **Daily quota**: 1,000,000 query units per day
- **Per-second limit**: 10 queries per second

For most applications, these limits are sufficient. If you need higher limits, you can request a quota increase in the Google Cloud Console.

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review the Google Cloud Console for API errors
3. Verify your credentials are correctly configured
4. Ensure the Google Calendar API is enabled

For more help, refer to the main project documentation or create an issue on GitHub.
