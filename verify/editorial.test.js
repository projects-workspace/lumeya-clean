'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { openStore, atomicWrite } = require('../scripts/editorial');
const { renderBrowserFile, validateCatalog } = require('../scripts/catalog');
const { createPreview } = require('../scripts/editorial-preview');
const ROOT = path.resolve(__dirname, '..');
const PRIVATE_SENTINEL = 'PRIVATE_M2_CONTACT_AND_OPERATOR_NOTE';

function fixture(t) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lumeya-m2-test-')));
  const root = path.join(base, 'public');
  const privateDir = path.join(base, 'operator');
  fs.mkdirSync(path.join(root, 'content-source/published'), { recursive: true });
  const catalog = { schemaVersion: 1, version: 'm2-isolated-test',
    categories: [{ id: 'test-nature', label: 'Synthetic nature', description: 'Isolated test fixture', topicIds: ['test-craft'], publicationStatus: 'published' }],
    topics: [{ id: 'test-craft', label: 'Synthetic craft', description: 'Isolated test fixture', categoryId: 'test-nature', publicationStatus: 'published' }],
    providers: [{ id: 'test-provider', type: 'practitioner', name: 'Synthetic test provider', shortDescription: 'Isolated synthetic fixture, never public', topicIds: ['test-craft'], publicationStatus: 'published' }],
    services: [], places: [], eventFormats: [], scheduledEvents: [] };
  fs.writeFileSync(path.join(root, 'content-source/published/catalog.json'), JSON.stringify(catalog, null, 2));
  fs.writeFileSync(path.join(root, 'discovery-data.js'), renderBrowserFile(catalog));
  fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><html><head></head><body>Synthetic local preview</body></html>');
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  return { base, root, privateDir, store: openStore(privateDir, root), catalog };
}
function request(overrides = {}) {
  return { p_request_type: 'suggest_listing', p_listing_type: 'service', p_subject: 'Synthetic nature craft service',
    p_details: 'A synthetic test introduction; no real provider or health data.', p_contact: 'synthetic@example.invalid', p_source_page: '/join.html', ...overrides };
}
function review(overrides = {}) {
  return { operator: 'synthetic-operator', identityChecked: true, sourceChecked: true,
    identityEvidence: PRIVATE_SENTINEL, sourceEvidence: 'Explicitly isolated synthetic fixture; not provider verification.',
    candidate: { collection: 'services', record: { id: 'test-service', title: 'Synthetic nature craft service',
      description: 'Isolated test fixture, never public', status: 'By request', format: 'Individual', delivery: 'Online',
      topicIds: ['test-craft'], providerIds: ['test-provider'], contactUrl: 'https://example.invalid/contact', contactLabel: 'Contact test provider',
      sourceUrls: ['https://example.invalid/source'], publicationStatus: 'published' } }, ...overrides };
}
const sourceBytes = f => fs.readFileSync(path.join(f.root, 'content-source/published/catalog.json'), 'utf8');
const queueBytes = f => fs.readFileSync(path.join(f.privateDir, 'receipts.json'), 'utf8');

