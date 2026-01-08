# Google OAuth Setup Guide - Fix Error 400: invalid_request

## Problem
You're getting: "Access blocked: Authorization Error - Error 400: invalid_request"

This happens because Google OAuth app needs proper configuration.

## Solution Steps

### Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **mimetic-union-483509-c4**
3. Navigate to: **APIs & Services** → **OAuth consent screen**

4. **Configure OAuth Consent Screen:**
   - **User Type:** Select "External" (for testing) or "Internal" (if you have Google Workspace)
   - **App name:** Telerex (or your app name)
   - **User support email:** Your email
   - **Developer contact information:** Your email
   - Click **Save and Continue**

5. **Scopes:**
   - Click **Add or Remove Scopes**
   - Add these scopes:
     - `openid`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click **Update** then **Save and Continue**

6. **Test Users (IMPORTANT for External apps):**
   - Click **Add Users**
   - Add your test email: `s.k.singh72718@gmail.com`
   - Add any other test emails
   - Click **Save and Continue**

7. **Summary:**
   - Review settings
   - Click **Back to Dashboard**

### Step 2: Verify OAuth Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Verify:
   - **Authorized JavaScript origins:**
     - `http://localhost:5000`
     - `https://node1-telrex-backend.onrender.com`
   - **Authorized redirect URIs:**
     - `http://localhost:5000`
     - `https://node1-telrex-backend.onrender.com`

### Step 3: For Development/Testing (Quick Fix)

If you want to test immediately without app verification:

1. **Add Test Users:**
   - Go to OAuth consent screen
   - Under "Test users", add: `s.k.singh72718@gmail.com`
   - Save

2. **Use Test Mode:**
   - Make sure OAuth consent screen is in "Testing" mode
   - Only test users can sign in

### Step 4: Alternative - Use Postman with Manual Token

If OAuth setup is taking time, you can test the API directly:

1. **Get Google ID Token from Browser Console:**
   ```javascript
   // Open browser console on any page
   // Run this after signing in to Google
   ```

2. **Or use this HTML file:**
   - Open `test-google-login.html` in browser
   - Sign in with Google
   - Copy the token
   - Use in Postman

### Step 5: Postman Request

**Method:** POST  
**URL:** `http://localhost:5000/api/v1/auth/login-google`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "googleToken": "PASTE_GOOGLE_ID_TOKEN_HERE",
  "rememberMe": true
}
```

## Common Issues & Solutions

### Issue 1: "Access blocked" error
**Solution:** Add your email to Test Users in OAuth consent screen

### Issue 2: "Invalid client" error
**Solution:** Check GOOGLE_CLIENT_ID in .env file matches Google Cloud Console

### Issue 3: "Redirect URI mismatch"
**Solution:** Add exact redirect URI in Google Cloud Console credentials

### Issue 4: App not verified (for production)
**Solution:** 
- For testing: Keep app in "Testing" mode and add test users
- For production: Submit app for Google verification (takes time)

## Quick Test Checklist

- [ ] OAuth consent screen configured
- [ ] Test users added (including s.k.singh72718@gmail.com)
- [ ] Scopes added (openid, email, profile)
- [ ] Authorized JavaScript origins set
- [ ] Authorized redirect URIs set
- [ ] GOOGLE_CLIENT_ID in .env matches Google Cloud Console
- [ ] Server restarted after .env changes

## Need Help?

If still getting errors:
1. Check Google Cloud Console → APIs & Services → OAuth consent screen
2. Make sure app is in "Testing" mode
3. Verify test users are added
4. Check browser console for detailed error messages

