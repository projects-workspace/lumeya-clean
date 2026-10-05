import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const PRODUCTION_REF = 'ccwvyjszlrrluzplizsu';
const url = String(process.env.LUMEYA_TEST_SUPABASE_URL || '').trim();
const publishableKey = String(process.env.LUMEYA_TEST_SUPABASE_PUBLISHABLE_KEY || '').trim();
const serviceRoleKey = String(process.env.LUMEYA_TEST_SUPABASE_SERVICE_ROLE_KEY || '').trim();
const expectedRef = String(process.env.LUMEYA_TEST_SUPABASE_BRANCH_REF || '').trim();
const confirmation = String(process.env.LUMEYA_TEST_SUPABASE_BRANCH_CONFIRMATION || '').trim();

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error('LUMEYA_TEST_SUPABASE_URL, LUMEYA_TEST_SUPABASE_PUBLISHABLE_KEY and LUMEYA_TEST_SUPABASE_SERVICE_ROLE_KEY are required.');
}
if (!/^[a-z0-9]{20}$/.test(expectedRef) || expectedRef === PRODUCTION_REF) {
  throw new Error('Set LUMEYA_TEST_SUPABASE_BRANCH_REF to an already verified isolated non-production branch ref.');
}
if (confirmation !== `I verified ${expectedRef} is an existing isolated non-production branch`) {
  throw new Error('Explicit branch confirmation is required after checking its type, parent and Production Branch in Supabase.');
}

let parsedUrl;
try { parsedUrl = new URL(url); }
catch { throw new Error('SUPABASE_URL must be the exact URL for the confirmed non-production branch.'); }
const hostMatch = /^([a-z0-9]{20})\.supabase\.co$/.exec(parsedUrl.hostname.toLowerCase());
if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password || parsedUrl.pathname !== '/' || parsedUrl.search || parsedUrl.hash ||
    !hostMatch || hostMatch[1] === PRODUCTION_REF || hostMatch[1] !== expectedRef) {
  throw new Error('Refusing live test: SUPABASE_URL does not match the confirmed non-production branch.');
}

const anon = createClient(url, publishableKey, { auth: { persistSession: false } });
const service = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const testToken = randomUUID();
const idempotencyKey = randomUUID();
const distinctKey = randomUUID();
const cleanupKeys = new Set();
const firstSubject = `Lumeya isolated idempotency check ${testToken.slice(0, 8)}`;
const firstDetails = 'Synthetic M3 retry verification. This private row is removed before the test exits.';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function payload(key, overrides = {}) {
  return {
    p_request_type: 'looking_for',
    p_subject: firstSubject,
    p_details: firstDetails,
    p_idempotency_key: key,
    p_listing_type: null,
    p_location: 'Prague',
    p_preference: 'in_person',
    p_contact: `verification-${testToken}@example.invalid`,
    p_reference_url: null,
    p_source_page: '/bot/tests/live-public-mvp.mjs',
    p_honeypot: null,
    ...overrides,
  };
}

let testFailure = null;
try {
  const schemaCheck = await service.from('public_discovery_requests').select('request_idempotency_key').limit(0);
  assert(!schemaCheck.error, 'request idempotency migration is not available on the confirmed branch');
  cleanupKeys.add(idempotencyKey);
  cleanupKeys.add(distinctKey);

  const first = await anon.rpc('submit_idempotent_public_discovery_request', payload(idempotencyKey));
  assert(!first.error, 'first valid idempotent submission failed');
  const firstId = first.data;
  assert(typeof firstId === 'string' && /^[0-9a-f-]{36}$/i.test(firstId), 'first idempotent submission returned no safe receipt');

  const retry = await anon.rpc('submit_idempotent_public_discovery_request', payload(idempotencyKey));
  assert(!retry.error && retry.data === firstId, 'exact retry did not return the original receipt');

  const changed = await anon.rpc('submit_idempotent_public_discovery_request', payload(idempotencyKey, {
    p_details: 'Changed synthetic content reusing the original idempotency key.',
  }));
  assert(changed.error?.code === 'P0001' && changed.error?.message === 'idempotency_key_conflict', 'changed content under the same key was not rejected safely');

  const distinct = await anon.rpc('submit_idempotent_public_discovery_request', payload(distinctKey));
  assert(!distinct.error && typeof distinct.data === 'string' && distinct.data !== firstId, 'distinct submission did not persist separately');

  const firstStored = await service.from('public_discovery_requests')
    .select('id,request_idempotency_key,subject,details,contact')
    .eq('request_idempotency_key', idempotencyKey);
  assert(!firstStored.error && firstStored.data?.length === 1, 'first key did not persist exactly one row');
  assert(firstStored.data[0].id === firstId && firstStored.data[0].subject === firstSubject &&
    firstStored.data[0].details === firstDetails && firstStored.data[0].contact === `verification-${testToken}@example.invalid`,
  'same-key conflict changed the original private row');

  const distinctStored = await service.from('public_discovery_requests')
    .select('id,request_idempotency_key')
    .eq('request_idempotency_key', distinctKey);
  assert(!distinctStored.error && distinctStored.data?.length === 1 && distinctStored.data[0].id === distinct.data,
    'distinct retry key did not produce one separate row');

  const directRead = await anon.from('public_discovery_requests').select('id').eq('id', firstId);
  assert(directRead.error, 'anonymous role could read private request rows');

  const invalidKey = randomUUID();
  cleanupKeys.add(invalidKey);
  const invalid = await anon.rpc('submit_idempotent_public_discovery_request', payload(invalidKey, { p_subject: 'x' }));
  assert(invalid.error, 'invalid request was accepted');
  const invalidStored = await service.from('public_discovery_requests')
    .select('id').eq('request_idempotency_key', invalidKey);
  assert(!invalidStored.error && invalidStored.data?.length === 0, 'invalid request created a row');

  const legacyRpc = await anon.rpc('get_profile_by_telegram_id', { p_telegram_id: 1 });
  assert(legacyRpc.error, 'anonymous role could execute a dormant identity RPC');

  const events = await anon.from('events').select('id,type,status');
  assert(!events.error, 'public events read failed');
  assert((events.data || []).every((row) => row.type === 'public' && row.status === 'confirmed'), 'public events read returned a non-public or unconfirmed row');

  const services = await anon.from('services').select('id,type,status');
  assert(!services.error, 'public services read failed');
  assert((services.data || []).every((row) => row.type === 'public' && row.status === 'published'), 'public services read returned a non-public or unpublished row');

  console.log('live-public-mvp: PASS (non-production idempotency, private-row boundary, invalid-input rejection, events/services reads)');
} catch {
  testFailure = new Error('live-public-mvp failed; remote diagnostic details were redacted');
} finally {
  let cleanupFailed = false;
  try {
    const keyList = [...cleanupKeys];
    if (keyList.length) {
      const cleanup = await service.from('public_discovery_requests')
        .delete()
        .in('request_idempotency_key', keyList);
      const remaining = await service.from('public_discovery_requests')
        .select('id')
        .in('request_idempotency_key', keyList);
      if (remaining.error || remaining.data?.length) cleanupFailed = true;
      if (cleanup.error && (remaining.error || remaining.data?.length)) cleanupFailed = true;
    }
  } catch {
    cleanupFailed = true;
  }
  if (cleanupFailed) {
    console.error('live-public-mvp cleanup failed; remove only this isolated synthetic test row set before rerunning');
    process.exitCode = 1;
  }
}
if (testFailure) throw testFailure;
