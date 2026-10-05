# Lumeya-Clean working instructions

## Identity and state

This is the independent Lumeya guest discovery repository. Root `PROJECT_STATE.md` is the sole implementation snapshot; it records the source SHA and local verification. README is an entry point, not another state snapshot. Treat archived acceptance documents as historical evidence.

Stage 1: `../Projects/Lumeya/Lumeya_Stage_1_Updated_Version.docx`. Stage 2: `../Projects/Lumeya/Lumeya — Stage 2_ Desired Platform _ Product Structure.md`. Other supplementary mappings are not configured. Read relevant sections only; intent documents do not expand task scope.

## Isolation and delivery

The mixed source and the independently recovered legacy project are separate repositories. Do not modify them, import their Git history, copy local/untracked/environment files, share Git objects, or attach their remotes/deployment state. This repository is on main with SSH origin `git@github.com:projects-workspace/lumeya-clean.git`. The user authorized the new GitHub repository and a cutover of the existing Lumeya Vercel project on 2026-10-05, preserving the mixed repository and previous deployment for rollback. See PROJECT_STATE.md for the actual completed service steps; authorization alone does not prove deployment. Never reapply migrations or delete old resources. No paid-plan change, live submission or external message is authorized. A repository visibility change requires the pending explicit owner decision.

## Product and security

Preserve the seven primary public routes and their supporting catalogue/detail/request routes, published content/IDs, forced-English behavior, accessibility, keyed request contract and manual editorial approval loop. No redesign or private platform expansion. Browser identity must remain guest-only; Telegram IDs/URL values/storage never authenticate. Old identity keys in `auth.js` are deletion-only protection.

Catalogue place/format/organizer names are factual published entities, not the product identity. The preserved operator Telegram handle is an accepted compatibility endpoint; renaming it needs a separately authorized verified replacement. Do not fabricate contacts or rename stable catalogue IDs to erase a string match. See the audit's explicit retention reasons.

Only the dedicated Lumeya publishable configuration may appear in browser code. Never read, print, copy or commit local credentials. Service-role keys belong only in separately authorized server environments. Migrations 0016 and 0017 are preserved applied contracts; this repository is not a fresh-database bootstrap. Never replay old schemas or use production for destructive tests.

## Checks and maintenance

The frontend has no build. Run `npm run verify`; `verify:static-only` omits loopback checks when binding is unavailable. Use the existing local preview with private temporary receipts and hosted writes blocked for synthetic browser tests. Do not run `bot` live tests, start its worker, or connect external services without an explicit authorized operation and confirmed target.

Preserve unrelated work. Update affected state sections for material changes; keep historical acceptance evidence clearly scoped. Use English for docs/prompts, preserve product language decisions. No usage-percentage tracking.
