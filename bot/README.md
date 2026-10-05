# Lumeya Telegram Bot

This bot contains Lumeya's public request notification worker. Source code is not evidence of a running host or delivery. The accepted MVP uses manual operator receipt review; automatic notification and retention execution remain post-MVP limitations. Legacy scheduling and club workflows remain dormant on the public website.

## Setup Instructions

1. Make sure you have [Node.js](https://nodejs.org/) installed on your machine or server.
2. Open your terminal and navigate to this `bot` folder:
   ```bash
   cd path/to/Santiago/bot
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a file named `.env` in this `bot` directory and add the following keys:

```env
# From @BotFather in Telegram
BOT_TOKEN=replace_with_your_botfather_token

# From your Supabase Project Settings -> API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# The Telegram Chat ID where you want application notifications sent. 
# You can use your own personal Telegram ID for testing.
ADMIN_CHAT_ID=your_telegram_id_here

# Public URL for website login links sent by the bot.
PUBLIC_SITE_URL=https://your-public-site.example

# Optional worker interval; defaults to NOTIFICATION_POLL_MS or 60000
PUBLIC_REQUEST_POLL_MS=60000

# Required only for the disposable live public-MVP database test
SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

**⚠️ IMPORTANT:** For `SUPABASE_SERVICE_ROLE_KEY`, you must use the `service_role` secret key, NOT the public `anon` key. This allows the bot to bypass Row Level Security and approve users. Never expose this key on the frontend!
If a real `BOT_TOKEN` was ever committed or shared, rotate it in BotFather before deploying.

## Running the Bot

To start the bot locally:
```bash
npm start
```

The bot fails closed when any required production variable is missing. The
`public_request` deep-link flow intentionally skips platform profile creation,
stores the request when possible, and directly notifies `ADMIN_CHAT_ID` even if
database persistence fails.

The public forms require the keyed RPC from migration 0017. Current application and acceptance evidence is recorded in [PROJECT_STATE.md](../PROJECT_STATE.md). The existing disposable live contract below remains guarded for an already-existing, positively verified non-production target; do not weaken it or create a cloud branch for this work. It rejects the known Production ref and checks that the URL matches the confirmed branch.

Add these test-only values to the environment when the branch-specific
credentials are available; do not reuse Production credentials or edit the
bot's regular `SUPABASE_URL`/service key to point at a test branch:

```env
LUMEYA_TEST_SUPABASE_URL=https://<existing-branch-ref>.supabase.co
LUMEYA_TEST_SUPABASE_PUBLISHABLE_KEY=<branch-publishable-key>
LUMEYA_TEST_SUPABASE_SERVICE_ROLE_KEY=<branch-service-role-key>
LUMEYA_TEST_SUPABASE_BRANCH_REF=<exact-existing-branch-ref>
LUMEYA_TEST_SUPABASE_BRANCH_CONFIRMATION="I verified <exact-existing-branch-ref> is an existing isolated non-production branch"
```

Then run from `bot/`:

```sh
npm run test:public-mvp
```

The test creates, retries, conflicts and removes isolated synthetic rows; it
checks that exact retries preserve one receipt, changed content does not
overwrite it, distinct keys create distinct rows, direct anonymous reads remain
denied, and invalid content is rejected. Assertions and cleanup logs redact
request content, keys and receipt IDs. Do not run it against Production or any
unconfirmed project. If no safe existing hosted target or its scoped credentials
are available, skip this live test; local SQL validation does not prove hosted
PostgREST behavior.

## Operational boundary

No running bot host, process-manager configuration or retention caller is mapped in the inspected repository. The static Vercel release excludes `bot/`; GitHub runs verification only. Starting this bot also starts other legacy workers, so it is not a bounded public-request activation path by itself. A future operational task needs an explicitly mapped and authorized existing runtime before claiming automatic delivery or scheduled deletion. The MVP's manual private handoff is documented in [the catalog workflow](../docs/catalog-publishing.md); no new hosting or scheduler is part of MVP acceptance.
