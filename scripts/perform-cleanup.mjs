import crypto from 'crypto';
import fs from 'fs';

const GAS_URL = "https://script.google.com/macros/s/AKfycbxRTYXQJAw0hGQUh12jHemUi87ROEftrUV5vAlJRr6JebH58PT13x7XdnudTeulAIS4/exec";
const SERVER_AUTH_SECRET = "QCh0H33s8BN6aoBfUmJ39y5r";

const backupData = JSON.parse(fs.readFileSync('kayal-samayal-test-data-backup-2026-09-27.json', 'utf8'));

const orderIdsToDelete = backupData.orders.map(o => o['Order ID']).filter(Boolean);
const customerIdsToDelete = backupData.customers.map(c => c['Customer ID']).filter(Boolean);

console.log(`Orders to delete (${orderIdsToDelete.length}):`, orderIdsToDelete);
console.log(`Customers to delete (${customerIdsToDelete.length}):`, customerIdsToDelete);

// Compute HMAC token
const tokenPayload = `KAYAL_CLEANUP_AUTH:${orderIdsToDelete.length}:${customerIdsToDelete.length}`;
const serverAuthToken = crypto
  .createHmac('sha256', SERVER_AUTH_SECRET.trim())
  .update(tokenPayload)
  .digest('hex');

const payload = {
  action: "cleanupTestData",
  serverAuthToken,
  orderIdsToDelete,
  customerIdsToDelete,
  productsToRestore: [
    { id: "kayal-kalari-masala-regular", name: "Kayal Kalari Masala", stock: 100 },
    { id: "kayal-curry-masala", name: "Kayal Curry Masala", stock: 100 },
    { id: "kayal-kalari-masala-premium", name: "Kayal Kalari Masala Premium", stock: 100 },
    { id: "fish-curry-masala-regular", name: "Fish Curry Masala", stock: 100 },
    { id: "fish-curry-masala-premium", name: "Fish Curry Masala Premium", stock: 100 },
    { id: "kayal-pepper-masala", name: "Kayal Pepper Masala", stock: 100 },
    { id: "salna-masala", name: "Salna Masala", stock: 100 }
  ],
  couponsToRestore: [
    { code: "TEST1RS", count: 0 },
    { code: "KAYAL100", count: 0 },
    { code: "WELCOME10", count: 0 }
  ]
};

async function executeCleanup() {
  console.log('\nSending authenticated cleanup request to Google Apps Script...');
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log('\nResponse status:', res.status);
  console.log('Response body:', text);

  try {
    const json = JSON.parse(text);
    return json;
  } catch (e) {
    return { success: false, raw: text };
  }
}

executeCleanup().then(res => {
  console.log('\nParsed result:', JSON.stringify(res, null, 2));
  fs.writeFileSync('scripts/cleanup-execution-result.json', JSON.stringify(res, null, 2));
}).catch(console.error);
