require('dotenv').config();
console.log('[Bot] Script started');
const { Telegraf, session } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// ── ENV CONFIG ──
const BOT_TOKEN = String(process.env.BOT_TOKEN || '').trim();
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const ADMIN_CHAT_ID = String(process.env.ADMIN_CHAT_ID || '').trim();
const PUBLIC_SITE_URL = String(process.env.PUBLIC_SITE_URL || '').trim();
const NOTIFICATION_POLL_MS = Number(process.env.NOTIFICATION_POLL_MS || 60000);
const PUBLIC_REQUEST_POLL_MS = Number(process.env.PUBLIC_REQUEST_POLL_MS || NOTIFICATION_POLL_MS || 60000);

const requiredEnv = {
  BOT_TOKEN,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_KEY,
  ADMIN_CHAT_ID,
  PUBLIC_SITE_URL
};
const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingEnv.length) {
  console.error(`[Bot] Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

let parsedPublicSiteUrl;
let parsedSupabaseUrl;
try {
  parsedPublicSiteUrl = new URL(PUBLIC_SITE_URL);
  parsedSupabaseUrl = new URL(SUPABASE_URL);
} catch (error) {
  console.error('[Bot] PUBLIC_SITE_URL and SUPABASE_URL must be absolute URLs.');
  process.exit(1);
}

if (parsedPublicSiteUrl.protocol !== 'https:' || parsedPublicSiteUrl.username || parsedPublicSiteUrl.password) {
  console.error('[Bot] PUBLIC_SITE_URL must be an HTTPS URL without embedded credentials.');
  process.exit(1);
}

if (parsedSupabaseUrl.protocol !== 'https:' || parsedSupabaseUrl.username || parsedSupabaseUrl.password) {
  console.error('[Bot] SUPABASE_URL must be an HTTPS URL without embedded credentials.');
  process.exit(1);
}

if (!/^-?[1-9]\d*$/.test(ADMIN_CHAT_ID)) {
  console.error('[Bot] ADMIN_CHAT_ID must be a numeric Telegram chat ID.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
bot.use(session());

function getFullName(from) {
  return [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Telegram User';
}

function compactText(value, max = 900) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function extractPublicRequestValue(text, label) {
  const match = String(text || '').match(new RegExp(`^${label}:\\s*(.+)$`, 'im'));
  return match ? match[1].trim() : null;
}

function publicRequestRecord(ctx, text) {
  const normalized = String(text || '').trim();
  const declaredType = /Lumeya public request:\s*suggest_listing/i.test(normalized)
    ? 'suggest_listing'
    : 'looking_for';
  const listedType = String(extractPublicRequestValue(normalized, 'Listing type') || '').toLowerCase();
  const allowedListingTypes = ['practitioner', 'service', 'place'];
  const requestType = declaredType === 'suggest_listing' && allowedListingTypes.includes(listedType)
    ? 'suggest_listing'
    : 'looking_for';
  const preference = String(extractPublicRequestValue(normalized, 'Preference') || '').toLowerCase();
  const detailsMarker = normalized.match(/(?:^|\n)Details:\s*\n?/i);
  const details = (detailsMarker
    ? normalized.slice(detailsMarker.index + detailsMarker[0].length)
    : normalized
  ).trim().slice(0, 2500);

  return {
    request_type: requestType,
    listing_type: requestType === 'suggest_listing' ? listedType : null,
    subject: (extractPublicRequestValue(normalized, 'Subject') || 'Telegram public request').slice(0, 160),
    details,
    location: (extractPublicRequestValue(normalized, 'Location') || '').slice(0, 160) || null,
    preference: requestType === 'looking_for' && ['online', 'in_person', 'either'].includes(preference)
      ? preference
      : null,
    contact: (extractPublicRequestValue(normalized, 'Contact') || `Telegram user ${ctx.from.id}`).slice(0, 240),
    reference_url: (extractPublicRequestValue(normalized, 'Link') || '').slice(0, 500) || null,
    source_page: null,
    source_channel: 'telegram'
  };
}

async function finishPublicRequestFallback(ctx, text) {
  const normalized = String(text || '').trim();
  if (normalized.length < 10) {
    await ctx.reply('Please paste the full request details (at least 10 characters).');
    return;
  }
  if (normalized.length > 3500) {
    await ctx.reply('The request is too long. Please shorten it to 3,500 characters and send it again.');
    return;
  }

  const record = publicRequestRecord(ctx, normalized);
  let storedRequestId = null;
  let stored = false;
  let notified = false;

  try {
    const { data, error } = await supabase
      .from('public_discovery_requests')
      .insert(record)
      .select('id')
      .single();

    if (error) throw error;
    storedRequestId = data?.id || null;
    stored = true;
  } catch (error) {
    console.error('[Bot] Public request storage failed:', error?.message || error);
  }

  try {
    const adminText = [
      'New Lumeya public request',
      '',
      `From: ${getFullName(ctx.from)}`,
      `Telegram: @${ctx.from.username || 'n/a'} (${ctx.from.id})`,
      `Database: ${stored ? 'stored' : 'not stored'}`,
      '',
      normalized
    ].join('\n').slice(0, 4000);
    await bot.telegram.sendMessage(ADMIN_CHAT_ID, adminText);
    notified = true;

    if (storedRequestId) {
      const { error: markError } = await supabase
        .from('public_discovery_requests')
        .update({
          notification_status: 'notified',
          admin_notified_at: new Date().toISOString(),
          admin_notify_error: null
        })
        .eq('id', storedRequestId);
      if (markError) console.error('[Bot] Public request notification mark failed:', markError);
    }
  } catch (error) {
    console.error('[Bot] Public request admin notification failed:', error?.message || error);
  }

  if (!stored && !notified) {
    await ctx.reply('We could not deliver the request right now. Please keep your copied text and try again later.');
    return;
  }

  ctx.session = null;
  await ctx.reply('Thank you. Your request has been received.');
}

bot.start(async (ctx) => {
  ctx.session = { state: 'public_request_message' };
  return ctx.reply('Paste the request details you copied from Lumeya. Send them as one text message.');
});
bot.on('text', async (ctx) => {
  if (ctx.session?.state === 'public_request_message') return finishPublicRequestFallback(ctx, ctx.message.text);
  return ctx.reply('Open the public request link from Lumeya to begin.');
});

let publicRequestWorkerBusy = false;

function buildPublicDiscoveryRequestAdminText(request) {
  const requestType = request.request_type === 'suggest_listing' ? 'Listing suggestion' : 'Service demand';
  return [
    'New Lumeya public request',
    '',
    `Type: ${requestType}`,
    request.listing_type ? `Listing type: ${request.listing_type}` : null,
    `Subject: ${compactText(request.subject, 160)}`,
    request.location ? `Location: ${compactText(request.location, 160)}` : null,
    request.preference ? `Preference: ${request.preference}` : null,
    `Contact: ${compactText(request.contact, 240)}`,
    request.reference_url ? `Link: ${compactText(request.reference_url, 500)}` : null,
    request.source_page ? `Source: ${compactText(request.source_page, 500)}` : null,
    '',
    compactText(request.details, 2500)
  ].filter((line) => line !== null).join('\n').slice(0, 4000);
}

async function markPublicDiscoveryRequest(requestId, patch) {
  const { error } = await supabase
    .from('public_discovery_requests')
    .update(patch)
    .eq('id', requestId);
  if (error) console.error('[Bot] Public request notification state update failed:', error);
}

async function processPublicDiscoveryRequest(request) {
  try {
    await bot.telegram.sendMessage(ADMIN_CHAT_ID, buildPublicDiscoveryRequestAdminText(request));
    await markPublicDiscoveryRequest(request.id, {
      notification_status: 'notified',
      admin_notified_at: new Date().toISOString(),
      admin_notify_error: null
    });
  } catch (error) {
    console.error('[Bot] Public request admin notification failed:', error?.message || error);
    await markPublicDiscoveryRequest(request.id, {
      notification_status: 'failed',
      admin_notify_error: compactText(error?.message || 'telegram_send_failed', 500)
    });
  }
}

async function processPublicDiscoveryRequests() {
  if (publicRequestWorkerBusy) return;
  publicRequestWorkerBusy = true;

  try {
    const { data: requests, error } = await supabase.rpc('claim_public_discovery_requests', {
      p_limit: 20
    });
    if (error) {
      console.error('[Bot] Public request claim failed:', error);
      return;
    }

    for (const request of requests || []) {
      await processPublicDiscoveryRequest(request);
    }
  } catch (error) {
    console.error('[Bot] Public request notification worker failed:', error);
  } finally {
    publicRequestWorkerBusy = false;
  }
}

function startPublicRequestWorker() {
  if (!Number.isFinite(PUBLIC_REQUEST_POLL_MS) || PUBLIC_REQUEST_POLL_MS <= 0) {
    console.log('[Bot] Public request worker disabled');
    return;
  }

  console.log(`[Bot] Public request worker polling every ${PUBLIC_REQUEST_POLL_MS}ms`);
  setTimeout(processPublicDiscoveryRequests, 4000);
  setInterval(processPublicDiscoveryRequests, PUBLIC_REQUEST_POLL_MS);
}

bot.launch().then(() => {
  console.log('[Bot] Lumeya public request service started');
  startPublicRequestWorker();
}).catch((error) => {
  console.error('[Bot] Launch failed:', error?.message || error);
  process.exitCode = 1;
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
