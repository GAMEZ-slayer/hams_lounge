# M-Pesa STK Push Integration - Setup Guide

## What Was Implemented

### Backend Components:
1. **mpesaController.js** - Handles STK Push initiation, callbacks, and payment status checking
2. **mpesaRoutes.js** - API routes for M-Pesa operations
3. **server.js** - Mounted M-Pesa routes at `/api/mpesa`

### Frontend Components:
1. **Dashboard.js** - Added STK Push flow with real-time status tracking
2. **STK Status Modal** - Shows payment progress with different states

## How It Works

### For M-Pesa Payments:
1. Staff selects "M-Pesa" as payment method
2. Enters customer's phone number
3. Clicks "Complete Sale"
4. **STK Push is sent to customer's phone**
5. Modal shows payment status in real-time:
   - "Initiating Payment..." 
   - "Payment Request Sent" (customer checks their phone)
   - "Payment Successful!" or "Payment Failed"
6. If successful, sale is recorded and receipt auto-prints

### Payment Status States:
- **initiating** - Sending request to M-Pesa
- **waiting** - STK sent, waiting for customer to enter PIN
- **success** - Payment completed successfully
- **failed** - Payment was declined/cancelled
- **timeout** - Customer didn't respond within 60 seconds

## Testing in Sandbox Mode

### Current Configuration (Sandbox):
- **Environment**: Sandbox (testing mode)
- **Shortcode**: 174379
- **Passkey**: Already configured in .env

### Test Phone Numbers for Sandbox:
Use these Safaricom test numbers in sandbox mode:

| Phone Number | Description | Result |
|--------------|-------------|--------|
| 254708374149 | Test success | Payment succeeds |
| 254711111111 | Test timeout | Request times out |
| 254722000000 | Test insufficient funds | Payment fails |

### How to Test:
1. Start your backend: `cd hams-backend && npm start`
2. Your frontend should already be running
3. Login to the POS
4. Add drinks to cart
5. Select "M-Pesa" payment
6. Enter test phone: **254708374149**
7. Click "Complete Sale"
8. Watch the STK modal show progress
9. In sandbox, it will auto-succeed after a few seconds

## Important Notes

### Callback URL Issue (Development):
⚠️ M-Pesa callbacks **won't work** on localhost because Safaricom needs a public HTTPS URL.

**Solutions:**
1. **For Testing**: Payment status polling works without callbacks (checks every 3 seconds)
2. **For Production**: Use ngrok or deploy to a server with HTTPS
   ```bash
   # Using ngrok (free)
   ngrok http 5000
   # Then update MPESA_CALLBACK_URL in .env to: https://your-ngrok-url.ngrok.io/api/mpesa/callback
   ```

### Environment Variables:
All M-Pesa credentials are in `hams-backend/.env`:
```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=ygrA2MphNJvA6k5vZJxcroIbAM6cJJ2fEkPYGIDDOKcnaJ4L
MPESA_CONSUMER_SECRET=6whAn747XcbAAiJGnhBL5hAfaQWR8BxMeo8aZdypRtr08trtPDArHjYeDlmk3283
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb27a7bfd4c2166844b876c566d3c66a200de15a15f169e1406c4e1a0ffc67f
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

## Going to Production

### 1. Get Production Credentials:
- Visit https://developer.safaricom.co.ke
- Create an app in production environment
- Get your production Consumer Key, Secret, and Passkey
- Get your Paybill/Till Number

### 2. Update .env:
```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_key
MPESA_CONSUMER_SECRET=your_production_secret
MPESA_SHORTCODE=your_paybill_or_till_number
MPESA_PASSKEY=your_production_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

### 3. Deploy Backend:
- Deploy to a server with HTTPS (Heroku, Railway, DigitalOcean, etc.)
- Update MPESA_CALLBACK_URL to your production URL
- Register your callback URL with Safaricom (in Daraja portal)

### 4. Test with Real Phone:
- Use real Kenyan M-Pesa numbers (254...)
- Customer will receive STK push on their phone
- They enter M-Pesa PIN to complete payment

## API Endpoints

### 1. Initiate STK Push
```
POST /api/mpesa/stkpush
Body: {
  "phoneNumber": "0712345678",
  "amount": 500,
  "accountReference": "HAMS-123",
  "transactionDesc": "Payment for drinks"
}
```

### 2. Check Payment Status
```
GET /api/mpesa/status/:checkoutRequestId
```

### 3. M-Pesa Callback (Safaricom calls this)
```
POST /api/mpesa/callback
```

## Troubleshooting

### "Failed to authenticate with M-Pesa"
- Check your Consumer Key and Secret in .env
- Make sure they match your sandbox/production environment

### "STK Push initiated but no response"
- Normal in sandbox if using wrong test numbers
- Check backend logs for M-Pesa API errors

### Payment stays in "waiting" state forever
- Expected if using invalid phone numbers
- 60-second timeout will trigger automatically
- In production, customer needs to enter PIN on their phone

### Receipt doesn't auto-print
- Make sure browser has print permissions
- Receipt will auto-print only for successful M-Pesa payments

## Features Implemented

✅ STK Push initiation with phone number validation  
✅ Real-time payment status tracking (polls every 3 seconds)  
✅ Visual status modal with progress indicators  
✅ Auto-timeout after 60 seconds  
✅ Automatic sale recording on success  
✅ Auto-print receipt after successful M-Pesa payment  
✅ Phone number formatting (handles 07XX, 254XX, +254XX)  
✅ Error handling for failed payments  
✅ Cancel button during waiting state  
✅ Support for Cash and Card (works as before)  

## Next Steps

1. **Test in Sandbox**: Use the test phone numbers above
2. **Setup ngrok** (optional): If you want to test callbacks
3. **Monitor logs**: Check backend console for M-Pesa responses
4. **Go to Production**: Follow the "Going to Production" section above

---

**Need Help?**
- Safaricom Daraja API Docs: https://developer.safaricom.co.ke/Documentation
- M-Pesa Test Credentials: https://developer.safaricom.co.ke/test_credentials
