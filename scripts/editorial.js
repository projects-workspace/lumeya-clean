'use strict';

// Operator-only filesystem tooling. No approval or queue-read HTTP endpoint.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateCatalog, renderBrowserFile } = require('./catalog');
const ROOT = path.resolve(__dirname, '..');
const EDITABLE = new Set(['services', 'providers', 'places', 'eventFormats', 'scheduledEvents']);
const IDEMPOTENCY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail = code => { throw new Error(code); };

function atomicWrite(file, value, mode = 0o600) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  const fd = fs.openSync(temporary, 'wx', mode);
  try { fs.writeFileSync(fd, value); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temporary, file);
  const directory = fs.openSync(path.dirname(file), 'r');
  try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
}

function inside(child, parent) { return child === parent || child.startsWith(parent + path.sep); }

function privateDirectory(directory, root = ROOT) {
  if (!directory || !path.isAbsolute(directory)) fail('absolute_private_directory_required');
  const resolved = path.resolve(directory);
  if (inside(resolved, root) || inside(root, resolved)) fail('private_storage_must_be_outside_public_repository');
  fs.mkdirSync(resolved, { recursive: true, mode: 0o700 });
  const real = fs.realpathSync(resolved);
  if (real !== resolved || inside(real, fs.realpathSync(root))) fail('private_storage_symlinks_not_allowed');
  if ((fs.statSync(real).mode & 0o077) !== 0) fail('private_directory_requires_mode_700');
  return real;
}

function normalizeRequest(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('invalid_request');
  const allowed = new Set(['p_request_type', 'p_subject', 'p_details', 'p_idempotency_key', 'p_listing_type', 'p_location', 'p_preference', 'p_contact', 'p_reference_url', 'p_source_page', 'p_honeypot']);
  if (Object.keys(payload).some(key => !allowed.has(key))) fail('unexpected_request_field');
  const text = (key, min, max) => {
    if (payload[key] != null && typeof payload[key] !== 'string') fail('invalid_request_field');
    const value = (payload[key] || '').trim();
    if (value.length < min || value.length > max) fail('invalid_request_length');
    return value || null;
  };
  const type = text('p_request_type', 1, 30);
  if (!['suggest_listing', 'looking_for'].includes(type)) fail('unsupported_request_type');
  if (text('p_honeypot', 0, 500)) fail('request_rejected');
  const sourcePage = text('p_source_page', 0, 500);
  const idempotencyKey = text('p_idempotency_key', 0, 36);
  if (idempotencyKey && !IDEMPOTENCY_PATTERN.test(idempotencyKey)) fail('invalid_idempotency_key');
  const request = {
    p_request_type: type, p_subject: text('p_subject', 2, 160),
    p_details: text('p_details', 10, 2500), p_listing_type: text('p_listing_type', 0, 30),
    p_location: text('p_location', 0, 160), p_preference: text('p_preference', 0, 30),
    p_contact: text('p_contact', 3, 240), p_reference_url: text('p_reference_url', 0, 500),
    p_source_page: sourcePage, idempotencyKey,
  };
  const contact = request.p_contact;
  const phoneDigits = contact.replace(/\D/g, '').length;
  const phoneValid = /^\+?[\d ()-]{7,25}$/.test(contact) && phoneDigits >= 7 && phoneDigits <= 15;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact) && !/^https:\/\/t\.me\/[a-zA-Z][a-zA-Z0-9_]{4,31}\/?$/.test(contact) && !phoneValid) fail('invalid_reply_contact');
  if (type === 'suggest_listing' && !['practitioner', 'service', 'place'].includes(request.p_listing_type)) fail('invalid_listing_type');
  if (type === 'looking_for' && request.p_listing_type) fail('invalid_listing_type');
  if (type === 'suggest_listing' && request.p_preference) fail('invalid_preference');
  if (request.p_preference && !['online', 'in_person', 'either'].includes(request.p_preference)) fail('invalid_preference');
  if (request.p_reference_url) {
    let url;
    try { url = new URL(request.p_reference_url); } catch { fail('invalid_reference_url'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) fail('invalid_reference_url');
  }
  return request;
}

function requestIntent(request) {
  const url = new URL(request.p_source_page || '/', 'https://local.invalid');
  const correction = url.searchParams.get('intent') === 'correction';
  const target = correction ? { collection: url.searchParams.get('collection'), id: url.searchParams.get('id') } : null;
  if (correction && (!EDITABLE.has(target.collection) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target.id || ''))) fail('invalid_correction_target');
  return { kind: correction ? 'correction' : 'introduction', target };
}

