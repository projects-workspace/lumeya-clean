# Lumeya release verification

Lumeya's public frontend remains static HTML, CSS and vanilla JavaScript. The
repository-level verification layer uses Node.js standard-library APIs only;
there is no frontend build or test dependency installation step.

## Prerequisites

- Node.js 18 or newer.
- No Supabase, Telegram or Vercel credentials.
- Git is recommended for the secret scan so ignored local environment files
  are not read.

## Commands

Run the complete local and CI gate:

```sh
npm run verify
```

The complete command includes a temporary HTTP server bound to
`127.0.0.1`. In a restricted sandbox that forbids local port binding, run the
deterministic non-network portion instead:

```sh
npm run verify:static-only
```

The full HTTP smoke check must still pass in CI or another environment that
allows a loopback listener before release.

Individual checks are also available:

```sh
npm run verify:pages
npm run verify:links
npm run verify:assets
npm run verify:js
npm run verify:static
npm run verify:mvp
npm run verify:journey
npm run verify:security
npm run verify:secrets
npm run verify:smoke
```

Every command exits with status 0 only when its selected checks pass.

## Release contract

| Check | Enforced contract |
| --- | --- |
| `pages` | Every registered public and account HTML file exists and is non-empty. The Public Discovery registry includes `map.html`, `about.html`, and `suggest.html`. Unregistered root HTML is reported. |
| `links` | Local HTML and JavaScript page references exist. Pure and cross-page fragments must resolve to an actual target ID. External URLs are intentionally not fetched. |
| `assets` | Referenced local scripts, styles, media and CSS `url()` assets exist. |
| `js` | Root frontend scripts, bot scripts and inline page scripts parse with `node --check`; application code is not executed. |
| `static` | Every HTML file has its required document markers. Unbalanced `script`, `style`, or `div` tags are release failures. |
| `mvp` | Public pages declare English, core pages expose exactly Discover, Services, Practitioners, Map, Events and About in primary navigation, required discovery scripts are connected, legacy/account/language controls are not visible in the core shell, the map has Leaflet resources, the suggestion page has a form, and every new-tab link has a safe `rel`. |
| `journey` | The factual Deep Massage → Ivan → Santiago Studio → request slice has symmetric relationships and working local routes; conceptual places and synthetic map coordinates are rejected. |
| `security` | Browser configuration has no hard-coded Supabase project, the request migration exposes only the narrow RPC, legacy RPCs are revoked, rate/retention controls exist, and the no-account Telegram/admin-notification path is connected. |
| `secrets` | Tracked and unignored source text is scanned for a small set of obvious private-key, provider-token, bot-token and privileged literal-assignment patterns. Values are never printed. |
| `smoke` | Every expected page and key public asset returns HTTP 200 with the expected content type from a local static server. |

The contract and page/script registries live in `verify/config.js`. Product
changes that add or replace a required public page must update that registry in
the same change.

The current integration contract requires `discovery-data.js` on catalog and
profile surfaces, `profile-enhancements.js` plus the profile data hooks on each
practitioner page, and `public-forms.js` on the public suggestion page. The
legacy identity-dependent `submission-requests.js` is intentionally excluded
from the public deployment and must not be referenced by HTML.

## Continuous integration

`.github/workflows/verify.yml` runs `npm run verify` on every push and pull
request with read-only repository permissions. The project has no root runtime
dependencies, so CI intentionally does not run `npm install`.

## Deployment boundary

`.vercelignore` keeps the static-site deployment separate from the bot,
environment files, documentation, verification tooling, agent configuration,
accidental legacy folders and unused source videos. Only the two videos still
referenced by the public site are included. This boundary complements—but does
not replace—secret scanning and production environment review.

## Deliberate limitations

- These checks do not contact Supabase, Telegram, Vercel or arbitrary external
  links.
- Syntax and source contracts do not prove browser behavior, accessibility,
  responsive layout, network requests, RLS/RPC behavior or successful form
  delivery.
- The secret scan is heuristic and cannot prove that repository history or
  external deployment configuration is clean.
- Final release verification still requires browser QA, online/offline form
  tests, Supabase security checks, preview-deployment HTTP checks, and
  post-deploy production checks.

