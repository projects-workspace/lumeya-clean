'use strict';

const { readText } = require('../lib/util');

function requirePattern(text, pattern, label, errors) {
  if (!pattern.test(text)) errors.push(label);
}

module.exports = {
  name: 'security',
  description: 'public request migration, browser config and bot notification boundary are present',

  run() {
    const errors = [];
    const warnings = [];
    const migration = readText('bot/migrations/0016_public_discovery_security.sql');
    const idempotencyMigration = readText('bot/migrations/0017_idempotent_public_discovery_requests.sql');
    const forms = readText('public-forms.js');
    const liveTest = readText('bot/tests/live-public-mvp.mjs');
    const auth = readText('auth.js');
    const config = readText('public-config.js');
    const bot = readText('bot/bot.js');
    const suggest = readText('suggest.html');

    requirePattern(migration, /ALTER TABLE public\.public_discovery_requests ENABLE ROW LEVEL SECURITY/i, 'request table RLS is not enabled', errors);
    requirePattern(migration, /REVOKE ALL PRIVILEGES ON TABLE public\.public_discovery_requests\s+FROM PUBLIC, anon, authenticated/i, 'browser table privileges are not revoked', errors);
    requirePattern(migration, /SECURITY DEFINER\s+SET search_path = ''/i, 'public request functions do not lock search_path', errors);
    requirePattern(migration, /GRANT EXECUTE ON FUNCTION public\.submit_public_discovery_request[\s\S]*TO anon, authenticated/i, 'insert-only RPC is not granted to browser roles', errors);
    requirePattern(migration, /claim_public_discovery_requests/i, 'atomic public request notification claim is missing', errors);
    requirePattern(migration, /FOR UPDATE SKIP LOCKED/i, 'notification claim is not concurrency safe', errors);
    requirePattern(migration, /request_fingerprint[\s\S]*INTERVAL '1 hour'/i, 'server-side request rate limit is missing', errors);
    requirePattern(migration, /expires_at[\s\S]*INTERVAL '90 days'/i, 'request retention boundary is missing', errors);
    requirePattern(migration, /REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated/i, 'legacy browser RPC revocation is missing', errors);
    requirePattern(migration, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.public_discovery_requests\s+TO service_role/i, 'service-role request queue privileges are not explicit', errors);

    requirePattern(idempotencyMigration, /ADD COLUMN IF NOT EXISTS request_idempotency_key UUID/i, 'private request retry key column is missing', errors);
    requirePattern(idempotencyMigration, /CREATE UNIQUE INDEX IF NOT EXISTS[\s\S]*request_idempotency_key[\s\S]*WHERE request_idempotency_key IS NOT NULL/i, 'request retry keys are not uniquely constrained', errors);
    requirePattern(idempotencyMigration, /ON CONFLICT \(request_idempotency_key\)[\s\S]*DO NOTHING/i, 'concurrent request retries are not serialized', errors);
    requirePattern(idempotencyMigration, /idempotency_key_conflict[\s\S]*ERRCODE = 'P0001'/i, 'changed request content under a reused key is not rejected generically', errors);
    requirePattern(idempotencyMigration, /CREATE OR REPLACE FUNCTION public\.submit_idempotent_public_discovery_request\([\s\S]*p_idempotency_key UUID[\s\S]*SECURITY DEFINER\s+SET search_path = ''/i, 'keyed request RPC does not require a private UUID with a fixed search_path', errors);
    requirePattern(idempotencyMigration, /REVOKE ALL ON FUNCTION public\.submit_idempotent_public_discovery_request\([\s\S]*FROM PUBLIC, anon, authenticated[\s\S]*GRANT EXECUTE ON FUNCTION public\.submit_idempotent_public_discovery_request\([\s\S]*TO anon, authenticated/i, 'keyed request RPC grants are not narrowly scoped', errors);
    requirePattern(idempotencyMigration, /submit_public_discovery_request_internal\([\s\S]*SECURITY INVOKER/i, 'request idempotency helper is not an invoker-only internal function', errors);
    requirePattern(idempotencyMigration, /p_request_type, p_subject, p_details, NULL, p_listing_type/i, 'legacy request RPC no longer delegates with its compatible signature', errors);
    if (/lumeya_submission_id/i.test(idempotencyMigration)) errors.push('retry keys must not be encoded into or persisted with source_page');
    if (/GRANT\s+[^;]*ON TABLE public\.public_discovery_requests[^;]*TO\s+(?:PUBLIC|anon|authenticated)/i.test(idempotencyMigration)) errors.push('retry migration grants direct private request-table access');
    requirePattern(forms, /const RPC_NAME = 'submit_idempotent_public_discovery_request'/, 'new public forms do not call the keyed request RPC', errors);
    requirePattern(forms, /p_idempotency_key: idempotencyKey/, 'new public forms do not send their stable retry key separately', errors);
    requirePattern(forms, /idempotencyKey: IDEMPOTENCY_PATTERN\.test\(idempotencyKey \|\| ''\) \? idempotencyKey : null/, 'request drafts do not persist a validated retry key', errors);
    requirePattern(forms, /if \(onlineRouteAvailable && !draftSaved\)[\s\S]*Nothing was sent/, 'online submission is not blocked when its retry key cannot be persisted', errors);
    requirePattern(forms, /showFallback\(form, request, \{ allowManualSend: false \}\)/, 'uncertain/conflicting retries expose a duplicate manual-send path', errors);
    requirePattern(readText('join.html'), /public-forms\.js\?v=4/, 'Join page does not load the current retry client', errors);
    requirePattern(suggest, /public-forms\.js\?v=4/, 'suggest page does not load the current retry client', errors);
    requirePattern(liveTest, /const PRODUCTION_REF = 'ccwvyjszlrrluzplizsu'/, 'live test production-ref guard is missing', errors);
    requirePattern(liveTest, /expectedRef === PRODUCTION_REF/, 'live test does not reject the known Production ref', errors);
    requirePattern(liveTest, /LUMEYA_TEST_SUPABASE_BRANCH_CONFIRMATION/, 'live test does not require explicit non-production branch confirmation', errors);
    requirePattern(liveTest, /hostMatch\[1\] !== expectedRef/, 'live test URL host is not bound to the confirmed branch ref', errors);
    if (/process\.env\.(?:SUPABASE_URL|SUPABASE_PUBLISHABLE_KEY|SUPABASE_SERVICE_ROLE_KEY)/.test(liveTest)) errors.push('live test can fall back to regular (possibly Production) Supabase credentials');

    const expectedProjectUrl = 'https://ccwvyjszlrrluzplizsu.supabase.co';
    const configuredProjectUrls = [auth, config]
      .flatMap((text) => text.match(/https:\/\/[a-z0-9-]+\.supabase\.co/gi) || []);
    if (configuredProjectUrls.some((url) => url !== expectedProjectUrl)) {
      errors.push('browser source contains a Supabase URL outside the confirmed Lumeya project');
    }
    if (/service[_-]?role/i.test(config.replace(/service-role[^\n]*/gi, ''))) {
      errors.push('public-config.js appears to contain a service-role value');
    }
    requirePattern(suggest, /public-config\.js[\s\S]*auth\.js/i, 'suggest.html does not load public config before auth', errors);
    requirePattern(bot, /if \(ctx\.from && !isPublicRequestFlow\(ctx\)\)/, 'Telegram public request flow can still create a profile', errors);
    requirePattern(bot, /startPublicRequestWorker\(\)/, 'public request admin notification worker is not started', errors);

    return { errors, warnings, info: { contractsChecked: 36 } };
  },
};
