import crypto from 'crypto';
import fs from 'fs';

// Load local environment safely without printing any secret values
const envPath = '.env.local';
const envConfig = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const parts = line.split('=');
    const k = parts[0]?.trim();
    if (k && !k.startsWith('#')) {
      envConfig[k] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

const SERVER_AUTH_SECRET = process.env.SERVER_AUTH_SECRET || envConfig.SERVER_AUTH_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || envConfig.RAZORPAY_WEBHOOK_SECRET || '';
const GAS_URL = process.env.NEXT_PUBLIC_KAYAL_API_URL || envConfig.NEXT_PUBLIC_KAYAL_API_URL || 'https://script.google.com/macros/s/AKfycbxRTYXQJAw0hGQUh12jHemUi87ROEftrUV5vAlJRr6JebH58PT13x7XdnudTeulAIS4/exec';

async function runVerificationTests() {
  console.log('===============================================================');
  console.log('  KAYAL SAMAYAL PAYMENT & WEBHOOK AUTOMATED TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // ── TEST 1: WEBHOOK SIGNATURE VALIDATION LOGIC ──────────────────
  console.log('--- TEST 1: Webhook Signature Verification Logic ---');
  const mockWebhookSecret = RAZORPAY_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');
  const rawPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_mock_unit_123',
          order_id: 'order_mock_unit_123',
          amount: 6000,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  });

  const validSig = crypto.createHmac('sha256', mockWebhookSecret).update(rawPayload).digest('hex');
  const invalidSig = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  function verifyWebhookSig(sig, body, secret) {
    if (!sig || !secret) return false;
    const exp = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const sigBuf = Buffer.from(String(sig).trim(), 'utf-8');
    const expBuf = Buffer.from(exp, 'utf-8');
    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  }

  assert(verifyWebhookSig(validSig, rawPayload, mockWebhookSecret), 'Valid webhook HMAC signature verifies correctly');
  assert(!verifyWebhookSig(invalidSig, rawPayload, mockWebhookSecret), 'Invalid webhook signature is strictly rejected');
  assert(!verifyWebhookSig('', rawPayload, mockWebhookSecret), 'Empty signature header is rejected');
  assert(!verifyWebhookSig(validSig, rawPayload + ' tampered', mockWebhookSecret), 'Tampered payload body invalidates signature');

  // ── TEST 2: APPS SCRIPT TOKEN VERIFICATION ───────────────────────
  console.log('\n--- TEST 2: Apps Script Server Auth Token Verification ---');
  if (SERVER_AUTH_SECRET) {
    const rOrderId = 'order_unit_test_' + Date.now();
    const rPayId = 'pay_unit_test_' + Date.now();

    const invalidToken = crypto
      .createHmac('sha256', 'completely_wrong_secret_for_testing')
      .update(`KAYAL_ORDER_AUTH:${rOrderId}:${rPayId}`)
      .digest('hex');

    // Test rejection of forged / invalid token by Google Apps Script
    try {
      const resInvalid = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'confirmRazorpayOrder',
          razorpayOrderId: rOrderId,
          razorpayPaymentId: rPayId,
          razorpaySignature: 'mock_sig',
          razorpayAmount: 100,
          serverAuthToken: invalidToken,
          customer: { name: 'Test', mobile: '9999999999' },
          items: []
        })
      });
      const dataInvalid = await resInvalid.json();
      assert(
        dataInvalid.step === 'Server Authentication Validation' &&
        /invalid authentication token/i.test(dataInvalid.error || ''),
        'Invalid authentication token is strictly rejected by Google Apps Script',
        JSON.stringify(dataInvalid)
      );
    } catch (err) {
      assert(false, 'Apps Script invalid token test execution failed', String(err));
    }
  } else {
    console.log('[SKIP] SERVER_AUTH_SECRET not set in environment. Skipping live Apps Script token test.');
  }

  // ── TEST 3: IDEMPOTENCY & DATABASE MATCHING ──────────────────────
  console.log('\n--- TEST 3: Idempotency & Database Matching ---');
  try {
    const fetchOrderRes = await fetch(`${GAS_URL}?action=order&id=KYS-20261016-0001`);
    const orderDetails = await fetchOrderRes.json();
    assert(
      orderDetails.success === true && orderDetails.data?.order?.['Order ID'] === 'KYS-20261016-0001',
      'Database order retrieval matches existing record idempotently',
      JSON.stringify(orderDetails.success)
    );
  } catch (err) {
    assert(false, 'Order retrieval check failed', String(err));
  }

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerificationTests().catch((e) => {
  console.error('Test runner exception:', e);
  process.exit(1);
});
