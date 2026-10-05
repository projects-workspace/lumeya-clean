# Lumeya public request service

This optional server keeps only the accepted public-request fallback and admin notification worker. It never creates profiles, roles, bookings, private content submissions or legacy project/calendar/reminder workflows. The fallback parser and request persistence/notification functions are retained from the accepted source. Starting the service performs external actions and requires separate authorization and a verified existing runtime.

Dependencies and locked versions remain in `package.json` and `package-lock.json`. No credentials, installed dependencies or running service were imported. Required server environment variable names are `BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_CHAT_ID`, and `PUBLIC_SITE_URL`; `PUBLIC_REQUEST_POLL_MS` defaults to 60000. Use the dedicated Lumeya project only. The publishable key is for browser calls; the service-role key is server-only.

The `public_request` start link accepts copied request text, stores a private request when possible and notifies the configured administrator. Receipt persistence and delivery remain distinct. The worker claims public requests through the existing RPC and records notification outcomes. No retention schedule is included. Actual worker execution/delivery remains unverified.

Migrations 0016/0017 are preserved byte-for-byte as accepted applied contracts. They rely on existing hosted schema; they are not a safe empty-database setup sequence. The retired mixed schema and earlier migration chain are intentionally absent. No migration ran during cleanup.

`npm run verify` from the root includes fake-client bot tests with no network. `test:public-mvp` remains the original guarded live harness for a separately authorized, positively confirmed existing isolated non-production branch; it refuses the known production ref and never falls back to regular environment credentials. Do not run it for this local cleanup or create a branch/service merely to test.

The accepted manual operator path remains [private receipt import and catalogue review](../docs/catalog-publishing.md). Current evidence is in [PROJECT_STATE.md](../PROJECT_STATE.md).
