# 📱 Test M-Pesa STK Push with YOUR Phone

## Quick Test Guide - Use Your Real Number!

### Step 1: Make Sure Backend is Running
```bash
cd "C:/Users/USER/OneDrive/Attachments/Desktop/hams lounge/hams-backend"
npm start
```
You should see: `🚀 Clean Unified Backend active on port 5000`

### Step 2: Open the POS System
- Frontend: `http://localhost:3000`
- Login as staff or admin

### Step 3: Test the STK Push

1. **Add drinks to cart** (any items)

2. **Select "M-Pesa" as payment method**

3. **Enter YOUR phone number** in one of these formats:
   - `0712345678` (your Safaricom number)
   - `254712345678`
   - `+254712345678`

4. **Click "Complete Sale"**

5. **Watch what happens:**

   #### On the POS Screen:
   - Modal opens: "Initiating Payment..."
   - Then: "Check Your Phone Now!" 📱
   - Shows your number and amount
   - Instructions box appears
   - Spinner shows "Waiting for payment confirmation..."

   #### On Your Phone:
   - **YOU WILL SEE**: M-Pesa popup notification
   - **Message**: "Enter M-Pesa PIN to pay KSh XXX to HAMS LOUNGE"
   - **Enter your PIN** to complete
   - **Or press Cancel** to decline

6. **After you confirm on your phone:**
   - Modal shows: "Payment Received! ✓"
   - Receipt modal opens automatically
   - Receipt prints automatically
   - Sale is recorded in system

## What You'll Experience

### ✅ If Payment Succeeds:
```
Your Phone: M-Pesa prompt appears
You: Enter PIN + Confirm
POS Screen: "Payment Received!" (green checkmark)
Result: Receipt prints, cart clears, sale recorded
```

### ❌ If You Cancel on Phone:
```
Your Phone: You press Cancel on M-Pesa prompt
POS Screen: "Payment Failed" (red X)
Result: Cart remains, can try again
```

### ⏱ If You Don't Respond:
```
Your Phone: M-Pesa prompt times out (ignored)
POS Screen: After 60 seconds shows "Payment Timeout"
Result: Cart remains, can try again
```

## Important: Sandbox vs Production

### Current Mode: SANDBOX
Your `.env` file is set to:
```env
MPESA_ENVIRONMENT=sandbox
```

This means:
- ✅ **STK Push WILL be sent to your phone**
- ✅ **You WILL see the M-Pesa prompt**
- ❌ **Money will NOT be deducted** (it's test mode)
- ❌ **Payment might not complete** (sandbox has limitations)

### To Test With Real Money (Production):

**⚠️ WARNING**: This will use REAL money from your M-Pesa account!

1. Update `hams-backend/.env`:
```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_paybill_number
MPESA_PASSKEY=your_production_passkey
```

2. Get production credentials from: https://developer.safaricom.co.ke
3. Restart backend
4. Test with real phone - **MONEY WILL BE DEDUCTED**

## Troubleshooting

### "No M-Pesa prompt on my phone"
**Causes:**
- Phone number format wrong (must be 07XX or 254XXX)
- Not a Safaricom number (M-Pesa only works on Safaricom)
- Backend not running
- Wrong API credentials in .env

**Fix:**
1. Check backend console for errors
2. Verify phone number is Safaricom
3. Make sure backend shows no errors when you click "Complete Sale"

### "Payment stays in waiting forever"
**Causes:**
- Sandbox mode limitations (normal behavior)
- Didn't respond to phone prompt within 60 seconds
- Network issues

**Fix:**
- Wait for 60-second timeout, then try again
- For production testing, use real credentials

### "Payment failed immediately"
**Causes:**
- Invalid API credentials
- Backend can't reach M-Pesa servers
- Phone number invalid

**Fix:**
1. Check backend logs for error messages
2. Verify .env has correct credentials
3. Try different phone number format

## Backend Logs to Watch

Open backend terminal and watch for:

```bash
# Success:
STK Push initiated successfully
Checkout ID: ws_CO_09102026155700000...

# If you see errors:
STK Push Error: Invalid Access Token
# Fix: Check Consumer Key/Secret in .env

STK Push Error: Invalid phone number
# Fix: Use format 254712345678
```

## Expected Flow Timeline

```
0s   - Click "Complete Sale"
1s   - "Initiating Payment..."
2s   - "Check Your Phone Now!" appears
2-5s - M-Pesa prompt appears on YOUR phone
5-30s - You enter PIN and confirm
31s  - "Payment Received!" ✓
32s  - Receipt modal opens
33s  - Receipt auto-prints
```

## Testing Checklist

- [ ] Backend is running on port 5000
- [ ] Frontend is open at localhost:3000
- [ ] Logged into POS
- [ ] Added drinks to cart
- [ ] Selected "M-Pesa" payment
- [ ] Entered MY Safaricom number: 07________
- [ ] Clicked "Complete Sale"
- [ ] Saw "Check Your Phone Now!" modal
- [ ] Received M-Pesa prompt on phone
- [ ] Entered PIN and confirmed
- [ ] Saw "Payment Received!" success
- [ ] Receipt printed automatically

## Quick Debug Commands

```bash
# Check if backend is running
curl http://localhost:5000/api/products

# Check if M-Pesa route exists
curl http://localhost:5000/api/mpesa/stkpush
# Should return error (needs POST data) but proves route works

# View backend logs
# Just watch the terminal where you ran "npm start"
```

## What's Next?

Once this works with your phone in sandbox mode:
1. You've confirmed STK Push integration works ✅
2. You can see the exact flow your customers will experience ✅
3. Ready to switch to production when you have credentials ✅

---

**Ready to test?** 

1. Start backend
2. Refresh frontend  
3. Add items to cart
4. Select M-Pesa
5. **Enter YOUR number: 07________**
6. Click "Complete Sale"
7. **CHECK YOUR PHONE!** 📱

The M-Pesa prompt should appear within 2-5 seconds!
