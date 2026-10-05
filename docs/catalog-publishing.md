# Lumeya public catalog workflow

The public catalogue is authored as structured JSON and rendered by the existing static HTML and JavaScript pages. The browser receives only the generated `discovery-data.js` export.

## Source and templates

- Published editorial records live in `content-source/published/catalog.json`.
- Blank service, practitioner, organisation, place, event-format and scheduled-event templates live in `content-source/templates/`.
- The publisher reads only the one `catalog.json` file under `published/`. It does not read draft folders, private notes, or test fixtures.
- `.vercelignore` excludes all of `content-source/` and `scripts/` from the static deployment. Do not copy private or draft material into the published catalog.

Use a stable lowercase ID for every record. Keep IDs when names change so links between services, providers, places and event formats remain stable. Add relationships by IDs, not by copying display names. Empty optional values may stay empty; renderers show “Not published” for missing information.

Each record in the published file must have `publicationStatus: "published"`. A draft template is not a listing: complete it with source-backed information, validate its relationships and links, then add it to the appropriate collection. The validator fails if a draft or fixture is placed in the published file.

## Private intake and editorial review (M2)

The guest form uses `submit_idempotent_public_discovery_request` with `suggest_listing` or `looking_for` and a browser-generated retry key. Suggestions do not authenticate a provider, create an account or publish. Corrections use the same contract: `source_page` carries `intent=correction`, the collection and the original stable ID; it does not carry the retry key. Contact requests cannot become listings. The legacy `submit_public_discovery_request` signature remains available for older callers but does not provide keyed retry safety.

`scripts/editorial.js` is the operator tool. Its queue, submission text, follow-up contact, identity evidence, clarification notes, review and approval history stay in a **dedicated absolute directory outside the repository and every web root**. The directory must be mode `700`; JSON input/receipt files must be mode `600`. Storage is local plaintext protected by OS permissions, not an encrypted account service. CLI output contains status, IDs, review hashes and private inspection paths; it never prints submission text or operator notes. Do not put actual submissions, review files or queue exports in Git, screenshots, support logs, templates or deployment inputs.

Set `LUMEYA_EDITORIAL_DIR` to that directory in the operator's shell. Copy blank catalogue templates into this directory and edit them there. Keep public descriptions, public contact, sources and any independently checked coordinates separate from the provider's private follow-up contact. Publication validates a fixed public-field allowlist; unknown or nested private fields are rejected. `sourceUrls` contains public supporting links and `sourceNote` may explain the limits of that information. Identity checking is recorded privately and does not create a verification badge.

Operator commands, from the repository root:

```sh
npm run editorial -- list
npm run editorial -- inspect --id RECEIPT_ID
npm run editorial -- clarify --id RECEIPT_ID --file /absolute/private/clarification.json
npm run editorial -- review --id RECEIPT_ID --file /absolute/private/review.json
npm run editorial -- approve --id RECEIPT_ID --review-hash HASH_FROM_REVIEW --operator OPERATOR_NAME
npm run editorial -- publish --id RECEIPT_ID
npm run catalog:check
npm run verify
```

`inspect` writes a mode-600 file inside the private directory for local operator review. `clarify` and `reject` accept `{ "operator": "...", "note": "..." }`. A clarification note is an operator record; recording it does not send a message. Check the claimant's relationship to the work against the published provider contact or other supplied evidence before approving; a name, Telegram handle, form submission or browser identity is not proof. Obtain permission before any new external outreach. Preserve the original request and record the clarification/source evidence in the review. The tool sends no email or Telegram messages.

A private review file has this structure (the ellipses describe fields to fill, not executable JSON):

```json
{
  "operator": "...",
  "identityChecked": false,
  "sourceChecked": false,
  "identityEvidence": "...",
  "sourceEvidence": "...",
  "candidate": {
    "collection": "services",
    "record": { "...": "complete approved public record from its template" }
  }
}
```

Set each check to `true` only after completing it. A complete service needs its stable ID, provider and topic relationships, delivery/format, valid public contact and public source links. Leave unsupported price/duration/location fields blank; never invent them. For a new provider, publish the checked provider record first, then its service; add reverse relationships through a separately reviewed correction. A provider with no separate profile page can link to `masters.html#provider-ID`; a service can link to `services.html?q=TITLE#service-ID`. Reuse existing place IDs or use an explicit online format. Introductions cannot overwrite an existing ID.

Review generates a hash of the exact candidate, its evidence and the previous record. Explicit approval must name that hash and an operator. `publish` uses only this approved snapshot. Re-review invalidates earlier approval. Rejected receipts cannot publish or reopen. Corrections must preserve the requested collection/ID, cannot publish before approval and refuse a stale edit if that public record changed after review; re-review and explicitly approve again. The canonical JSON is written atomically before regenerating the browser export. Repeating publication after an interrupted write restores the export without inserting another listing. A receipt already published cannot overwrite a later correction.

