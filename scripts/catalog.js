'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'content-source', 'published', 'catalog.json');
const OUTPUT_FILE = path.join(ROOT, 'discovery-data.js');
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const COLLECTIONS = {
  categories: ['id', 'label', 'description', 'topicIds'],
  topics: ['id', 'label', 'description', 'categoryId'],
  services: ['id', 'title', 'description', 'status', 'format', 'delivery', 'topicIds'],
  providers: ['id', 'type', 'name', 'shortDescription', 'topicIds'],
  places: ['id', 'name', 'description', 'status', 'topicIds'],
  eventFormats: ['id', 'title', 'description', 'kind', 'status', 'topicIds'],
  scheduledEvents: ['id', 'title', 'startAt', 'status'],
};

// Only these reviewed public fields may leave the editorial source.
const PUBLIC_FIELDS = {
  categories: 'id label description topicIds',
  topics: 'id label description categoryId',
  services: 'id slug title description status format delivery duration location price topicIds providerIds practitionerIds placeIds eventFormatIds provider detailUrl contactUrl contactLabel sourceUrls sourceNote',
  providers: 'id slug type name shortDescription approach fields topicIds location city country coordinates coordinatesVerified coordinateSourceUrl locationPrecision languages onlineAvailability experience serviceIds placeIds eventFormatIds providerIds externalLinks image imageAlt profileUrl detailUrl contactUrl contactLabel sourceUrls sourceNote',
  places: 'id slug name description status type topicIds location address city country coordinates coordinatesVerified coordinateSourceUrl locationPrecision providerIds practitionerIds serviceIds eventFormatIds detailUrl mapUrl contactUrl contactLabel sourceUrls sourceNote',
  eventFormats: 'id slug title description kind status format topicIds location organizer providerIds practitionerIds placeIds serviceIds detailUrl contactUrl contactLabel sourceUrls sourceNote',
  scheduledEvents: 'id title description startAt endAt status location organizer providerIds practitionerIds placeIds serviceIds url contactUrl contactLabel sourceUrls sourceNote',
};
for (const name of Object.keys(PUBLIC_FIELDS)) {
  PUBLIC_FIELDS[name] = new Set(('publicationStatus ' + PUBLIC_FIELDS[name]).split(' '));
}

const RELATIONSHIPS = {
  categories: { topicIds: 'topics' },
  topics: { categoryId: 'categories' },
  services: {
    topicIds: 'topics', providerIds: 'providers', practitionerIds: 'providers',
    placeIds: 'places', eventFormatIds: 'eventFormats',
  },
  providers: {
    topicIds: 'topics', providerIds: 'providers', serviceIds: 'services', placeIds: 'places', eventFormatIds: 'eventFormats',
  },
  places: {
    topicIds: 'topics', providerIds: 'providers', practitionerIds: 'providers',
    serviceIds: 'services', eventFormatIds: 'eventFormats',
  },
  eventFormats: {
    topicIds: 'topics', providerIds: 'providers', practitionerIds: 'providers',
    placeIds: 'places', serviceIds: 'services',
  },
  scheduledEvents: {
    providerIds: 'providers', practitionerIds: 'providers', placeIds: 'places', serviceIds: 'services',
  },
};