For the M3 live database contract, first identify an already-existing Lumeya
branch and verify its exact ref, branch type, parent and Production Branch in
Supabase. Apply only migration 0017 to that isolated non-production branch; do
not reset/replay the legacy migration chain. Then use branch-scoped credentials
and run the disposable contract from `bot/`:

```sh
npm run test:public-mvp
```

The test-specific `LUMEYA_TEST_SUPABASE_*` URL, publishable key, service-role
key, branch ref and explicit confirmation must all identify that branch. The
script rejects the known Production ref and a mismatching URL host, and removes
rows only by its fresh synthetic keys. Never run it against Production or
another ecosystem project.

## M2 focused checks

`npm run verify:editorial` uses Node's existing test runner, temporary public fixture roots and private mode-700 directories. It tests real filesystem/HTTP persistence and subprocess restart, exact retry deduplication, clarification/rejection/approval gates, reviewed corrections, stale-edit refusal, interrupted publication regeneration, private-field rejection, CLI output privacy, anonymous HTTP denials and event-reader error/empty/unconfigured paths. Fixtures never write to live services or the repository's public catalogue. Deterministic event-client fixtures prove code behaviour only; they do not prove Supabase or worker integration. The full `npm run verify` includes these focused checks before the existing release gate. Loopback HTTP tests require an environment that allows local port binding.

## MVP demo and tester guide — accepted Production scope (2026-10-01)

### Four-minute demonstration

Use https://lumeya-wellbeing-discovery.vercel.app. Final accepted release `80bb8f6` is Ready/Current; Join returns 200, private keyed receipt persistence is verified and Events shows a valid empty upcoming schedule. The operator workflow is manual private export/import/review/publication. A saved receipt confirms persistence; automatic Telegram delivery and scheduled deletion are post-MVP limitations.

1. **0:00–1:00 — Search for Lila.** Open Services, search Lila and read scope/status/provider/location/price/duration. Missing price/duration and by-arrangement availability remain explicit; do not infer dates, outcomes or qualifications.
2. **1:00–2:00 — Check provider/contact.** Open Violetta's published profile and show the `https://t.me/violettablago` contact action. The final smoke verified this route without sending a message. Identity, qualifications and current availability are not independently confirmed.
3. **2:00–3:00 — Follow the contextual request.** Search Deep Massage & Tea Ceremony, use its request action and confirm the topic, Prague and in-person preference prefill. Explain that it reaches the Lumeya operator for review, not a confirmed booking or direct practitioner message. A successful UUID is a private receipt, not notification delivery.
4. **3:00–4:00 — Explain review and events.** Show the deployed Join form and its explicit approval/correction boundary, then Events' empty schedule and separate undated formats. Suggestions do not publish records or authenticate providers. The accepted operator CLI requires source/identity evidence and approval of the exact review hash.

### Tester instructions and feedback route

Reuse this guest journey on desktop/mobile. Final hosted coverage used Chromium at 1512×805 and 375×812; other browser compatibility is not claimed by that result. Check search/category/no-match behavior, recipient/next-step copy, menu Enter/Escape/focus return, the keyboard skip link, and horizontal overflow. Submit only real public information through Join; do not invent a provider for a Production test.

For feedback use the existing `suggest.html#looking-for` route with topic **Lumeya MVP feedback**, page/action/expected/observed result and device/browser details. The form requires a reply contact. Do not include medical histories, client records, credentials, financial data or another person's contact. Preserve the same retry key for uncertain receipts and ask the operator to check before manual resending. Copying/opening Telegram alone sends nothing; follow-up is manually operated and no immediate delivery is promised.

### Historical pre-release evidence and blockers — 2026-09-30### Limitations and release blockers

