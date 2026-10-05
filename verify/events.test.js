'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '../home-events.js'), 'utf8');

function provider(client, timeout = false) {
  const window = { supabaseClient: client };
  const calls = [];
  const document = { getElementById: () => null, addEventListener() {}, readyState: 'complete' };
  vm.runInNewContext(source, { window, document, URL, Date, Intl, AbortController, setTimeout: timeout ? fn => { queueMicrotask(fn); return 1; } : setTimeout, clearTimeout });
  return { window, calls, load: () => window.LumeyaEventsProvider.load() };
}
function clientFor(result, calls = [], delayed = false) {
  const query = {};
  for (const method of ['select', 'eq', 'gte', 'lte', 'order', 'limit']) query[method] = (...args) => { calls.push([method, ...args]); return query; };
  query.abortSignal = signal => delayed ? new Promise(resolve => signal.addEventListener('abort', () => resolve({ error: { message: 'aborted' } }), { once: true })) : Promise.resolve(result);
  return { from: table => { calls.push(['from', table]); return query; } };
}
test('event reads acquire the current client; unconfigured and valid empty are distinct', async () => {
  const p = provider(null);
  await assert.rejects(p.load(), /unconfigured/);
  p.window.supabaseClient = clientFor({ data: [], error: null }, p.calls);
  assert.deepEqual(Array.from(await p.load()), []);
  assert.ok(p.calls.some(call => call[0] === 'gte' && call[1] === 'start_time'));
  assert.ok(p.calls.some(call => call[0] === 'limit' && call[1] === 200));
});
test('query error, malformed response and deadline reject instead of reporting an empty schedule', async () => {
  await assert.rejects(provider(clientFor({ error: { message: 'unavailable' } })).load());
  await assert.rejects(provider(clientFor({ data: null, error: null })).load(), /response_invalid/);
  await assert.rejects(provider(clientFor({}, [], true), true).load());
});
test('only confirmed public future stored dates are returned; private/expired records and extra fields do not escape', async () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const past = new Date(Date.now() - 86400000).toISOString();
  const data = [
    { id: 'test-public', title: 'Synthetic dated event', type: 'public', status: 'confirmed', start_time: future, privateNotes: 'PRIVATE_EVENT_SENTINEL' },
    { id: 'test-private', title: 'Private', type: 'club', status: 'confirmed', start_time: future },
    { id: 'test-expired', title: 'Expired', type: 'public', status: 'confirmed', start_time: past },
  ];
  const events = await provider(clientFor({ data, error: null })).load();
  assert.equal(events.length, 1); assert.equal(events[0].id, 'test-public'); assert.ok(!JSON.stringify(events).includes('PRIVATE_EVENT_SENTINEL'));
});