test('intake → clarification → checked review → explicit approval → publication → correction survives process restart/regeneration', t => {
  const f = fixture(t);
  const received = f.store.receive(request());
  assert.equal(received.persisted, true);
  const original = sourceBytes(f);
  f.store.note(received.id, 'clarification', { operator: 'synthetic-operator', note: PRIVATE_SENTINEL });
  assert.equal(sourceBytes(f), original);
  let assessed = f.store.review(received.id, review());
  assert.throws(() => f.store.publish(received.id), /publication_requires_approval/);
  assert.throws(() => f.store.approve(received.id, 'wrong-hash', 'synthetic-operator'), /explicit_current/);
  f.store.approve(received.id, assessed.reviewHash, 'synthetic-operator');
  const child = `const e=require(${JSON.stringify(path.join(ROOT, 'scripts/editorial.js'))}); console.log(JSON.stringify(e.openStore(process.argv[1],process.argv[2]).publish(process.argv[3])));`;
  const runPublish = id => JSON.parse(execFileSync(process.execPath, ['-e', child, f.privateDir, f.root, id], { encoding: 'utf8' }));
  assert.equal(runPublish(received.id).status, 'published');
  assert.equal(runPublish(received.id).duplicate, true);
  assert.equal(JSON.parse(sourceBytes(f)).services.length, 1);
  let browser = fs.readFileSync(path.join(f.root, 'discovery-data.js'), 'utf8');
  assert.ok(!browser.includes(PRIVATE_SENTINEL));
  assert.ok(!sourceBytes(f).includes('synthetic@example.invalid'));

  const correction = f.store.receive(request({ p_subject: 'Correction to synthetic craft', p_details: 'Change the public description after reviewed clarification.', p_source_page: '/join.html?intent=correction&collection=services&id=test-service' }));
  const publicBefore = sourceBytes(f);
  const changed = review(); changed.candidate.record.description = 'Reviewed synthetic correction';
  assessed = f.store.review(correction.id, changed);
  assert.equal(sourceBytes(f), publicBefore);
  assert.throws(() => f.store.publish(correction.id), /publication_requires_approval/);
  f.store.approve(correction.id, assessed.reviewHash, 'synthetic-operator');
  assert.equal(runPublish(correction.id).listingId, 'test-service');
  fs.unlinkSync(path.join(f.root, 'discovery-data.js'));
  runPublish(correction.id);
  const persisted = JSON.parse(sourceBytes(f));
  assert.equal(persisted.services.length, 1);
  assert.equal(persisted.services[0].id, 'test-service');
  assert.equal(persisted.services[0].description, 'Reviewed synthetic correction');
  assert.equal(fs.readFileSync(path.join(f.root, 'discovery-data.js'), 'utf8'), renderBrowserFile(persisted));
  const inspected = openStore(f.privateDir, f.root).inspect(correction.id);
  assert.equal(inspected.status, 'published');
  assert.deepEqual(inspected.audit.map(a => a.event), ['received', 'reviewed', 'approved', 'published']);
});

test('rejection, unchecked identity, private fields, malformed requests and draft publication leave canonical bytes unchanged', t => {
  const f = fixture(t);
  const received = f.store.receive(request());
  const canonical = sourceBytes(f);
  assert.throws(() => f.store.review(received.id, review({ identityChecked: false })), /identity_and_source/);
  const privateReview = review(); privateReview.candidate.record.privateNotes = PRIVATE_SENTINEL;
  assert.throws(() => f.store.review(received.id, privateReview), /candidate_catalog_invalid/);
  const draft = review(); draft.candidate.record.publicationStatus = 'draft';
  assert.throws(() => f.store.review(received.id, draft), /candidate_catalog_invalid/);
  f.store.note(received.id, 'rejected', { operator: 'synthetic-operator', note: PRIVATE_SENTINEL });
  const rejectedQueue = queueBytes(f);
  for (const action of [() => f.store.review(received.id, review()), () => f.store.approve(received.id, 'none', 'operator'), () => f.store.publish(received.id)]) assert.throws(action);
  assert.equal(queueBytes(f), rejectedQueue);
  assert.equal(sourceBytes(f), canonical);
  for (const payload of [request({ p_honeypot: 'spam' }), request({ p_contact: 'abc' }), request({ p_reference_url: 'javascript:alert(1)' }), request({ privateNotes: PRIVATE_SENTINEL }), request({ p_details: null })]) assert.throws(() => f.store.receive(payload));
  assert.equal(queueBytes(f), rejectedQueue);
  assert.throws(() => openStore(path.join(f.root, 'private'), f.root), /outside_public_repository/);
  assert.equal(fs.statSync(f.privateDir).mode & 0o777, 0o700);
  assert.equal(fs.statSync(path.join(f.privateDir, 'receipts.json')).mode & 0o777, 0o600);
});