Exact local intake retries with the same key and normalized payload return the same private receipt; changed content under that key is rejected without changing the queue. A distinct key creates a separate receipt. The loopback and filesystem tests exercise this behavior through a server restart; that proves the local preview/store contract only. Imported remote receipt IDs and duplicate IDs are retained privately. A different payload under the same imported remote ID is rejected. Publication checks IDs again so repeated or competing receipts cannot create a duplicate record. Locks refuse concurrent queue/catalog writes. If a process is killed while holding `queue.lock` or `catalog.json.lock`, confirm that no operator process is still running before manually removing only that stale lock and retrying; do not delete the queue or reset the catalogue.

## Receipt sources and local preview

For an existing **operator-received** manual request, write the existing RPC argument envelope (`p_request_type`, `p_subject`, `p_details`, optional `p_idempotency_key`, `p_listing_type`, `p_location`, `p_preference`, `p_contact`, `p_reference_url`, `p_source_page`, `p_honeypot`) to a mode-600 private file and use:

```sh
npm run editorial -- receive --file /absolute/private/received-request.json
```

For a hosted request, export its original `public_discovery_requests` row using already-authorized server/operator read access, keep the file private, then use `npm run editorial -- import --file /absolute/private/original-row.json`. The importer retains the original `id`, `source_channel` and `created_at`; it does not claim to fetch the queue or deliver its notification. Never use a browser/publishable key to read submissions, and never put a service-role key into this CLI's arguments or public assets. This private export/import is the accepted manual operator handoff. Hosted receipt persistence is verified; automatic import and notification delivery are not provided by this CLI.

`npm run dev:editorial` serves the existing static site on `127.0.0.1:4173` and injects a **local-preview-only** adapter. It accepts only same-origin JSON intake, persists a private local receipt using the same request contract and exposes no queue reads, approval or publication endpoints. It blocks internal/private repository paths. The form labels local persistence explicitly and never routes a local submission to Supabase or Telegram. `LUMEYA_EDITORIAL_DIR` is required; there is no hosted deployment for this preview. Use temporary private directories and a temporary public copy for synthetic publication tests, as `verify/editorial.test.js` does. Do not publish synthetic records to `content-source/published/catalog.json`.

Saving a browser draft, copying details or opening Telegram does **not** send a request. A returned RPC UUID confirms queue persistence, not worker delivery, booking or publication. The deployed M3 client and applied migration 0017 use stable retry keys; real hosted retry behavior and bounded synthetic cleanup passed. Current acceptance evidence is in [PROJECT_STATE.md](../PROJECT_STATE.md). The existing test harness remains guarded for a positively confirmed non-production branch. Browser drafts/retry keys last up to seven days. The database's 90-day expiry timestamp requires a separate cleanup caller; automatic deletion and Telegram delivery are post-MVP limitations. No new service or scheduler is introduced.

## Limited source check

On 2026-09-30, `lila-reading` was checked against the supplied linked `profile-violetta.html`: the profile names the individual Lila offer, Europe/by-arrangement context and `@violettablago`, and its contact anchor matches the catalogue's `https://t.me/violettablago`. The profile supports the listing's factual basis and contact route. The public Telegram page could not be fetched by the web tool; no message was sent. Current availability, claimant identity, professional qualifications and outcomes were not independently established. No price, badge or coordinate was added. Nature/ecological/craft categories remain legitimate but empty pending real sourced content.

## Validate and publish

From the repository root:

```sh
npm run catalog:validate
npm run catalog:publish
npm run catalog:check
npm run verify
```

`catalog:validate` checks stable and unique IDs, required fields, publication status, category and entity references, local and external links, coordinate verification, and dated-event fields. `catalog:publish` validates first and regenerates `discovery-data.js`; it never edits page renderers. `catalog:check` confirms that the public export matches the published source. The repository release gate runs this check before its existing checks.

## Content rules

- Use only information supported by an existing public source or an approved provider submission. Do not fill blank fields by guessing.
- Do not add reviews, audience figures, performance metrics, prices, dates, map points or partnerships without source evidence.
- Add a dated event only when it has an upcoming ISO `startAt`; `endAt`, when supplied, must be later. The scheduled-event collection is separate from the undated `eventFormats` collection.
- Add coordinates only with `coordinatesVerified: true` and a public `coordinateSourceUrl`. Without both, records remain list-only. Inactive places also remain list-only.
- Do not place client information, health records, credentials or other private material in public catalogue data.
- Publication is not independent verification, professional licensing, certification or a guarantee of outcomes. Preserve the distinction between provider information, a published event date, an explicitly verified map position and any future assessment programme.

The static catalogue can later be exported from an editorial CMS or database if the export follows this structure. Accounts, Provider Space, certification, bookings, payments, messaging and cross-project data sharing remain separate future decisions.