- The current hosted site is older than local M2. `join.html` returns 404; the hosted Events page says the source is not connected and emitted no Events REST request in the browser. Mapped Chrome Profile 17 read-only dashboard access confirmed Production Branch `main`, a connected Git repository, Ready production commit `eb0fda8`, and the primary domain. Vercel API listing returned 403 and no Vercel CLI is installed; the mapped Chrome route exposed the project settings, connected repository, production branch and current deployment.
- The local M2 editorial queue is not a hosted operator handoff. Supabase management connector reads are denied; no valid request RPC was invoked. OpenAPI introspection returned 401; a no-argument GET returned PGRST202, which is not an RPC execution test. A public GET of `public_discovery_requests` returned 401/PGRST42501, confirming anon read denial on that endpoint. A public Events read returned 200/empty.
- The last observed hosted request RPC is pre-0017 and inserts a new row for every valid call. Its IP/user-agent fingerprint provides rate limiting, not content idempotency, so a hosted same-payload retry can create a second request and notification. This is historical hosted evidence; no hosted RPC was called in the current pass. The M3 form has not been exercised against a valid hosted RPC. Supabase management calls, including branch listing, returned permission errors; no existing non-production test target was confirmed.
- The bot requires a running process, service-role environment, `BOT_TOKEN` and `ADMIN_CHAT_ID`. Repository source documents a polling worker and 90-day expiry function, but no current worker uptime, admin delivery or retention schedule is verified. No service-role environment value was read.
- The existing Lila record is suitable as the sole sourced presentation example; its profile/contact match project-supplied information and the public Telegram page exists, but identity, qualification, availability and outcomes are not independently verified. Other ecological/craft service content is missing. The map has no verified pins and the live scheduled-event list was empty at the time of the check. No accounts, booking, payment, certification or personal workspace are included in this MVP.

