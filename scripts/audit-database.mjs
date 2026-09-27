import fs from 'fs';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxRTYXQJAw0hGQUh12jHemUi87ROEftrUV5vAlJRr6JebH58PT13x7XdnudTeulAIS4/exec';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const dates = ['20260920', '20260921', '20260922', '20260923', '20260924', '20260925', '20260926', '20260927', '20260928'];
const idsToCheck = [];

for (const d of dates) {
  for (let i = 1; i <= 50; i++) {
    idsToCheck.push(`KYS-${d}-${String(i).padStart(4, '0')}`);
  }
}

async function fetchOrderWithRetry(id) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${GAS_URL}?action=order&id=${encodeURIComponent(id)}`);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json.success && json.data && json.data.order) {
          return json.data;
        }
        return null;
      } catch (e) {
        await sleep(500);
      }
    } catch (e) {
      await sleep(500);
    }
  }
  return null;
}

async function runPool(items, fn, concurrency = 6) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      const res = await fn(current);
      if (res) {
        console.log(`[ORDER FOUND] ${res.order['Order ID']} | ${res.order['Order Date'] || res.order['Created At']} | Customer: ${res.order['Full Name']} (${res.order['Mobile']}) | Amount: ₹${res.order['Grand Total']} | Method: ${res.order['Payment Method']} | PayStatus: ${res.order['Payment Status']} | OrdStatus: ${res.order['Order Status']}`);
        results.push(res);
      }
      await sleep(50);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log(`Starting scan of ${idsToCheck.length} candidate Order IDs...`);
  const orders = await runPool(idsToCheck, fetchOrderWithRetry, 6);

  console.log(`\nScan complete! Found ${orders.length} total orders.`);

  // Also fetch Products and Coupons
  console.log('\nFetching Products and Coupons...');
  const [prodRes, cpnRes] = await Promise.all([
    fetch(`${GAS_URL}?action=products`).then(r => r.json()).catch(() => null),
    fetch(`${GAS_URL}?action=coupons`).then(r => r.json()).catch(() => null)
  ]);

  // Sort orders by ID / Created At
  orders.sort((a, b) => {
    const numA = parseInt((a.order['Order ID'].match(/\d+$/) || [0])[0]);
    const numB = parseInt((b.order['Order ID'].match(/\d+$/) || [0])[0]);
    return numA - numB;
  });

  const reportData = {
    totalOrdersFound: orders.length,
    orders,
    products: prodRes ? prodRes.data : [],
    coupons: cpnRes ? cpnRes.data : []
  };

  fs.writeFileSync('scripts/complete-audit-data.json', JSON.stringify(reportData, null, 2));
  console.log('Saved all data to scripts/complete-audit-data.json');
}

main().catch(console.error);