function readSource() {
  return JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateLink(value, label, errors) {
  if (typeof value !== 'string' || !value.trim()) return;
  const link = value.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(link)) {
    try {
      const parsed = new URL(link);
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
        errors.push(`${label} uses an unsupported URL scheme.`);
      }
      if (parsed.username || parsed.password) errors.push(`${label} must not contain URL credentials.`);
      if (parsed.protocol === 'mailto:' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.pathname)) errors.push(`${label} must contain a replyable email address.`);
      if (parsed.protocol === 'tel:' && (parsed.pathname.replace(/\D/g, '').length < 7 || parsed.pathname.replace(/\D/g, '').length > 15)) errors.push(`${label} must contain a valid phone number.`);
    } catch {
      errors.push(`${label} is not a valid URL.`);
    }
    return;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('//')) {
    errors.push(`${label} must use http, https, mailto, tel, or a local site path.`);
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(link.split(/[?#]/, 1)[0]); }
  catch { errors.push(`${label} has invalid URL encoding.`); return; }
  if (!pathname || pathname === '/') return;
  if (pathname.split('/').some(part => part.startsWith('.')) || /^(?:bot|scripts|verify|docs|content-source)(?:\/|$)/.test(pathname.replace(/^\//, '')) || !/\.(?:html|png|jpe?g|webp|gif|svg|ico|mp4|mov)$/i.test(pathname)) {
    errors.push(`${label} must point to a public page or asset.`);
    return;
  }
  const target = path.resolve(ROOT, pathname.replace(/^\//, ''));
  if (target !== ROOT && !target.startsWith(`${ROOT}${path.sep}`)) {
    errors.push(`${label} points outside the project.`);
  } else if (!fs.existsSync(target)) {
    errors.push(`${label} points to missing local file ${pathname}.`);
  }
}

function validateLinks(record, label, errors) {
  for (const [key, value] of Object.entries(record)) {
    if (/(?:url|href|image)$/i.test(key) && typeof value === 'string') {
      validateLink(value, `${label}.${key}`, errors);
    } else if (Array.isArray(value) && key === 'externalLinks') {
      value.forEach((item, index) => {
        if (isPlainObject(item)) validateLink(item.url, `${label}.externalLinks[${index}].url`, errors);
      });
    }
  }
}

function validateCatalog(catalog) {
  const errors = [];
  if (!isPlainObject(catalog) || catalog.schemaVersion !== 1) {
    return ['catalog.json must be an object with schemaVersion 1.'];
  }
  if (Object.keys(catalog).some(key => !['schemaVersion', 'version', ...Object.keys(COLLECTIONS)].includes(key))) errors.push('catalog.json contains a field outside the public schema.');

  const idOwners = new Map();
  const byCollection = {};
  for (const [collection, requiredFields] of Object.entries(COLLECTIONS)) {
    const records = catalog[collection];
    if (!Array.isArray(records)) {
      errors.push(`${collection} must be an array.`);
      byCollection[collection] = new Map();
      continue;
    }
    const index = new Map();
    byCollection[collection] = index;
    records.forEach((record, position) => {
      const label = `${collection}[${position}]`;
      if (!isPlainObject(record)) {
        errors.push(`${label} must be an object.`);
        return;
      }
      if (record.publicationStatus !== 'published') {
        errors.push(`${label} must have publicationStatus "published"; drafts and fixtures belong outside the published catalog.`);
      }
      for (const [field, value] of Object.entries(record)) {
        if (!PUBLIC_FIELDS[collection].has(field)) errors.push(`${label}.${field} is not an approved public field.`);
        if (value && typeof value === 'object' && !Array.isArray(value)) errors.push(`${label}.${field} cannot contain nested private data.`);
        if (Array.isArray(value) && field !== 'externalLinks' && value.some(item => item && typeof item === 'object')) errors.push(`${label}.${field} cannot contain nested private data.`);
      }
      if (record.externalLinks && (!Array.isArray(record.externalLinks) || record.externalLinks.some(item => !isPlainObject(item) || Object.keys(item).some(key => !['label', 'url'].includes(key)) || typeof item.label !== 'string' || typeof item.url !== 'string'))) {
        errors.push(`${label}.externalLinks must contain public label/url pairs only.`);
      }
      if (record.sourceUrls !== undefined) {
        if (!Array.isArray(record.sourceUrls) || record.sourceUrls.some(url => typeof url !== 'string' || !url.trim())) errors.push(`${label}.sourceUrls must be a list of public source links.`);
        else record.sourceUrls.forEach((url, i) => validateLink(url, `${label}.sourceUrls[${i}]`, errors));
      }
      for (const field of requiredFields) {
        if (record[field] === undefined || record[field] === null || record[field] === '') {
          errors.push(`${label}.${field} is required.`);
        }
        if (field !== 'topicIds' && (typeof record[field] !== 'string' || !record[field].trim())) errors.push(`${label}.${field} must be public text.`);
      }
      if (typeof record.id !== 'string') errors.push(`${label}.id must be a stable lowercase slug.`);
      if (typeof record.id === 'string') {
        if (!ID_PATTERN.test(record.id)) errors.push(`${label}.id must be a stable lowercase slug.`);
        if (idOwners.has(record.id)) errors.push(`${label}.id duplicates ${idOwners.get(record.id)}.`);
        else idOwners.set(record.id, label);
        index.set(record.id, record);
      }
      validateLinks(record, label, errors);
    });
  }

  for (const [collection, fields] of Object.entries(RELATIONSHIPS)) {
    const records = Array.isArray(catalog[collection]) ? catalog[collection] : [];
    for (const [field, targetCollection] of Object.entries(fields)) {
      const target = byCollection[targetCollection] || new Map();
      records.forEach((record, position) => {
        const ids = record && record[field];
        if (ids === undefined || ids === null) return;
        const list = Array.isArray(ids) ? ids : (field === 'categoryId' ? [ids] : null);
        if (!list) {
          errors.push(`${collection}[${position}].${field} must be an array${field === 'categoryId' ? ' or a category ID' : ''}.`);
          return;
        }
        list.forEach((id) => {
          if (!target.has(id)) errors.push(`${collection}[${position}].${field} refers to unknown ${targetCollection} ID "${id}".`);
        });
      });
    }
  }

  for (const [position, event] of (Array.isArray(catalog.scheduledEvents) ? catalog.scheduledEvents : []).entries()) {
    const start = Date.parse(event && event.startAt);
    if (!Number.isFinite(start) || !/^\d{4}-\d{2}-\d{2}T/.test(event.startAt || '')) {
      errors.push(`scheduledEvents[${position}].startAt must be a complete ISO date and time.`);
    }
    if (event && event.endAt) {
      const end = Date.parse(event.endAt);
      if (!Number.isFinite(end) || (Number.isFinite(start) && end <= start)) {
        errors.push(`scheduledEvents[${position}].endAt must be a valid date later than startAt.`);
      }
    }
    if (event && event.publicationStatus === 'published' && Number.isFinite(start) && start <= Date.now()) {
      errors.push(`scheduledEvents[${position}] is published but its startAt is not upcoming.`);
    }
  }

  for (const [collection, records] of ['providers', 'places'].map((name) => [name, catalog[name] || []])) {
    records.forEach((record, position) => {
      if (!record || record.coordinates == null) {
        if (record && record.coordinatesVerified === true) {
          errors.push(`${collection}[${position}].coordinatesVerified cannot be true without coordinates.`);
        }
        return;
      }
      const coordinates = record.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length !== 2 ||
          !coordinates.every((value) => Number.isFinite(Number(value))) ||
          Math.abs(Number(coordinates[0])) > 90 || Math.abs(Number(coordinates[1])) > 180) {
        errors.push(`${collection}[${position}].coordinates must be a valid [latitude, longitude] pair.`);
      }
      if (record.coordinatesVerified !== true) {
        errors.push(`${collection}[${position}] has coordinates that are not explicitly verified.`);
      }
      if (!record.coordinateSourceUrl) {
        errors.push(`${collection}[${position}] requires coordinateSourceUrl for a verified map point.`);
      }
    });
  }

  for (const provider of Array.isArray(catalog.providers) ? catalog.providers : []) {
    if (provider && !['practitioner', 'organisation'].includes(provider.type)) {
      errors.push(`providers.${provider.id || '(missing id)'}.type must be practitioner or organisation.`);
    }
  }
  return errors;
}

function publicRecords(records) {
  return records.filter((record) => record.publicationStatus === 'published').map((record) => {
    const { publicationStatus, ...publicRecord } = record;
    return publicRecord;
  });
}

function buildBrowserData(catalog) {
  const providers = publicRecords(catalog.providers);
  return {
    version: String(catalog.version || '1.0.0'),
    categories: publicRecords(catalog.categories),
    topics: publicRecords(catalog.topics),
    services: publicRecords(catalog.services),
    providers,
    practitioners: providers.filter((provider) => provider.type === 'practitioner'),
    places: publicRecords(catalog.places),
    eventFormats: publicRecords(catalog.eventFormats),
    scheduledEvents: publicRecords(catalog.scheduledEvents),
  };
}

function renderBrowserFile(catalog) {
  const json = JSON.stringify(buildBrowserData(catalog), null, 2).replace(/</g, '\\u003c');
  return `(function (root) {\n  'use strict';\n\n  var data = ${json};\n\n  data.getById = function (collection, id) {\n    var records = data[collection];\n    if (!Array.isArray(records)) return null;\n    for (var index = 0; index < records.length; index += 1) {\n      if (records[index].id === id) return records[index];\n    }\n    return null;\n  };\n\n  data.related = function (record, collection, field) {\n    var ids = record && Array.isArray(record[field]) ? record[field] : [];\n    return ids.map(function (id) { return data.getById(collection, id); }).filter(Boolean);\n  };\n\n  root.LumeyaData = data;\n  if (root.document) {\n    var event;\n    if (typeof root.CustomEvent === 'function') {\n      event = new root.CustomEvent('lumeya:data-ready', { detail: data });\n    } else {\n      event = root.document.createEvent('CustomEvent');\n      event.initCustomEvent('lumeya:data-ready', false, false, data);\n    }\n    root.document.dispatchEvent(event);\n  }\n})(window);\n`;
}

function reportValidation(errors) {
  if (errors.length) {
    errors.forEach((error) => console.error(`catalog: ${error}`));
    return false;
  }
  return true;
}

function main() {
  const mode = process.argv[2] || 'validate';
  let catalog;
  try {
    catalog = readSource();
  } catch (error) {
    console.error(`catalog: could not read ${path.relative(ROOT, SOURCE_FILE)}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const errors = validateCatalog(catalog);
  if (!reportValidation(errors)) {
    process.exitCode = 1;
    return;
  }

  if (mode === 'validate') {
    console.log('catalog: source records, relationships, links, and dates are valid');
  } else if (mode === 'check') {
    const expected = renderBrowserFile(catalog);
    const actual = fs.readFileSync(OUTPUT_FILE, 'utf8');
    if (actual !== expected) {
      console.error('catalog: discovery-data.js is out of date; run npm run catalog:publish');
      process.exitCode = 1;
      return;
    }
    console.log('catalog: public browser data matches the validated published source');
  } else if (mode === 'publish') {
    fs.writeFileSync(OUTPUT_FILE, renderBrowserFile(catalog));
    console.log(`catalog: published ${path.relative(ROOT, OUTPUT_FILE)}`);
  } else {
    console.error('Usage: node scripts/catalog.js [validate|check|publish]');
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = { validateCatalog, buildBrowserData, renderBrowserFile, PUBLIC_FIELDS };