No hosted form submission, Telegram message, migration, deployment or release-triggering push ran during the current pass. [Vercel documents automatic deployments for connected Git pushes](https://vercel.com/docs/git); the mapped project settings confirm `main` as Production Branch. Pushing the current M2 candidate there would publish it. At that earlier checkpoint, remote tracking recorded M1-era `eb0fda8` and local M2 was at `b86d2fd`; this is not a fresh remote Git SHA check. M3 remains pending until the hosted schema is checked, 0017 is applied through an authorized path, hosted retries are safely verified, operator delivery/retention are verified, Production release is explicitly authorized, and the resulting production URL is checked on desktop and mobile.

## M3 accepted local SQL checkpoint — 2026-10-01

The retry defect has a local implementation candidate. Additive migration
`bot/migrations/0017_idempotent_public_discovery_requests.sql` adds a private
nullable UUID key and partial unique index, keeps request-fingerprint rate
limiting separate, and preserves the legacy ten-argument RPC. New forms call
`submit_idempotent_public_discovery_request`; exact same-key/content retries
return the first receipt, changed content under that key is rejected with a
generic conflict, and a distinct key creates a separate request. The key is
stored in the private request row and browser draft, not in `source_page`, the
public catalogue or operator notification text. The client blocks online sends
when browser storage cannot preserve a retry key across reloads; when a receipt
is uncertain it retries with that key and suppresses the manual Telegram-send
option until an operator checks for the first receipt.

The actual 0017 SQL was executed in two isolated databases inside the already
running local Supabase PostgreSQL 17.6 container; both were created for this
pass and dropped afterward. Each used a minimal pre-0017 schema reconstructed
from the request-table definition in migration 0016, with the Supabase `anon`,
`authenticated` and `service_role` roles already present. The primary test
database also had one synthetic legacy row inserted before 0017. This was not a
replay of the old migration chain and does not establish that the hosted schema
matches the reconstructed baseline.

SQL assertions passed for the migration and partial unique index; sequential
same-key calls in separate committed anonymous sessions returning one receipt
and one row; two overlapping anonymous RPC sessions returning a matching receipt;
changed content returning only `idempotency_key_conflict` with no error detail
or hint and leaving the original row intact; distinct keys creating separate
rows; and the separate fingerprint limit admitting five distinct keys and
rejecting the sixth. The pre-existing synthetic legacy row retained its
values and a null retry key. Two calls through the legacy ten-argument RPC
remained callable and produced separate rows. `anon` and `authenticated` could
not read or directly update the private table; catalog and ACL checks confirmed
the two public RPC grants only for `anon`/`authenticated`, no `PUBLIC` execute
grant, an unexposed internal function, the expected definer/invoker modes, and
empty function search paths. The retry-key column had no browser-role read
grant. Temporary concurrency instrumentation and both disposable databases
were removed after the checks.

Source review of `public-forms.js` confirmed that forms call only the keyed RPC.
If it is unavailable, the error path reports an unconfirmed receipt, keeps the
same retry key, and withholds manual Telegram sending; it does not call the
legacy duplicate-prone RPC or report a saved receipt. This was a code-path
review, not a hosted or browser execution with 0017 absent.

No hosted database was read or changed during the local SQL pass. The earlier hosted access
limitations remain as recorded in the release-blocker notes above; an isolated
cloud branch is optional and must not be created for this work. The existing hosted-write harness requires an already existing, positively verified non-production target
and scoped test credentials. A controlled Production check instead needs separate explicit authorization for synthetic requests, any worker messages and cleanup, as recorded in the existing plan. Before any frontend activation, verify that the
hosted table matches the current 0016-compatible column, constraint, RLS and
grant contract and that the legacy ten-argument RPC is present. Apply only
migration 0017 through an authorized path; if the schema differs, stop rather
than replaying older migrations. Verify the hosted RPC before publishing the
client. If the RPC is missing or fails, keep the existing unavailable/contact behavior and do not
fall back to the legacy RPC. For rollback, disable online intake using the
existing empty runtime configuration; retain the M3 keyed forms during disable/rollback. Reverting intake code to pre-M3 restores
the duplicate-prone legacy endpoint and loses retry-aware manual-send safeguards. Leave the additive migration and existing
data intact; do not remove the retry key or index to work around a client problem.
The exact disable route and release order are in the existing milestone plan. Hosted receipt behavior,
worker delivery/failure handling, the 90-day cleanup schedule and deployment
remain unverified. M3 remains pending and no Production release ran.

## Earlier incomplete hosted read-only attempt — 2026-10-01

Historical attempt; its access/unknown findings are superseded by the resumed checkpoint below.

The current turn metadata reports `gpt-6.1-sol` with `high` effort. HEAD was
`28e6513`; M1/M2 and the local SQL checkpoint were preserved without rerunning
their suites. No database mutation, private-row read, mutation-function call,
form submission, Telegram message, push or deployment occurred.

The Mac was unlocked. The existing mapped Supabase Chrome profile entered a
named native Full Screen window; the live Supabase account menu matched the
private mapping, and the overview identified Lumeya's exact
`ccwvyjszlrrluzplizsu` ref and `main / PRODUCTION`. It reported Healthy,
NANO compute and “No migrations.” These are routing/overview facts; they do not
prove the request table or functions. After the user foregrounded Functions,
the unfiltered public-schema list showed `submit_public_discovery_request` with
the existing ten-text-argument signature returning UUID, and the claim and expiry
functions, all as Definer. It showed neither the keyed RPC nor the internal
helper. A function metadata panel exposed only fragments of the legacy body;
no function value was edited or saved. The new-client endpoint requirement is
therefore incompatible with the observed hosted function list. The underlying
table compatibility for migration 0017 remains **unknown**.

Native page/definition capture continued to fail after navigation, and the
extension API could not load its request-header policy. The SQL Editor's
current save mode could not be verified. Supabase's dated
[2025 save-behavior discussion](https://github.com/orgs/supabase/discussions/39793)
describes automatic snippet saving and a manual-saving proposal; it is not
proof of this account's current mode. No SQL was entered, run or saved, so no
snippet-persistence side effect was introduced. Previously denied Supabase
connector operations were not repeated. Required columns/constraints/indexes,
complete RPC definitions/owners/ACLs, RLS/policies/search paths, migration
history and retention jobs remain unread. No local SQL compatibility change is
supported by the evidence.

Public GETs to `https://lumeya-wellbeing-discovery.vercel.app` confirmed:

| Resource | Current result |
| --- | --- |
| Homepage, Services and Events HTML | HTTP 200; SHA-256 byte comparisons matched local `eb0fda8`, not current HEAD |
| `discovery-data.js`, `services.js`, `public-forms.js` | HTTP 200; byte comparisons matched `eb0fda8`; the form script contains no keyed RPC |
| `auth.js` | HTTP 200; matches both `eb0fda8` and current HEAD |
| `join.html` | HTTP 404 |
| Current Services/Events assets | `discovery-data.js?v=1`, `services.js?v=4`, `events.js?v=4` |

These public reads establish served content, not the deployment's exact Git SHA,
Production Branch setting or Events execution. No new Events REST query or
rendered Events behavior was proven; the earlier empty API result remains dated.
The mapped Vercel profile's native Full Screen window opened the exact project
overview, but its body was likewise unreadable. A direct alias deployment lookup
returned connector “Deployment not found,” although the public alias serves
HTTP 200. The exact-project tool has conflicting `projectId`/`idOrName`
validation requirements and produced no metadata. No denied project-list call
was repeated. The last dashboard evidence for Production Branch `main` and SHA
`eb0fda8` remains the 2026-09-30 observation.

Worker **source** is present: polling starts after successful `bot.launch()`,
defaults to 60 seconds, claims 20 rows and records notification success/failure;
the migration caps claims at eight. Worker **configuration** and **execution**
were not established: no bot-host/runtime mapping or scheduler manifest is
configured in the inspected repository, the static Vercel boundary excludes
`bot/`, and the GitHub workflow runs verification only. Existing local Node
processes could not be identified as the bot from the safe process evidence.
The retention RPC exists in source with a service-role-only grant and 90-day
expiry; no repository caller/schedule was found. The hosted claim and expiry
function names/Definer modes were read, but their full definitions and grants
were not. Worker deployment/delivery, active retention scheduling and actual
execution remain unverified.
No local environment secrets were read and no process or cleanup was started.

The [existing milestone plan](superpowers/specs/2026-05-13-platform-next-work-plan.md#next-unfinished-work-and-release-sequence)
is the single procedural release handoff. Hosted compatibility reads remain the
next unfinished step. The user's foreground action restored a partial Functions
read. The remaining access action is to restore this chat's existing Chrome
browser-control connection/request-header-policy loading, preserving the same
mapped accounts and permissions, so stable metadata reads can resume.

## Resumed hosted read-only compatibility and release handoff — 2026-10-01

Starting HEAD was `6aeae52`. Existing mapped Chrome profiles, named native Full Screen windows and live Supabase/Vercel identity/resource checks succeeded after the user's explicit retry request. This recovered the required reads; it does not prove that the separate Chrome incident was globally repaired. Two catalog-only SQL transactions used `BEGIN READ ONLY` and returned `transaction_read_only = on` on Lumeya `ccwvyjszlrrluzplizsu`, main Production, PostgreSQL 17.6. No private request rows/counts, credentials or mutation-function calls were read/executed. One auxiliary query initially hit a syntax error from partial editor draft replacement; select-all/delete cleared it and the corrected catalog query succeeded. Save was never clicked. The unsaved draft was explicitly discarded, with no remaining untitled draft/unsaved indicator and private snippet count unchanged at six.

| Scoped catalog check | Observed result |
| --- | --- |
| Request table | 20 columns with expected types/nullability/defaults; postgres owner; ordinary table |
| Constraints/indexes | 16 validated constraints (15 checks plus primary key); four valid baseline indexes |
| Legacy, claim and expiry functions | Expected signatures; normalized bodies match current 0016 source; postgres owner, Definer, empty search paths |
| Legacy RPC execution | postgres/service_role/anon/authenticated; no PUBLIC grant |
| Claim/expiry execution | postgres/service_role only; browser roles denied |
| RLS/table/column access | RLS enabled, FORCE RLS false, no policies; browser roles have no table/column read or direct-write grants and no SUPER/BYPASSRLS |
| Public schema/triggers | No browser/server-role CREATE grant; PUBLIC has USAGE only; no user triggers on request table |
| 0017 objects | Keyed RPC/helper, retry column and partial unique index absent |
| Migration history | Schema and table absent, correcting the earlier empty-table description |
| Privileged defaults | service_role table privileges include CRUD plus TRUNCATE/REFERENCES/TRIGGER/MAINTAIN; postgres function defaults grant service_role execution |
| Retention scheduling | pg_cron extension and cron tables absent; mapped Vercel Cron Jobs enabled but no configured jobs |

Normalized comparisons remove SQL comments/whitespace. Full scoped definitions were inspected; legacy/claim/expiry normalized body digests matched source (`b3460bdd`, `f3e6b511`, `6aa96eb0`). Column/type/nullability comparisons and constraint/index validity checks passed. **Classification: compatible prerequisites for applying only 0017.** This is not full production-schema/legacy-chain equivalence or hosted retry execution evidence. New functions may inherit service_role execution; replacing the legacy function retains its ACL. Browser/Public helper access must remain denied. No SQL/client fix was warranted; the candidate was preserved.

Mapped Vercel project `lumeya` / `prj_Iwc9kpFxjbxfItBYjnD2SeKfkuAQ` in Our Projects matches local `.vercel/project.json`. Its Ready Production deployment is `W2XnNg4MpvirVZ39AiC5KEBL7fK6`, SHA `eb0fda82ff7ba35bb53daf74f353244daeff3ee5`, created Aug 31 from `codex/lumeya-public-mvp-rc`. The current overview names `main` for Production updates; RC is listed as Preview. Connected-repository display is `projects-workspace/lumeya`, matching local SSH origin; historical links retain the legacy name. No settings changed. Production alias `https://lumeya-wellbeing-discovery.vercel.app` freshly returned homepage/Services 200 with bytes matching the deployed SHA, and Join 404. Earlier seven-asset checks remain dated evidence; no fresh Events execution or remote Git-head lookup occurred.

Hosted worker/expiry definitions and grants are verified, with batch default 20, SKIP LOCKED claims, 15-minute reclaim and eight-attempt cap. Actual bot hosting, uptime, Telegram delivery and any external retention caller/execution remain unknown. No bot process, notification or cleanup started. An expiry timestamp does not prove scheduled deletion.

The existing rollout plan records completed prerequisites and the next separately authorized step: apply only 0017, verify ACL/index/PostgREST visibility, then authorize controlled receipts/delivery/cleanup and frontend release. The existing live harness rejects Production and requires a confirmed existing non-production target; it is optional and no new branch is assumed. Disable via empty shared runtime configuration while retaining M3 keyed forms and keys; do not roll intake back to legacy code. Missing-RPC behavior remains source-reviewed only. M1/M2 and prior local SQL/catalog/editorial/full verify results were retained without rerunning unchanged suites. This resumed pass changed documentation only; scoped whitespace and local Markdown-link target checks passed; the historical May plan was preserved byte-for-byte. No remote write, submission, migration application, Telegram message, push or deployment ran. M3 hosted end-to-end acceptance remains pending.

## Authorized Production application, release and bounded E2E — 2026-10-01

The user authorized only migration 0017 in Production, the current frontend release and necessary bounded hosted E2E without new services/features. Current turn metadata reports `gpt-6.1-sol` / `high`. M1/M2 and the accepted local SQL reconstruction tests were retained. No runtime, cloud branch, paid API, account or credential was created/extracted.

### Backend application

Fresh read-only catalog metadata matched the prior scoped prerequisite snapshot exactly. The existing mapped Profile 1 owned Full Screen window and Lumeya `ccwvyjszlrrluzplizsu`, `main / Production`, were verified. The complete repository 0017 text was entered in the existing SQL Editor; length 10,663 bytes and a whole-text comparison digest `360fb2b6` matched the local file before Run. The transaction completed with Success. No rows returned. Only 0017 DDL ran; no old chain replay, reset or other function/schema addition occurred. SQL Editor execution does not register a CLI migration-history entry; the history schema/table were absent beforehand.

Post-application read-only checks found 21 columns and five valid indexes, including the nullable UUID key and partial unique retry index. The keyed/legacy RPCs are postgres-owned Definer functions with empty search paths and postgres/service_role/anon/authenticated execution. The internal helper is Invoker with an empty path and postgres/service_role execution only. No PUBLIC execution grant appeared. Browser table/column CRUD remained denied and RLS remained enabled without policies; claim/expiry definitions and restricted grants were retained.

### Real hosted calls and receipt persistence

A temporary local Node script reused only the existing public config/publishable key and a marked synthetic user-agent/contact set; it did not read bot secrets or weaken the existing non-production harness. A sandbox DNS failure occurred before any call, then the authorized network path succeeded. Actual PostgREST results:

| Check | Result |
| --- | --- |
| First keyed request / exact sequential retry | HTTP 200; same UUID receipt |
| Same key, changed payload | HTTP 400, P0001/idempotency_key_conflict; no detail/hint; original intact |
| Distinct key / simultaneous same-key calls | Separate receipt / both concurrent calls returned one matching receipt |
| Legacy ten-argument call | HTTP 200; one compatible legacy row with null retry key |
| Separate fingerprint rate limit | Five requests admitted; sixth rejected with rate_limited |
| Invalid subject | HTTP 400/invalid_subject; no extra row |
| Anonymous private read / direct update / helper | HTTP 401/42501 for each |
| Exact synthetic database inspection | Five API rows, four unique non-null keys, one legacy row; original payload intact; expiry defaults exactly 90 days |

One additional production browser request was submitted through the published Deep Massage → Ivan Protinyak → Santiago Studio → request route, with an explicitly synthetic topic/details and an example.invalid reply contact. The UI confirmed a saved receipt; an exact UUID/contact-filtered database read found one corresponding row and the unchanged payload. This is browser → PostgREST → persisted database evidence, not proof of operator delivery. All six synthetic rows were pending/unclaimed with zero notification attempts; the API rows were observed at approximately 640 seconds old and the browser row at 197 seconds old. No worker host/process was identified or started, no separate Telegram message was sent, and no broad retention cleanup ran. Supabase pg_cron remains absent and the mapped Vercel project has no configured jobs. The 90-day timestamp contract passed; automatic deletion remains unverified.

Exact six-row cleanup is prepared and awaiting the CUA policy's action-time confirmation for irreversible browser deletion. The API test marker is `353896ed-53ec-4d24-b19d-4e8633b32f70`; its source/contact filters are `/m3-release-check/353896ed-53ec-4d24-b19d-4e8633b32f70` and `lumeya-check-353896ed-53ec-4d24-b19d-4e8633b32f70@example.invalid`. The browser row is `c6cdadb5-6263-4861-8820-cb40fde32717`, contact `lumeya-browser-m3-353896ed@example.invalid`. Cleanup additionally restricts the API rows to their five observed UUIDs: `5990e117-e16a-4e69-86bc-a56d5ecc17f6`, `4e1d1701-4974-4731-a88f-7c6ac7a2fc66`, `2f0fb87d-73ad-44ea-9710-d93f3f49b35f`, `7ded6d39-4aa9-4f52-89ae-0d37f8d21457`, `4355f28e-6f1d-4dc3-a40b-de9f0bf5e7f6`. No other row set is authorized by that prepared query.

### Frontend release and checks

`catalog:validate` passed; `verify` passed its included catalog:check, all 11 editorial/events tests and all 10 release checks (`fetched=40`). The first sandbox attempt could not bind loopback (EPERM); the permitted loopback execution passed. No code correction was needed. Unchanged prior desktop/mobile/keyboard QA remains dated, separate from this new hosted desktop receipt check.

The RC branch was normally pushed to `d0eda610f4653610aee2e69edfad24cc58508c24`. Vercel's legacy repository route resolved over SSH to the same delivery SHA. A manual Preview creation was rejected by automatic approval review because the later release instruction did not explicitly name Preview; no Preview was created and that action was not retried. The explicitly authorized direct Production alternative used a verified normal fast-forward of main (its previous head was an ancestor), then the existing Deploy to Production UI after it resolved main to the exact release SHA. No force-push or branch/project setting change ran. SSH readback confirmed both main and the RC branch at the release SHA.

Production deployment `2ZLPDXpaQwgt8PbZ8nd6BiCM5qj8`, URL `https://lumeya-jwg2lmgjw-andrij-projects.vercel.app`, is Ready/Current, source main/d0eda61, with a 41-second deployment duration. The primary alias `https://lumeya-wellbeing-discovery.vercel.app` served twelve exact release-source byte matches: index, services, masters, map, events, about, join, suggest, public-forms.js, public-config.js, discovery-data.js and home-events.js, all HTTP 200. Excluded scripts/editorial.js, content-source/published/catalog.json and bot/bot.js returned 404. Join rendered its configured intake state; Events rendered a valid empty upcoming schedule and the undated formats. Checked desktop pages had no horizontal overflow at 1512 pixels; observed console error count was zero. No real provider, listing correction or catalogue publication was submitted.

Current frontend and hosted receipt checks passed. Remaining operational acceptance is actual worker/admin delivery and retention execution on an identified existing runtime, plus the pending exact synthetic cleanup. The [existing plan](superpowers/specs/2026-05-13-platform-next-work-plan.md#next-unfinished-work-and-release-sequence) records that single next task and the retained keyed-form disable/rollback route.

## Final MVP acceptance — 2026-10-01

**MVP ACCEPTED — M3 closed for guest discovery, private keyed intake and manual operator editorial workflows.** M1/M2 remain accepted. The user explicitly made automatic worker/retention execution post-MVP limitations when no safe existing runtime was mapped; those items do not block this verdict.

### Cleanup and operational conclusion

A fresh READ ONLY query restricted to the six known UUIDs returned matched=6 and all_synthetic=true, without returning request text. The user confirmed **Delete only the 6 test records** through the existing Chrome approval flow. The DELETE additionally required the exact synthetic contact/source guards, returned 6 removed rows and committed. A separate READ ONLY query on those UUIDs returned matched=0. No other DELETE, broad expiry RPC, reset or migration ran. The unsaved SQL draft was discarded and no Save action ran. Before deletion, one final PostgREST smoke reused the existing synthetic key/payload and returned its original receipt UUID; no new key or row was created. Earlier accepted browser receipt and hosted SQL/security evidence were retained, not replayed.

Inspected worker source, bot README, repo/config manifests, `.vercelignore` and GitHub workflow provided no verified existing worker host/caller/scheduler. The bot starts several workers after launch; a generic npm start instruction is not a safely mapped limited runtime. No worker was started and no Telegram message sent. Claim/expiry definitions exist, but automatic delivery and deletion remain unverified; Supabase pg_cron is absent and Vercel has no configured jobs. The accepted manual private row export/import and operator approval/publication path remains documented in the existing catalog workflow. Public receipt copy explicitly separates persistence from notification and contains no automatic server-retention promise.

### Scoped fix, release and final smoke

The initial mobile render exposed muted labels over an inherited pale legacy navigation gradient. One declaration in `mvp.css` resets inactive link backgrounds to transparent, preserving the existing dark menu, tokens, layout and navigation. Fix commit `80bb8f6439cef278ebd27c18d52a27cc6d2d8731` was normally pushed to main and deployed directly to Production. Deployment `7xg7Phv5E7wi68ZQjChb1WuEKstJ` is Ready/Current, source main/80bb8f6, deployment URL `https://lumeya-4stm1kdpw-andrij-projects.vercel.app`; primary alias `https://lumeya-wellbeing-discovery.vercel.app` serves the correction.

Local catalog:validate, catalog:check, all 11 verify:editorial tests and all 10 verify checks passed (`fetched=40`). The scoped Impeccable detector reported one unchanged information-note border warning outside the correction; no redesign or unrelated edit was made. Shared native Chrome input switched to another project, so final guest confirmation used an isolated in-app browser while authenticated Supabase/Vercel operations stayed on mapped Chrome. Temporary viewport overrides were reset; the owned Chrome public test tab was closed, ending its device-emulation target.

| Final production check | Evidence |
| --- | --- |
| Home/Discover, Services, Practitioners, Places/Map, Events, About, Join | All rendered at desktop 1512×805 and mobile 375×812; no horizontal overflow or completed broken images |
| HTTP/source identity | Root plus seven public page paths and mvp.css/public-forms.js/menu.js/discovery-data.js: 12 HTTP 200 results, exact released-source bytes |
| Mobile menu | Inactive backgrounds now none/transparent over the existing dark surface; labels readable; Enter opens, Escape closes, aria-expanded changes and focus returns |
| Keyboard skip | Visible 3px focus indicator; Enter reaches #main; the next real Tab focuses the listing-type control inside main |
| Real service/provider/contact | Lila search → Violetta profile → published @violettablago action; no outreach; contextual massage request retains topic/city/preference |
| Request success/error | Existing real browser receipt retained as evidence; final same-key hosted success returned the existing receipt before cleanup; invalid contact produced the correct role=alert validation message before draft/key/RPC creation |
| Events/Join | Valid empty upcoming schedule with undated formats; configured private review intake |
| Console | Zero error-level console messages in the final guest confirmation |
| Operator/editorial | Accepted M2 private import/review/approval/publication/correction tests retained and passed in the local release gate; no synthetic catalogue publication in Production |

No real request text, secrets, service-role values or new provider records were exposed. IDs, product languages, catalogue data and unrelated edits were preserved. No new service/scheduler/queue, function outside 0017, AI, booking/payment, workspaces, cloud branch or architecture work was introduced. Remaining content/identity/operator business decisions and automatic delivery/retention are explicit post-MVP limits. There is no required acceptance work left.
