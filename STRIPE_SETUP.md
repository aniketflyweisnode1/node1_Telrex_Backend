# Stripe Payment Gateway Setup Guide

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx  # Your Stripe publishable key (for frontend)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Webhook signing secret from Stripe dashboard
```

## Installation

The Stripe package is already added to `package.json`. Install dependencies:

```bash
npm install
```

## Payment Flow

### 1. Create Order
First, create an order using the order creation API.

### 2. Create Payment Intent
After order creation, call the payment intent endpoint:

```javascript
POST /api/v1/patient/payments/intent
{
  "orderId": "order_id",
  "paymentMethod": "card",
  "currency": "inr"
}
```

This returns a `clientSecret` that you'll use on the frontend.

### 3. Frontend Payment Confirmation
On the frontend, use Stripe.js to confirm the payment:

```javascript
const stripe = Stripe('pk_test_xxxxxxxxxxxxx');
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Customer Name'
      }
    }
  }
);
```

### 4. Verify Payment (Optional)
After frontend confirmation, optionally verify on backend:

```javascript
POST /api/v1/patient/payments/verify
{
  "paymentIntentId": "pi_1234567890"
}
```

### 5. Webhook (Automatic)
Stripe will automatically send webhook events to:
```
POST /api/v1/patient/payments/webhook
```

The webhook automatically updates payment and order status.

## Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://yourdomain.com/api/v1/patient/payments/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.processing`
   - `charge.refunded`
5. Copy the "Signing secret" and add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Payment Status Flow

1. **Pending** - Payment intent created
2. **Processing** - Payment being processed
3. **Success** - Payment succeeded (order confirmed)
4. **Failed** - Payment failed (order payment status updated)
5. **Refunded** - Payment refunded

## Order Status Updates

- Payment Success → Order status: `confirmed`, Payment status: `paid`
- Payment Failed → Order status: `pending`, Payment status: `failed`
- Refund → Order status: `pending`, Payment status: `refunded`

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

## Security Notes

- Never expose `STRIPE_SECRET_KEY` in frontend
- Always verify webhook signatures
- Use HTTPS in production
- Store sensitive payment data securely
- Follow PCI DSS compliance guidelines

