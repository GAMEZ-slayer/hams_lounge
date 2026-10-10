const axios = require('axios');

// M-Pesa Configuration
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'

// M-Pesa API URLs
const BASE_URL = MPESA_ENVIRONMENT === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// Store pending transactions in memory (in production, use a database)
const pendingTransactions = new Map();

/**
 * Get OAuth Access Token from M-Pesa
 */
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with M-Pesa');
  }
};

/**
 * Generate Timestamp (YYYYMMDDHHmmss)
 */
const getTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

/**
 * Generate Password for STK Push
 */
const generatePassword = (timestamp) => {
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
  return password;
};

/**
 * Format phone number to 254XXXXXXXXX
 */
const formatPhoneNumber = (phone) => {
  // Remove spaces, dashes, and plus signs
  let cleaned = phone.replace(/[\s\-+]/g, '');

  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }

  // If doesn't start with 254, prepend it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  return cleaned;
};

/**
 * Initiate STK Push
 */
exports.initiateSTKPush = async (req, res) => {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

    // Validate inputs
    if (!phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and amount are required'
      });
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp and password
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    // Callback URL - Replace with your actual public URL in production
    const callbackUrl = process.env.MPESA_CALLBACK_URL || `${BASE_URL}/api/mpesa/callback`;

    // STK Push request payload
    const stkPushPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount), // M-Pesa accepts only whole numbers
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference || 'HAMS-LOUNGE',
      TransactionDesc: transactionDesc || 'Payment for drinks'
    };

    // Make STK Push request
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Store transaction details for callback processing
    const checkoutRequestId = response.data.CheckoutRequestID;
    if (checkoutRequestId) {
      pendingTransactions.set(checkoutRequestId, {
        phoneNumber: formattedPhone,
        amount,
        accountReference,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
    }

    res.json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        MerchantRequestID: response.data.MerchantRequestID,
        CheckoutRequestID: response.data.CheckoutRequestID,
        ResponseCode: response.data.ResponseCode,
        ResponseDescription: response.data.ResponseDescription,
        CustomerMessage: response.data.CustomerMessage
      }
    });

  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate STK Push',
      error: error.response?.data?.errorMessage || error.message
    });
  }
};

/**
 * Handle M-Pesa Callback
 */
exports.handleCallback = async (req, res) => {
  try {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

    const callbackData = req.body?.Body?.stkCallback;

    if (!callbackData) {
      return res.status(400).json({ message: 'Invalid callback data' });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callbackData;

    // Update transaction status
    if (pendingTransactions.has(CheckoutRequestID)) {
      const transaction = pendingTransactions.get(CheckoutRequestID);

      if (ResultCode === 0) {
        // Payment successful
        const callbackMetadata = callbackData.CallbackMetadata?.Item || [];
        const mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const transactionDate = callbackMetadata.find(item => item.Name === 'TransactionDate')?.Value;

        transaction.status = 'success';
        transaction.mpesaReceiptNumber = mpesaReceiptNumber;
        transaction.transactionDate = transactionDate;
        transaction.resultDesc = ResultDesc;
      } else {
        // Payment failed
        transaction.status = 'failed';
        transaction.resultDesc = ResultDesc;
      }

      pendingTransactions.set(CheckoutRequestID, transaction);
    }

    // Acknowledge receipt
    res.json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (error) {
    console.error('Callback Error:', error.message);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed to process callback' });
  }
};

/**
 * Check Payment Status
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'CheckoutRequestID is required'
      });
    }

    // Check in memory storage
    if (pendingTransactions.has(checkoutRequestId)) {
      const transaction = pendingTransactions.get(checkoutRequestId);
      return res.json({
        success: true,
        status: transaction.status,
        data: transaction
      });
    }

    // If not found, query M-Pesa directly
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    const queryPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpushquery/v1/query`,
      queryPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      status: response.data.ResultCode === '0' ? 'success' : 'pending',
      data: response.data
    });

  } catch (error) {
    console.error('Status Check Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.response?.data?.errorMessage || error.message
    });
  }
};
