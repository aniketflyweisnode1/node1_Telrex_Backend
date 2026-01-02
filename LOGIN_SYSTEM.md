# Login System Documentation

## Overview
The login system is fully set up and ready to use. It supports multiple authentication methods including password-based login, OTP-based login, and token refresh.

## Authentication Endpoints

### Base URL
All authentication endpoints are prefixed with `/api/v1/auth`

### 1. Register
**POST** `/api/v1/auth/register`

Register a new user and receive an OTP for verification.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "1234567890",
  "countryCode": "+91",
  "email": "john@example.com", // optional
  "agreeConfirmation": "true",
  "password": "optional-password" // defaults to last 6 digits of phone if not provided
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registered successfully. OTP sent.",
  "data": {
    "userId": "user_id_here"
  }
}
```

### 2. Verify OTP
**POST** `/api/v1/auth/verify-otp`

Verify OTP received during registration.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified. Login successful.",
  "data": {
    "user": { /* user object */ },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 3. Resend OTP
**POST** `/api/v1/auth/resend-otp`

Resend OTP to the registered phone number.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "countryCode": "+91"
}
```

### 4. Login with Password
**POST** `/api/v1/auth/login`

Login using email/phone and password.

**Request Body:**
```json
{
  "identifier": "user@example.com", // or phone number
  "password": "password123",
  "rememberMe": true // optional, generates refresh token if true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token" // only if rememberMe is true
    }
  }
}
```

### 5. Login with OTP
**POST** `/api/v1/auth/login-otp`

Login using phone number and OTP (two-step process).

**Step 1 - Request OTP:**
```json
{
  "phoneNumber": "1234567890",
  "countryCode": "+91" // optional, defaults to +91
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to phone"
}
```

**Step 2 - Verify OTP:**
```json
{
  "phoneNumber": "1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": null
    }
  }
}
```

### 6. Refresh Token
**POST** `/api/v1/auth/refresh-token`

Refresh the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "new_jwt_token",
    "user": { /* user object */ }
  }
}
```

### 7. Logout
**POST** `/api/v1/auth/logout`

Logout endpoint (currently returns success, can be extended for token blacklisting).

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Protected Routes

To protect routes, use the `auth` middleware:

```javascript
const auth = require('../middlewares/auth.middleware');

router.get('/protected-route', auth, controller.protectedFunction);
```

The middleware will:
- Verify the JWT token from `Authorization: Bearer <token>` header
- Load user data and attach it to `req.user`
- Return 401 if token is missing, invalid, or expired

**req.user contains:**
```javascript
{
  id: "user_id",
  role: "patient" | "doctor" | "admin",
  email: "user@example.com",
  phoneNumber: "1234567890",
  firstName: "John",
  lastName: "Doe",
  isVerified: true
}
```

## Environment Variables

Create a `.env` file (or `.env.development`, `.env.production`) with:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/telerxs

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
JWT_REFRESH_EXPIRES_IN=7d

# OTP
OTP_EXPIRE_MINUTES=10
```

## User Roles

The system supports three roles:
- `patient` (default)
- `doctor`
- `admin`

## Security Features

1. **Password Hashing**: All passwords are hashed using bcryptjs
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Access tokens expire in 15 minutes (configurable)
4. **Refresh Tokens**: Long-lived refresh tokens for "remember me" functionality
5. **OTP Expiration**: OTPs expire after 10 minutes (configurable)
6. **Rate Limiting**: OTP resend has 1-minute cooldown
7. **Input Validation**: All endpoints use express-validator for input validation

## Error Handling

All errors are handled by the error middleware and return consistent JSON responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message here"
}
```

## Testing the Login System

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Register a user:**
   ```bash
   POST http://localhost:5000/api/v1/auth/register
   ```

3. **Verify OTP:**
   ```bash
   POST http://localhost:5000/api/v1/auth/verify-otp
   ```

4. **Login:**
   ```bash
   POST http://localhost:5000/api/v1/auth/login
   ```

5. **Use protected routes:**
   ```bash
   GET http://localhost:5000/api/v1/protected-route
   Headers: Authorization: Bearer <access_token>
   ```

## Notes

- OTPs are logged to console for development (check server logs)
- In production, integrate with SMS service for OTP delivery
- Refresh tokens are optional and only generated when `rememberMe: true`
- The logout endpoint is a placeholder for future token blacklisting implementation

