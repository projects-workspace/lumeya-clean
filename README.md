# Lumeya

Independent repository for the accepted Lumeya guest discovery MVP. Read [PROJECT_STATE.md](PROJECT_STATE.md) for implementation and verification status, and [AGENTS.md](AGENTS.md) for working boundaries. GitHub origin is [projects-workspace/lumeya-clean](https://github.com/projects-workspace/lumeya-clean). The GitHub repository is public; its predecessor is preserved as a private archive. The existing Lumeya Vercel cutover waits on selected-repository App access; consult current state for its verified status.

The static HTML/CSS/JavaScript frontend has no build step. Run `npm run verify` for catalogue consistency, isolated editorial/events/bot tests and the local release gate. No root package installation is required. Required massage videos are tracked; unreferenced raw footage is excluded.

For isolated request smoke checks, set `LUMEYA_EDITORIAL_DIR` to a private temporary directory outside the repository, then run `npm run dev:editorial`. The preview binds loopback and stores local receipts. Intercept hosted requests in browser automation; never submit synthetic data through the production client.

Publication requires private review and explicit approval; see [the catalogue workflow](docs/catalog-publishing.md). The optional server request service is described in [bot/README.md](bot/README.md). Its credentials and runtime are not configured in this repository.

See [the cleanup audit](docs/clean-repo-audit.md) for deliberate removals, retained catalogue names/contact compatibility, byte comparisons and the future cutover boundary.
