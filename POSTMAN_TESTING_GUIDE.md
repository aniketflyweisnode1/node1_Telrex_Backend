# Postman Testing Guide - Google Login

## Problem: Cannot Continue with Google OAuth

Agar Google OAuth se continue nahi kar pa rahe, to ye alternative methods use karein:

## Method 1: Manual Token Testing (Recommended)

### Step 1: Get Google ID Token from Browser

1. **Browser Console Method:**
   - Kisi bhi website par F12 press karein (Developer Tools)
   - Console tab kholen
   - Google Sign-In wali website par jao (jaise Gmail)
   - Sign-in karein
   - Console mein ye code run karein:
   ```javascript
   // Check if Google token available
   console.log('Check localStorage or sessionStorage for tokens');
   ```

2. **Network Tab Method:**
   - F12 → Network tab
   - Google sign-in karein
   - Network requests mein `oauth2` ya `token` search karein
   - Response mein token mil jayega

### Step 2: Use Token in Postman

**Request:**
- **Method:** POST
- **URL:** `http://localhost:5000/api/v1/auth/login-google`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "googleToken": "PASTE_GOOGLE_ID_TOKEN_HERE",
    "rememberMe": true
  }
  ```

## Method 2: Test with Mock Token (Development Only)

Agar Google OAuth setup nahi ho raha, to temporarily mock token use kar sakte hain for testing API structure:

**Note:** Ye sirf API structure test karne ke liye hai. Real Google token chahiye actual authentication ke liye.

## Method 3: Fix Google OAuth Setup

### Quick Fix Steps:

1. **Google Cloud Console Check:**
   - Go to: https://console.cloud.google.com/
   - Project: mimetic-union-483509-c4
   - APIs & Services → OAuth consent screen
   - **Test Users** section mein apna email add karein: `s.k.singh72718@gmail.com`

2. **Verify Credentials:**
   - APIs & Services → Credentials
   - OAuth 2.0 Client ID check karein
   - Authorized JavaScript origins:
     - `http://localhost:5000`
   - Authorized redirect URIs:
     - `http://localhost:5000`

3. **Check App Status:**
   - OAuth consent screen "Testing" mode mein hona chahiye
   - Publishing status: "Testing"

## Method 4: Alternative - Use Regular Login

Agar Google OAuth se continue nahi kar pa rahe, to pehle regular login test karein:

**POST** `/api/v1/auth/login`

```json
{
  "identifier": "your-email@example.com",
  "password": "your-password",
  "rememberMe": true
}
```

## Troubleshooting

### Error: "Access blocked"
**Solution:** Google Cloud Console → OAuth consent screen → Test Users → Add your email

### Error: "Invalid client"
**Solution:** Check GOOGLE_CLIENT_ID in .env file matches Google Cloud Console

### Error: "Redirect URI mismatch"
**Solution:** Add exact redirect URI in Google Cloud Console credentials

### Error: "Cannot continue with Google"
**Solution:** 
1. Clear browser cache and cookies
2. Try incognito/private window
3. Check if email is in Test Users list
4. Verify OAuth consent screen is in Testing mode

## Quick Test Checklist

- [ ] Google Cloud Console mein Test Users add kiye
- [ ] OAuth consent screen "Testing" mode mein hai
- [ ] Authorized JavaScript origins set kiye
- [ ] Authorized redirect URIs set kiye
- [ ] .env file mein GOOGLE_CLIENT_ID sahi hai
- [ ] Server restart kiya after .env changes
- [ ] Browser cache cleared

## Need More Help?

Agar abhi bhi issue ho, to:
1. Browser console errors check karein (F12)
2. Network tab mein failed requests check karein
3. Google Cloud Console mein app status verify karein

