import { chromium } from '@playwright/test';

const API = 'http://localhost:3000';
const APP = 'http://localhost:3035';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function ensureUser(name, email, password, ownerToken, role) {
  let r = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (r.status !== 200) {
    await api('/auth/register', { method: 'POST', body: { name, email, password, phone: '+380000000000' } });
    r = await api('/auth/login', { method: 'POST', body: { email, password } });
  }
  if (r.status !== 200) throw new Error(`login ${email} -> ${r.status} ${JSON.stringify(r.data)}`);
  let { accessToken, user } = r.data;
  if (role && user.role !== role) {
    const p = await api(`/users/${user.id}/role`, { method: 'PATCH', token: ownerToken, body: { role } });
    if (p.status !== 200) throw new Error(`set role ${email} -> ${p.status} ${JSON.stringify(p.data)}`);
    r = await api('/auth/login', { method: 'POST', body: { email, password } });
    accessToken = r.data.accessToken;
    user = r.data.user;
  }
  return { token: accessToken, user };
}

async function fillIon(page, sel, value) {
  const ion = page.locator(sel).first();
  await ion.waitFor({ state: 'visible', timeout: 10000 });
  const input = ion.locator('input, textarea').first();
  await input.fill(value);
}

async function main() {
  const results = [];
  const check = (name, ok, extra = '') => {
    results.push({ name, ok });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  :: ' + extra : ''}`);
  };

  // health
  const h = await api('/health');
  if (h.status !== 200) throw new Error('backend /health not ok');

  const owner = await ensureUser('Owner Test', 'owner@test.com', 'owner123', null, 'owner');
  const courier = await ensureUser('Courier Test', 'courier.chat@test.com', 'courier123', owner.token, 'courier');
  const customer = await ensureUser('Customer Chat', 'customer.chat@test.com', 'customer123', owner.token, 'customer');

  // product
  const prods = await api('/products');
  const list = Array.isArray(prods.data) ? prods.data : prods.data.products;
  const product = list[0];
  if (!product) throw new Error('no products');
  check('catalog has products', Boolean(product.id), product.name);

  // order by customer
  const created = await api('/orders', {
    method: 'POST',
    token: customer.token,
    body: {
      deliveryType: 'delivery',
      address: 'вул. Хрещатик 1, Київ',
      phone: '+380671112233',
      paymentType: 'cash',
      items: [{ productId: product.id, quantity: 1 }],
    },
  });
  if (created.status !== 201) throw new Error(`order create -> ${created.status} ${JSON.stringify(created.data)}`);
  const orderId = created.data.id;
  check('order created', Boolean(orderId), orderId.slice(0, 8));

  // customer sends a chat message
  const msg = await api(`/chats/order/${orderId}/messages`, {
    method: 'POST', token: customer.token, body: { text: 'Привіт, чекаю курʼєра 🙂' },
  });
  check('customer can post chat message', msg.status === 201, String(msg.status));

  // advance to ready
  for (const s of ['paid', 'cooking', 'ready']) {
    const r = await api(`/orders/${orderId}/status`, { method: 'PATCH', token: owner.token, body: { status: s } });
    if (r.status !== 200) throw new Error(`status ${s} -> ${r.status} ${JSON.stringify(r.data)}`);
  }
  check('order advanced to ready', true);

  // baseline: courier reading before assignment = 403 (documents the old bug)
  const beforeTake = await api(`/chats/order/${orderId}/messages`, { token: courier.token });
  check('pre-take chat read is 403 (backend guard)', beforeTake.status === 403, String(beforeTake.status));

  // browser flow
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const chatCalls = [];
  page.on('response', (res) => {
    const u = res.url();
    if (u.includes(`/chats/order/${orderId}`)) chatCalls.push({ url: u.replace(API, ''), status: res.status() });
  });

  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await sleep(500);
  await fillIon(page, '.auth-box:visible ion-input >> nth=0', 'courier.chat@test.com');
  await fillIon(page, '.auth-box:visible ion-input >> nth=1', 'courier123');
  await page.locator('ion-button:visible', { hasText: 'Увійти' }).first().click();
  await page.waitForURL(/\/courier/, { timeout: 15000 });
  await sleep(800);

  await page.goto(`${APP}/courier/orders/${orderId}`, { waitUntil: 'networkidle' });
  await sleep(1200);

  const callsAfterOpen = chatCalls.length;
  check('no chat request fired while order still unassigned', callsAfterOpen === 0, `calls=${callsAfterOpen}`);

  const takeBtn = page.locator('ion-button:visible', { hasText: 'Взяти в доставку' }).first();
  await takeBtn.waitFor({ state: 'visible', timeout: 10000 });
  await takeBtn.click();
  await sleep(1500);

  const afterTakeCalls = chatCalls.slice(callsAfterOpen);
  const chatAfterTake = afterTakeCalls.find((c) => c.url.includes('/messages'));
  check(
    'chat thread loads 200 after taking the order',
    chatAfterTake?.status === 200,
    JSON.stringify(afterTakeCalls),
  );

  const bubbles = await page.locator('.bubble:visible').count();
  check('customer message visible to courier', bubbles >= 1, `bubbles=${bubbles}`);

  const deliveredBtn = page.locator('ion-button:visible', { hasText: 'Доставлено' }).first();
  check('delivered button available after take', await deliveredBtn.isVisible().catch(() => false));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(2);
});
