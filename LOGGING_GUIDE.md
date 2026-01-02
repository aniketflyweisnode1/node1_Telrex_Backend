# Logging Guide - Winston Day-wise Logs

## Overview
The application uses Winston logger with daily rotating log files. Logs are automatically organized by date and archived.

## Log Files Structure

All logs are stored in the `logs/` directory:

```
logs/
├── application-2025-01-15.log    # All application logs
├── error-2025-01-15.log          # Error logs only
├── exceptions-2025-01-15.log     # Uncaught exceptions
└── rejections-2025-01-15.log     # Unhandled promise rejections
```

## Log Levels

- **error** - Error logs (logged to error file)
- **warn** - Warning logs
- **info** - Informational logs (default)
- **debug** - Debug logs (development only)

## Configuration

### Environment Variables

Add to your `.env` file:

```env
LOG_LEVEL=info  # Options: error, warn, info, debug
NODE_ENV=development  # or production
```

### Log Rotation Settings

- **Max File Size**: 20MB per file
- **Retention**: 30 days
- **Archive**: Old logs are automatically zipped
- **Date Pattern**: YYYY-MM-DD (one file per day)

## Usage in Code

### Basic Logging

```javascript
const logger = require('../utils/logger');

// Info log
logger.info('User logged in', { userId: '123', email: 'user@example.com' });

// Error log
logger.error('Payment failed', { 
  paymentId: 'pay_123', 
  error: error.message,
  stack: error.stack 
});

// Warning log
logger.warn('Invalid login attempt', { identifier: 'user@example.com' });

// Debug log (only in development)
logger.debug('Processing payment', { orderId: 'ord_123' });
```

### Logging in Services

```javascript
// Payment service example
logger.info('Payment intent created', {
  paymentId: payment.paymentId,
  orderId: order._id,
  amount: order.totalAmount
});

// Error logging
logger.error('Payment processing failed', {
  paymentId: payment.paymentId,
  error: error.message,
  stack: error.stack
});
```

## Logged Operations

The following operations are automatically logged:

### Authentication
- User registration
- Login attempts (success/failure)
- Password changes
- OTP verification

### Payments
- Payment intent creation
- Payment verification
- Payment success/failure
- Refunds
- Stripe webhook events

### Orders
- Order creation
- Order updates
- Order reorder

### Database
- MongoDB connection
- Connection errors

### HTTP Requests
- All HTTP requests (via Morgan integration)
- Request method, path, status, response time

### Errors
- All errors with full context
- Request details (path, method, user, body, query, params)
- Stack traces

## Log File Examples

### Application Log (application-YYYY-MM-DD.log)
```json
{
  "timestamp": "2025-01-15 10:30:00",
  "level": "info",
  "message": "User logged in successfully",
  "service": "telerxs-backend",
  "userId": "6953a62748f8ea5da286331a",
  "identifier": "user@example.com",
  "role": "patient",
  "loginMethod": "password"
}
```

### Error Log (error-YYYY-MM-DD.log)
```json
{
  "timestamp": "2025-01-15 10:35:00",
  "level": "error",
  "message": "Payment processing failed",
  "service": "telerxs-backend",
  "paymentId": "PAY-1234567890-1234",
  "error": "Stripe error: Invalid payment method",
  "stack": "Error: Stripe error..."
}
```

## Production Considerations

1. **Log Level**: Set `LOG_LEVEL=info` or `LOG_LEVEL=warn` in production
2. **Console Output**: Disabled in production (only file logging)
3. **Log Rotation**: Automatic, keeps 30 days of logs
4. **Disk Space**: Monitor `logs/` directory size
5. **Security**: Sensitive data (passwords, tokens) should not be logged

## Viewing Logs

### View today's logs
```bash
tail -f logs/application-$(date +%Y-%m-%d).log
```

### View error logs
```bash
tail -f logs/error-$(date +%Y-%m-%d).log
```

### Search logs
```bash
grep "payment" logs/application-*.log
```

### View specific date
```bash
cat logs/application-2025-01-15.log
```

## Log Retention

- Logs are kept for **30 days**
- After 30 days, old log files are automatically deleted
- Archived (zipped) logs are also deleted after 30 days
- Each log file is max **20MB** before rotation

## Best Practices

1. **Include Context**: Always include relevant IDs, user info, etc.
2. **Structured Logging**: Use objects for metadata, not string concatenation
3. **Error Logging**: Always log errors with stack traces
4. **Sensitive Data**: Never log passwords, tokens, or credit card numbers
5. **Log Levels**: Use appropriate log levels (error for errors, info for normal operations)

## Example Logging Patterns

```javascript
// ✅ Good - Structured logging with context
logger.info('Order created', {
  orderId: order._id,
  orderNumber: order.orderNumber,
  patientId: patient._id,
  totalAmount: order.totalAmount
});

// ❌ Bad - String concatenation
logger.info(`Order ${order._id} created for patient ${patient._id}`);

// ✅ Good - Error with full context
logger.error('Payment failed', {
  paymentId: payment._id,
  orderId: order._id,
  error: error.message,
  stack: error.stack,
  userId: req.user.id
});

// ❌ Bad - Missing context
logger.error('Payment failed');
```

