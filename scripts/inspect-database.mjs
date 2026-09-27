import fs from 'fs';

let env = {};
if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  });
}

const gasUrl = env.NEXT_PUBLIC_GOOGLE_SHEETS_SCRIPT_URL || env.GOOGLE_SHEETS_SCRIPT_URL;
console.log('Using GAS URL:', gasUrl);

async function fetchGAS(action) {
  const res = await fetch(`${gasUrl}?action=${action}`);
  return await res.json();
}

async function run() {
  console.log('Fetching database data...');
  const [ordersRes, customersRes, productsRes, couponsRes] = await Promise.all([
    fetchGAS('getOrders'),
    fetchGAS('getCustomers'),
    fetchGAS('getProducts'),
    fetchGAS('getCoupons')
  ]);

  const orders = ordersRes.orders || ordersRes.data || (Array.isArray(ordersRes) ? ordersRes : []);
  const customers = customersRes.customers || customersRes.data || (Array.isArray(customersRes) ? customersRes : []);
  const products = productsRes.products || productsRes.data || (Array.isArray(productsRes) ? productsRes : []);
  const coupons = couponsRes.coupons || couponsRes.data || (Array.isArray(couponsRes) ? couponsRes : []);

  console.log(`\n=== SUMMARY OF RECORDS ===`);
  console.log(`Total Orders: ${orders.length}`);
  console.log(`Total Customers: ${customers.length}`);
  console.log(`Total Products: ${products.length}`);
  console.log(`Total Coupons: ${coupons.length}`);

  fs.writeFileSync('scripts/db-dump.json', JSON.stringify({
    orders,
    customers,
    products,
    coupons
  }, null, 2));

  console.log('\nDumped raw data to scripts/db-dump.json');
}

run().catch(console.error);
