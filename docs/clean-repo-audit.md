# Independent Lumeya cleanup audit — 2026-10-05

Source: accepted committed Lumeya checkpoint `d6ce5a72029fb051c22a5034cb6fec1380403f0e`. New local checkout: `Lumeya-Clean`, branch `main`, no remote. Baseline commit: `9d083220b8a8d8ade646ba73fbbb0db60aeda0ef`. The separate cleanup commit follows this baseline. The source root's uncommitted `.gitignore`, `README.md` and untracked `AGENTS.md` were excluded and preserved. The recovered legacy repository remained unchanged.

The machine-readable [audit inventory](clean-repo-audit.json) classifies all 453 detected source identity lines, every removed/adapted file, 326 removed CSS selector blocks and each retained identity occurrence. It includes exact source SHA, byte-comparison digests, source invariance checks and the browser results. These records justify retained terms; they are not product branding.

## A — remove

- Guest-inaccessible account, favourites, membership/community, shop, coliving, school, incubator and networking pages/scripts; legacy submission and calendar/project RPC scripts; account-dependent contextual request popups. These have no current catalogue detail/source dependencies. Obsolete navigation/control consumers were removed; the link gate confirms every remaining reference resolves.
- The synthetic project ecosystem and its old outbound Vercel project links. `projects.html` itself stays because an accepted event-format record links there; it now holds only that published undated format. The agency/relationship detail routes stay because catalogue services link there; their old ecosystem-host buttons and private actions are removed.
- Earlier mixed schema/migrations 0002–0015 and `bot/schema.sql`; the accepted public contracts 0016/0017 remain unchanged. No schema is replayed. Existing events/services/participation prerequisites mean this is deliberately not a fresh-database bootstrap.
- Legacy bot profile creation, role applications/approvals, content submissions, service/event bookings, club, scheduling/reminder and project-master workers. Public parser/fallback/notification functions stay. Fake-client tests prove request persistence/recovery, notification-state handling and absence of private-table writes.
- Unreferenced one-off machine/other-project setup and translation utilities, accidental raw draft paths, four May private-platform specs and machine metadata. Lumeya positioning/MVP, editorial/security and historical acceptance documents stay.
- 27 unreferenced raw videos, already excluded by the accepted deployment manifest; the two `offer.html` media references remain tracked. Unused root Supabase CLI dependency/scaffold removed; no remaining npm script calls it. Bot dependency versions unchanged.
- 326 wholly retired CSS selector blocks where the obsolete selector was absent from retained HTML/frontend JavaScript. Shared selectors and defensive guest-only exclusions were retained conservatively.

## B — adapt

Repository package/lock metadata, shell logos/footer copy, referenced translation dictionaries and old product attributions now identify Lumeya. Four language dictionaries retain used content; visible product behavior remains forced English. No catalogue name or stable ID was renamed.

`calendar.html` retains its existing URL and uses the accepted public upcoming-schedule renderer; private calendar/recurrence/booking actions are absent. `projects.html` retains only the catalogue-linked co-creation format. Contextual service contact controls use the existing public request route; they no longer invoke retired account workflows. The dedicated publishable Supabase configuration and keyed RPC client are unchanged.

The bot is bounded to public request fallback and notification. Verification configuration now registers 20 public/detail routes, no account pages, and includes four isolated bot regression tests without weakening the existing RLS/idempotency/worker contracts. README, AGENTS and current state describe this independent, local, unreleased checkout.

## C — keep and justify

- Santiago Studio / Santiago Studio Praha, Santiago Talks & Interviews and Santiago Incubator are published place/format/organizer names. Their IDs, anchors, relationships, contextual request text and factual source/profile translations remain unchanged where used. These identify catalogue entities; the product is Lumeya.
- `santioago_bot` is the accepted operator contact/fallback handle in published records and request code. Inventing a new handle or changing an external bot is outside scope. It remains a documented compatibility dependency, with no claim of current delivery health; retire it only after separately authorizing and verifying an endpoint replacement.
- `ma3-user-*`/`ma3_user` occur only in deletion-only guest-identity protection. They cannot restore authentication. Shared defensive UI hide selectors remain protective compatibility, not account functionality.
- Shared skill data includes proper-name font-designer credits. Those names are unrelated to repository/product identity. Historical acceptance records preserve named entity journeys and clearly identify their source-checkpoint scope.

There are zero unclassified active old branding/config matches. The final scan rejects old ecosystem Vercel hosts, owner identities and retired Telegram login/application/booking/content command routes; it passed. Every remaining name/handle occurrence has an explicit reason in the inventory. This does not claim literal zero string matches, which would require falsifying accepted content/contact compatibility.

## Verification and comparison

- `npm run verify`: 15 isolated tests passed; all 10 release checks passed. 20 HTML routes, 321 links, 69 asset references and 32 loopback HTTP targets checked. Static structure, syntax, required MVP UI, source-export consistency, journey, secrets and security contracts passed. `git diff --check` passed.
- Seventeen core files match the accepted source byte-for-byte: catalogue JSON/export, publishable config, keyed form client, catalog/editorial/preview scripts, migrations 0016/0017 and discovery/provider/place/events renderers. All provider and catalogue IDs, references, content and links remain intact.
- Browser: all seven primary routes checked at 1440 × 900 and 375 × 812, matching accepted main text except the deliberately removed About legacy-context notice; no horizontal overflow. Every catalogue-linked detail route also loaded at mobile width. Keyboard skip-link focus, menu Enter/Escape, `aria-expanded` and focus return passed.
- Real published Lila service → Violetta profile → matching published Telegram contact passed by inspection, without opening/sending the external contact. Deep Massage → Ivan → place anchor → prefilled request passed. Join native validation, safe local receipt persistence, injected 503/uncertain receipt, same-key retry and blocked-storage/no-submission behavior passed.
- Browser page errors: zero. Unexpected local HTTP failures: zero. Supabase reads were intercepted; all submissions went only to the loopback private preview, and no remote writes or messages occurred. Synthetic receipts stayed outside the repository and were not published. Local browser screenshots were visually inspected.

Source invariance compared both HEADs, refs, status, binary diff digests and non-secret untracked file digests before/after. Lumeya stays at its source SHA with its original three dirty/untracked paths; recovered legacy stays clean at `c8f6f448a56d886e21d8f855defb55b2c6dac464`. GitHub, Vercel, Supabase and production were not changed or queried for current health.

Independent Git checks: main, no remote, no alternates/commondir/shallow/shared objects, no inherited hooks, no local environment/credential files, and the source commit is absent from the new object database. The new root is the baseline import; old Git lineage is not reachable or imported. Baseline history includes some legacy source code because a separate baseline/cleanup pair was requested; it does not include the old repository's commits. The baseline intentionally omits ignored unreferenced raw media/drafts; required media is included.

## Exact next step

Authorize one separate repository/deployment cutover: create a fresh Lumeya-only GitHub repository, push this local main to it, then change the existing dedicated Lumeya Vercel project's Git source to that new repository after verifying exact project/team, current deployment settings, static exclusions, domain and unchanged 0017/backend compatibility. Preserve the current domain, publishable configuration and dedicated database; do not replay schema or start the bot. Retain the mixed remote and previous known-good deployment for rollback, validate the new deployment's read/contact paths without live submissions, and verify its commit SHA. No force-push or destructive replacement of the mixed remote is recommended. Handle renaming the operator bot contact as a separately verified service change.
