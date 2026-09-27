import fs from 'fs';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxRTYXQJAw0hGQUh12jHemUi87ROEftrUV5vAlJRr6JebH58PT13x7XdnudTeulAIS4/exec';

// Generate list of order IDs to probe
const orderIdsToTest = [];

// Probe September 2026 dates (and recent days)
const dates = [
  '20260920', '20260921', '20260922', '20260923', '20260924',
  '20260925', '20260926', '20260927', '20260928'
];

for (const d of dates) {
  for (let i = 1; i <= 60; i++) {
    orderIdsToTest.push(`KYS-${d}-${String(i).padStart(4, '0')}`);
  }
}

// Add generic or sample patterns
for (let i = 1; i <= 30; i++) {
  orderIdsToTest.push(`ORD-${String(i).padStart(4, '0')}`);
  orderIdsToTest.push(`KYS-${String(i).padStart(4, '0')}`);
  orderIdsToTest.push(`TEST-${String(i).padStart(4, '0')}`);
}

console.log(`Prepared ${orderIdsToTest.length} Order IDs to check.`);

async function fetchOrder(orderId) {
  try {
    const res = await fetch(`${GAS_URL}?action=order&id=${encodeURIComponent(orderId)}`);
    const json = await res.json();
    if (json.success && json.data && json.data.order) {
      return json.data;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// Run with concurrency limit of 15
async function runPool(items, fn, concurrency = 15) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      const res = await fn(current);
      if (res) {
        console.log(`[FOUND] ${res.order['Order ID']} | Customer: ${res.order['Full Name']} (${res.order['Customer ID']}) | Status: ${res.order['Payment Status']}/${res.order['Order Status']} | Amount: ₹${res.order['Grand Total']} | Method: ${res.order['Payment Method']}`);
        results.push(res);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('Starting parallel order discovery...');
  const found = await runPool(orderIdsToTest, fetchOrder, 15);
  console.log(`\nScan complete! Found ${found.length} total orders.`);

  // Sort by Order ID or Date
  found.sort((a, b) => {
    const dA = new Date(a.order['Created At'] || a.order['Order Date'] || 0).getTime();
    const dB = new Date(b.order['Created At'] || b.order['Order Date'] || 0).getTime();
    return dA - dB;
  });

  fs.writeFileSync('scripts/all-discovered-orders.json', JSON.stringify(found, null, 2));
  console.log('Saved to scripts/all-discovered-orders.json');
}

main().catch(console.error);