function openStore(directory, root = ROOT) {
  directory = privateDirectory(directory, root);
  const file = path.join(directory, 'receipts.json');
  const lock = path.join(directory, 'queue.lock');
  function transact(action) {
    let fd;
    try { fd = fs.openSync(lock, 'wx', 0o600); } catch { fail('operator_queue_busy'); }
    try {
      if (fs.existsSync(file) && (fs.lstatSync(file).isSymbolicLink() || (fs.statSync(file).mode & 0o077))) fail('private_file_permissions_invalid');
      const state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { schemaVersion: 1, receipts: [] };
      if (state.schemaVersion !== 1 || !Array.isArray(state.receipts)) fail('invalid_private_queue');
      const before = JSON.stringify(state);
      const result = action(state);
      if (JSON.stringify(state) !== before) atomicWrite(file, JSON.stringify(state, null, 2) + '\n');
      return result;
    } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
  }
  const receipt = (state, id) => state.receipts.find(item => item.id === id) || fail('receipt_not_found');
  const recordAudit = (item, event, operator) => item.audit.push({ event, operator: operator || 'intake', at: new Date().toISOString() });
  return {
    directory,
    receive(payload, provenance = { channel: 'local-preview' }) {
      const request = normalizeRequest(payload);
      const idempotencyKey = request.idempotencyKey;
      delete request.idempotencyKey;
      const intent = requestIntent(request);
      return transact(state => {
        const fingerprint = hash(request);
        const existing = idempotencyKey
          ? state.receipts.find(item => item.idempotencyKey === idempotencyKey)
          : state.receipts.find(item => item.fingerprint === fingerprint || (provenance.remoteId && item.provenance.remoteId === provenance.remoteId));
        if (existing) {
          if (existing.fingerprint !== fingerprint) fail(idempotencyKey ? 'idempotency_key_conflict' : 'remote_receipt_changed_requires_review');
          if (provenance.remoteId && provenance.remoteId !== existing.provenance.remoteId && !(existing.provenance.duplicateRemoteIds || []).includes(provenance.remoteId)) {
            existing.provenance.duplicateRemoteIds = (existing.provenance.duplicateRemoteIds || []).concat(provenance.remoteId);
            existing.provenance.duplicateReceipts = (existing.provenance.duplicateReceipts || []).concat(structuredClone(provenance));
          }
          return { id: existing.id, duplicate: true, persisted: true, channel: provenance.channel };
        }
        const item = { id: provenance.remoteId || crypto.randomUUID(), fingerprint, idempotencyKey, request, intent, provenance,
          status: 'pending', audit: [] };
        recordAudit(item, 'received');
        state.receipts.push(item);
        return { id: item.id, duplicate: false, persisted: true, channel: provenance.channel };
      });
    },
    list() { return transact(state => state.receipts.map(item => ({ id: item.id, status: item.status, intent: item.intent.kind, reviewHash: item.reviewHash || null }))); },
    inspect(id) { return transact(state => structuredClone(receipt(state, id))); },
    note(id, status, note) {
      if (!['clarification', 'rejected'].includes(status) || !note || typeof note.operator !== 'string' || !note.operator.trim() || typeof note.note !== 'string' || !note.note.trim()) fail('operator_and_private_note_required');
      return transact(state => {
        const item = receipt(state, id);
        if (['published', 'rejected'].includes(item.status)) fail('receipt_is_terminal');
        item.status = status;
        item.notes = (item.notes || []).concat({ ...note, at: new Date().toISOString() });
        delete item.review; delete item.reviewHash; delete item.approval;
        recordAudit(item, status, note.operator);
        return { id, status };
      });
    },
    review(id, review) {
      return transact(state => {
        const item = receipt(state, id);
        if (!['pending', 'clarification', 'reviewed', 'approved'].includes(item.status)) fail('receipt_cannot_be_reviewed');
        if (!review || review.identityChecked !== true || review.sourceChecked !== true || typeof review.operator !== 'string' || !review.operator.trim() ||
            typeof review.identityEvidence !== 'string' || !review.identityEvidence.trim() ||
            typeof review.sourceEvidence !== 'string' || !review.sourceEvidence.trim()) fail('identity_and_source_review_required');
        const candidate = review.candidate;
        if (!candidate || !EDITABLE.has(candidate.collection) || !candidate.record) fail('invalid_candidate');
        if (item.request.p_request_type !== 'suggest_listing') fail('contact_request_cannot_publish');
        if (item.intent.kind === 'introduction' && candidate.collection !== { practitioner: 'providers', service: 'services', place: 'places' }[item.request.p_listing_type]) fail('candidate_must_match_intake_type');
        const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content-source/published/catalog.json'), 'utf8'));
        const previous = catalog[candidate.collection].find(record => record.id === candidate.record.id) || null;
        if (item.intent.kind === 'correction') {
          if (candidate.collection !== item.intent.target.collection || candidate.record.id !== item.intent.target.id || !previous) fail('correction_must_preserve_target_id');
        } else if (previous) fail('introduction_cannot_overwrite_listing');
        if (!Array.isArray(candidate.record.sourceUrls) || !candidate.record.sourceUrls.length) fail('public_source_required');
        if (candidate.collection === 'services' && (!(candidate.record.providerIds || []).length || !candidate.record.contactUrl || !candidate.record.contactLabel || !candidate.record.topicIds.length)) fail('service_provider_contact_and_topic_required');
        const staged = structuredClone(catalog);
        staged[candidate.collection] = previous ? staged[candidate.collection].map(record => record.id === previous.id ? candidate.record : record) : staged[candidate.collection].concat(candidate.record);
        if (validateCatalog(staged).length) fail('candidate_catalog_invalid');
        item.review = { ...structuredClone(review), baseHash: hash(previous) };
        item.reviewHash = hash(item.review);
        delete item.approval;
        item.status = 'reviewed';
        recordAudit(item, 'reviewed', review.operator);
        return { id, status: item.status, reviewHash: item.reviewHash };
      });
    },
    approve(id, reviewHash, operator) {
      if (typeof operator !== 'string' || !operator.trim()) fail('operator_required');
      return transact(state => {
        const item = receipt(state, id);
        if (item.status !== 'reviewed' || item.reviewHash !== reviewHash || hash(item.review) !== reviewHash) fail('explicit_current_review_approval_required');
        item.approval = { operator, reviewHash, at: new Date().toISOString() };
        item.status = 'approved'; recordAudit(item, 'approved', operator);
        return { id, status: item.status };
      });
    },
    publish(id) {
      return transact(state => {
        const item = receipt(state, id);
        if (!['approved', 'published'].includes(item.status) || !item.approval || item.approval.reviewHash !== hash(item.review)) fail('publication_requires_approval');
        const source = path.join(root, 'content-source/published/catalog.json');
        const output = path.join(root, 'discovery-data.js');
        const publicationLock = source + '.lock';
        let fd;
        try { fd = fs.openSync(publicationLock, 'wx', 0o600); } catch { fail('catalog_publication_busy'); }
        try {
          const catalog = JSON.parse(fs.readFileSync(source, 'utf8'));
          const { collection, record } = item.review.candidate;
          const previous = catalog[collection].find(value => value.id === record.id) || null;
          const alreadyApplied = hash(previous) === hash(record);
          if (item.status === 'published' && !alreadyApplied) fail('published_listing_has_later_changes');
          if (!alreadyApplied && hash(previous) !== item.review.baseHash) fail('listing_changed_review_again');
          if (!alreadyApplied) catalog[collection] = previous ? catalog[collection].map(value => value.id === record.id ? record : value) : catalog[collection].concat(record);
          if (validateCatalog(catalog).length) fail('candidate_catalog_invalid');
          const browser = renderBrowserFile(catalog);
          // Source is canonical. A retry after either atomic rename regenerates
          // the export and records the receipt without inserting another record.
          if (!alreadyApplied) atomicWrite(source, JSON.stringify(catalog, null, 2) + '\n', 0o644);
          atomicWrite(output, browser, 0o644);
          if (item.status !== 'published') {
            item.status = 'published'; item.publication = { collection, id: record.id, recordHash: hash(record) };
            recordAudit(item, 'published', item.approval.operator);
          }
          return { id, status: item.status, listingId: record.id, duplicate: alreadyApplied };
        } finally { fs.closeSync(fd); fs.unlinkSync(publicationLock); }
      });
    },
  };
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!/^--[a-z-]+$/.test(args[i] || '') || !args[i + 1]) fail('invalid_arguments');
    options[args[i].slice(2)] = args[i + 1];
  }
  const store = openStore(options['private-dir'] || process.env.LUMEYA_EDITORIAL_DIR);
  const readPrivate = () => {
    const file = fs.realpathSync(options.file || fail('private_file_required'));
    if (!inside(file, store.directory) || (fs.statSync(file).mode & 0o077)) fail('input_file_must_be_private_mode_600');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  };
  let result;
  if (command === 'receive') result = store.receive(readPrivate(), { channel: 'manual-import' });
  else if (command === 'import') {
    const row = readPrivate();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id || '') || !['website', 'telegram'].includes(row.source_channel) || !Number.isFinite(Date.parse(row.created_at))) fail('original_remote_receipt_required');
    const payload = {};
    for (const key of ['request_type', 'subject', 'details', 'listing_type', 'location', 'preference', 'contact', 'reference_url', 'source_page']) payload['p_' + key] = row[key] || null;
    result = store.receive(payload, { channel: row.source_channel, remoteId: row.id, receivedAt: row.created_at });
  } else if (command === 'list') result = store.list();
  else if (command === 'inspect') {
    const item = store.inspect(options.id);
    const destination = path.join(store.directory, `inspect-${item.id}.json`);
    atomicWrite(destination, JSON.stringify(item, null, 2) + '\n');
    result = { id: item.id, privateFile: destination };
  } else if (command === 'clarify' || command === 'reject') result = store.note(options.id, command === 'clarify' ? 'clarification' : 'rejected', readPrivate());
  else if (command === 'review') result = store.review(options.id, readPrivate());
  else if (command === 'approve') result = store.approve(options.id, options['review-hash'], options.operator);
  else if (command === 'publish') result = store.publish(options.id);
  else fail('use_receive_import_list_inspect_clarify_reject_review_approve_publish');
  // Status, IDs and hashes only. Never print submitted text or exception data.
  console.log(JSON.stringify(result));
}
if (require.main === module) {
  try { main(); } catch (error) { console.error('editorial: operation failed (' + (/^[a-z_]+$/.test(error.message) ? error.message : 'private_operation_error') + ')'); process.exitCode = 1; }
}
module.exports = { openStore, normalizeRequest, atomicWrite, hash };