test('exact retries deduplicate receipts and preserve imported remote IDs/provenance', t => {
  const f = fixture(t);
  const original = f.store.receive(request(), { channel: 'website', remoteId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
  const duplicateProvenance = { channel: 'telegram', remoteId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', receivedAt: '2026-09-30T12:00:00.000Z' };
  const duplicate = openStore(f.privateDir, f.root).receive(request(), duplicateProvenance);
  assert.equal(duplicate.id, original.id); assert.equal(duplicate.duplicate, true);
  assert.equal(f.store.list().length, 1);
  assert.deepEqual(f.store.inspect(original.id).provenance.duplicateRemoteIds, ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']);
  assert.deepEqual(f.store.inspect(original.id).provenance.duplicateReceipts, [duplicateProvenance]);
  assert.throws(() => f.store.receive(request({ p_details: 'Changed data pretending to be the same remote receipt.' }), { channel: 'website', remoteId: original.id }), /remote_receipt_changed/);
});

test('stale corrections, conflicting introduction IDs and changed approved review cannot overwrite listings', t => {
  const f = fixture(t); const received = f.store.receive(request());
  let assessed = f.store.review(received.id, review());
  f.store.approve(received.id, assessed.reviewHash, 'operator'); f.store.publish(received.id);
  const correction = f.store.receive(request({ p_subject: 'Synthetic correction', p_source_page: '/join.html?intent=correction&collection=services&id=test-service' }));
  const candidate = review(); candidate.candidate.record.description = 'First reviewed correction';
  assessed = f.store.review(correction.id, candidate); f.store.approve(correction.id, assessed.reviewHash, 'operator');
  const catalog = JSON.parse(sourceBytes(f)); catalog.services[0].description = 'Different intervening approved edit';
  fs.writeFileSync(path.join(f.root, 'content-source/published/catalog.json'), JSON.stringify(catalog));
  const conflictingBytes = sourceBytes(f);
  assert.throws(() => f.store.publish(correction.id), /listing_changed_review_again/);
  assert.equal(sourceBytes(f), conflictingBytes);
  assessed = f.store.review(correction.id, candidate);
  assert.throws(() => f.store.publish(correction.id), /publication_requires_approval/);
  f.store.approve(correction.id, assessed.reviewHash, 'operator'); f.store.publish(correction.id);
  const second = f.store.receive(request({ p_subject: 'Another synthetic introduction' }));
  assert.throws(() => f.store.review(second.id, review()), /introduction_cannot_overwrite/);
});

test('publication recovers after canonical source rename but before export/receipt completion; concurrent publisher lock refuses cleanly', t => {
  const f = fixture(t); const received = f.store.receive(request());
  const assessed = f.store.review(received.id, review()); f.store.approve(received.id, assessed.reviewHash, 'operator');
  const catalog = JSON.parse(sourceBytes(f)); catalog.services.push(review().candidate.record);
  fs.writeFileSync(path.join(f.root, 'content-source/published/catalog.json'), JSON.stringify(catalog));
  fs.writeFileSync(path.join(f.root, 'content-source/published/catalog.json.lock'), '');
  const before = queueBytes(f); assert.throws(() => f.store.publish(received.id), /catalog_publication_busy/); assert.equal(queueBytes(f), before);
  fs.unlinkSync(path.join(f.root, 'content-source/published/catalog.json.lock'));
  assert.equal(openStore(f.privateDir, f.root).publish(received.id).duplicate, true);
  assert.equal(JSON.parse(sourceBytes(f)).services.length, 1);
  assert.equal(fs.readFileSync(path.join(f.root, 'discovery-data.js'), 'utf8'), renderBrowserFile(JSON.parse(sourceBytes(f))));
});

test('real loopback HTTP intake persists across server restart; anonymous reads/approval/publication and private paths are denied', async t => {
  const f = fixture(t);
  const start = async () => { const server = createPreview({ root: f.root, privateDir: f.privateDir }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); return server; };
  let server = await start();
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = () => 'http://127.0.0.1:' + server.address().port;
  const submit = payload => fetch(url() + '/__lumeya/intake', { method: 'POST', headers: { origin: url(), 'Content-Type': 'application/json', 'X-Lumeya-Local': '1' }, body: JSON.stringify(payload) });
  const first = await (await submit(request())).json(); assert.equal(first.data.persisted, true);
  await new Promise(resolve => server.close(resolve)); server = await start();
  const repeated = await (await submit(request())).json(); assert.equal(repeated.data.id, first.data.id); assert.equal(repeated.data.duplicate, true);
  for (const route of ['/__lumeya/intake', '/__lumeya/receipts', '/operator/receipts.json', '/content-source/published/catalog.json', '/scripts/editorial.js', '/.git/config', '/%2e%2e/operator/receipts.json']) assert.ok((await fetch(url() + route)).status >= 400);
  for (const route of ['/__lumeya/approve', '/__lumeya/publish']) assert.equal((await fetch(url() + route, { method: 'POST' })).status, 405);
  assert.equal((await fetch(url() + '/__lumeya/intake', { method: 'POST', headers: { origin: 'https://untrusted.invalid', 'Content-Type': 'application/json', 'X-Lumeya-Local': '1' }, body: JSON.stringify(request()) })).status, 403);
  const before = queueBytes(f);
  assert.equal((await submit(request({ p_contact: '' }))).status, 400); assert.equal(queueBytes(f), before);
  const html = await (await fetch(url())).text(); assert.match(html, /__lumeya\/config\.js/); assert.ok(!html.includes(PRIVATE_SENTINEL));
});

test('keyed retries return one private receipt after restart; conflicts and invalid requests preserve bytes without leaking values', async t => {
  const f = fixture(t);
  const start = async () => { const server = createPreview({ root: f.root, privateDir: f.privateDir }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); return server; };
  let server = await start();
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = () => 'http://127.0.0.1:' + server.address().port;
  const submit = payload => fetch(url() + '/__lumeya/intake', { method: 'POST', headers: { origin: url(), 'Content-Type': 'application/json', 'X-Lumeya-Local': '1' }, body: JSON.stringify(payload) });
  const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const otherKey = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const payload = request({ p_idempotency_key: key, p_details: `Private synthetic request ${PRIVATE_SENTINEL}; never publish.` });
  const firstResponse = await submit(payload);
  assert.equal(firstResponse.status, 200);
  const firstBody = await firstResponse.json();
  const firstId = firstBody.data.id;
  assert.match(firstId, /^[0-9a-f-]{36}$/i);
  assert.equal(firstBody.data.persisted, true);
  const savedBytes = queueBytes(f);

  await new Promise(resolve => server.close(resolve));
  server = await start();
  const repeatedResponse = await submit(payload);
  assert.equal(repeatedResponse.status, 200);
  const repeatedBody = await repeatedResponse.json();
  assert.equal(repeatedBody.data.id, firstId);
  assert.equal(repeatedBody.data.duplicate, true);
  assert.equal(queueBytes(f), savedBytes);

  const conflictResponse = await submit({ ...payload, p_details: 'A changed synthetic request reusing the previous key.' });
  const conflictText = await conflictResponse.text();
  assert.equal(conflictResponse.status, 409);
  assert.equal(conflictText, '{"error":"idempotency_key_conflict"}');
  assert.ok(!conflictText.includes(firstId) && !conflictText.includes(key) && !conflictText.includes(PRIVATE_SENTINEL));
  assert.equal(queueBytes(f), savedBytes);

  const distinctResponse = await submit({ ...payload, p_idempotency_key: otherKey });
  assert.equal(distinctResponse.status, 200);
  const distinctBody = await distinctResponse.json();
  assert.notEqual(distinctBody.data.id, firstId);
  assert.equal(distinctBody.data.duplicate, false);
  assert.equal(f.store.list().length, 2);
  const publicExport = fs.readFileSync(path.join(f.root, 'discovery-data.js'), 'utf8');
  assert.ok(!publicExport.includes(key) && !publicExport.includes(otherKey) && !publicExport.includes(PRIVATE_SENTINEL));

  const beforeInvalid = queueBytes(f);
  const invalidResponse = await submit({ ...payload, p_idempotency_key: 'not-a-uuid' });
  const invalidText = await invalidResponse.text();
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidText, '{"error":"request_not_saved_check_fields_and_retry"}');
  assert.ok(!invalidText.includes(firstId) && !invalidText.includes(key) && !invalidText.includes(PRIVATE_SENTINEL));
  assert.equal(queueBytes(f), beforeInvalid);
});

test('CLI operator inspection stays in private files, status output contains no submission or notes; publisher rejects private/nested fields', t => {
  const f = fixture(t); const received = f.store.receive(request({ p_details: PRIVATE_SENTINEL }));
  const output = execFileSync(process.execPath, [path.join(ROOT, 'scripts/editorial.js'), 'inspect', '--private-dir', f.privateDir, '--id', received.id], { encoding: 'utf8' });
  assert.ok(!output.includes(PRIVATE_SENTINEL));
  const inspectFile = JSON.parse(output).privateFile;
  assert.equal(fs.statSync(inspectFile).mode & 0o777, 0o600);
  assert.ok(fs.readFileSync(inspectFile, 'utf8').includes(PRIVATE_SENTINEL));
  const privateCatalog = structuredClone(f.catalog); privateCatalog.providers[0].externalLinks = [{ label: 'Source', url: 'https://example.invalid', notes: PRIVATE_SENTINEL }];
  assert.ok(validateCatalog(privateCatalog).length);
  const source = structuredClone(f.catalog); source.providers[0].name = { private: PRIVATE_SENTINEL }; assert.ok(validateCatalog(source).length);
  atomicWrite(path.join(f.privateDir, 'private.json'), JSON.stringify(request()));
});
