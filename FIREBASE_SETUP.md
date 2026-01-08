# Firebase Setup Guide for Support System

This guide will help you configure Firebase for the Support System module.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Realtime Database

1. In Firebase Console, go to **Realtime Database**
2. Click **Create Database**
3. Choose your location (e.g., `us-central1`)
4. Start in **test mode** (we'll configure rules later)
5. Copy the database URL (format: `https://your-project-id-default-rtdb.firebaseio.com`)

## Step 3: Get Service Account Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file (keep it secure!)

## Step 4: Configure Environment Variables

Add the following to your `.env.development` or `.env.production` file:

### Option 1: Environment Variables (Recommended)

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

**Important Notes:**
- Replace `YOUR_PRIVATE_KEY_HERE` with the actual private key from the JSON file
- Keep the `\n` characters in the private key (they represent newlines)
- The private key should be wrapped in quotes
- Remove the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines from the JSON and use only the key value

**Example:**
```env
FIREBASE_PROJECT_ID=mimetic-union-483509-c4
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@mimetic-union-483509-c4.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://mimetic-union-483509-c4-default-rtdb.firebaseio.com
```

### Option 2: Service Account File Path (Alternative)

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

**Steps:**
1. Create a `config` folder in your project root
2. Place the downloaded JSON file there as `firebase-service-account.json`
3. Add the file path to `.env`
4. **Important:** Add `config/firebase-service-account.json` to `.gitignore` to keep it secure!

## Step 5: Configure Database Rules

In Firebase Console, go to **Realtime Database** > **Rules** and update:

```json
{
  "rules": {
    "support-chats": {
      "$queryId": {
        ".read": "auth != null && (data.child('patientId').val() == auth.uid || root.child('admins').child(auth.uid).exists())",
        ".write": "auth != null && (data.child('patientId').val() == auth.uid || root.child('admins').child(auth.uid).exists())",
        "messages": {
          ".read": "auth != null && (parent().child('patientId').val() == auth.uid || root.child('admins').child(auth.uid).exists())",
          ".write": "auth != null && (parent().child('patientId').val() == auth.uid || root.child('admins').child(auth.uid).exists())"
        }
      }
    }
  }
}
```

**Note:** For production, implement proper authentication and authorization rules based on your security requirements.

## Step 6: Verify Configuration

1. Start your server:
   ```bash
   npm run dev
   ```

2. Check server logs for:
   ```
   Firebase Admin SDK initialized successfully
   ```

3. If you see a warning:
   ```
   Firebase credentials not provided. Support system will use MongoDB only.
   ```
   Then check your environment variables are set correctly.

## Troubleshooting

### Error: "Firebase initialization failed"

**Possible causes:**
1. Invalid private key format - Make sure `\n` characters are preserved
2. Wrong project ID - Verify it matches your Firebase project
3. Missing database URL - Ensure `FIREBASE_DATABASE_URL` is set correctly
4. Service account file not found - Check the file path if using Option 2

### Error: "Permission denied" when accessing Firebase

**Solutions:**
1. Check database rules are configured correctly
2. Verify service account has proper permissions
3. Ensure database is in the correct region

### Firebase not working but no errors

**Check:**
1. Environment variables are loaded (check `process.env.FIREBASE_PROJECT_ID`)
2. Server was restarted after adding environment variables
3. `.env.development` or `.env.production` file exists and is in the project root

## Security Best Practices

1. **Never commit** `.env` files or service account JSON files to Git
2. Use different Firebase projects for development and production
3. Rotate service account keys periodically
4. Use environment-specific configuration
5. Restrict database rules to authorized users only

## Support System Features

Once configured, the Support System will:
- ✅ Create Firebase chats automatically when queries are created
- ✅ Store messages in Firebase Realtime Database
- ✅ Enable real-time message updates
- ✅ Track read/unread status
- ✅ Maintain message history

If Firebase is not configured, the system will still work with MongoDB only, but real-time messaging features will be limited.

