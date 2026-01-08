# Fix Google OAuth Origin Error

## Error Message
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
Failed to load resource: the server responded with a status of 400
```

## Problem
Google OAuth client ID ke saath current origin (`http://localhost:5000`) authorized nahi hai.

## Solution: Add Authorized JavaScript Origins

### Step 1: Google Cloud Console Mein Jao
1. Go to: https://console.cloud.google.com/
2. Project select karein: **mimetic-union-483509-c4**
3. **APIs & Services** → **Credentials**

### Step 2: OAuth 2.0 Client ID Edit Karein
1. Apne OAuth 2.0 Client ID par click karein
2. **"EDIT"** button click karein (top right corner)

### Step 3: Authorized JavaScript Origins Add Karein
1. **"Authorized JavaScript origins"** section mein jao
2. **"+ ADD URI"** button click karein
3. Ye exact URLs add karein (without trailing slash):
   - `http://localhost:5000`
   - `https://node1-telrex-backend.onrender.com`
4. **SAVE** button click karein

### Step 4: Authorized Redirect URIs (Optional but Recommended)
1. **"Authorized redirect URIs"** section mein jao
2. **"+ ADD URI"** button click karein
3. Ye exact URLs add karein:
   - `http://localhost:5000`
   - `https://node1-telrex-backend.onrender.com`
4. **SAVE** button click karein

## Important Notes

### ✅ Correct Format:
- `http://localhost:5000` ✅
- `https://node1-telrex-backend.onrender.com` ✅

### ❌ Wrong Format:
- `http://localhost:5000/` ❌ (trailing slash nahi hona chahiye)
- `localhost:5000` ❌ (protocol required)
- `http://127.0.0.1:5000` ❌ (localhost use karein, not 127.0.0.1)

## Verification Checklist

- [ ] Google Cloud Console → Credentials → OAuth 2.0 Client ID
- [ ] Authorized JavaScript origins mein `http://localhost:5000` add kiya
- [ ] Authorized redirect URIs mein `http://localhost:5000` add kiya
- [ ] SAVE button click kiya
- [ ] Browser cache cleared
- [ ] Server restart kiya
- [ ] Test kiya: `http://localhost:5000/test-google-login`

## After Changes

1. **Browser cache clear karein** (Ctrl + Shift + Delete)
2. **Incognito window try karein** (Ctrl + Shift + N)
3. **Server restart karein** (agar needed ho)
4. **Test karein:** `http://localhost:5000/test-google-login`

## Common Issues

### Issue 1: Still getting origin error
**Solution:**
- Exact URL check karein (no trailing slash)
- Browser cache completely clear karein
- Incognito window use karein

### Issue 2: Changes not reflecting
**Solution:**
- Google Cloud Console mein changes save kiye?
- Browser cache cleared?
- Server restarted?

### Issue 3: Works in incognito but not normal window
**Solution:**
- Browser cache completely clear karein
- All cookies delete karein (Google related)

## Quick Fix Steps

1. ✅ Google Cloud Console → Credentials
2. ✅ OAuth 2.0 Client ID → EDIT
3. ✅ Authorized JavaScript origins → `http://localhost:5000` add
4. ✅ SAVE
5. ✅ Browser cache clear
6. ✅ Test

