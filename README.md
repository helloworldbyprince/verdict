# VERDICT

**The coding agent that proves it fixed your bug.**

VERDICT is a proof-first coding agent for public JavaScript and TypeScript repositories. Give it a GitHub repository and a concrete bug; it investigates, researches cited evidence, opens a minimal draft patch, and lets GitHub Actions—not the model—decide whether the fix is real.

> Don't trust the agent. Verify it.

## The pipeline

1. **Triage** — NVIDIA Nemotron reads the repository tree and identifies real suspect files and failing tests.
2. **Research** — Tavily searches for relevant upstream issues and documentation, returning linked evidence.
3. **Patch** — NVIDIA Nemotron writes a constrained unified diff on an isolated `verdict/<run-id>` branch and opens a draft PR.
4. **Verify** — a deterministic, zero-AI verifier reads GitHub Actions results. It returns `PROVEN` only when target tests pass and no new failures appear.
5. **Decide** — only the developer can Allow or Deny the patch. Unproven work cannot be merged from the UI.

Every model call uses NVIDIA Nemotron through the OpenAI-compatible Nebius Token Factory endpoint. Tavily is a runtime pipeline dependency: its URLs and excerpts are rendered directly as evidence on the verdict card.

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without credentials, the product automatically uses a polished showcase run so the entire UI and approval flow remain testable.

For the live pipeline, configure:

```dotenv
NEBIUS_API_KEY=
NEBIUS_BASE_URL=
NEBIUS_MODEL_STRONG=
NEBIUS_MODEL_FAST=
TAVILY_API_KEY=
GITHUB_TOKEN=
GITHUB_OWNER=
```

Do not invent the Nemotron model IDs. Copy the currently available strong and fast model IDs from the Nebius Token Factory playground. The GitHub token needs `repo` and `workflow` scopes for branch, draft PR, Actions, and merge operations.

Test the configured fast model with:

```bash
curl http://localhost:3000/api/smoke
```

## Commands

```bash
npm run dev      # local development
npm test         # deterministic verdict unit tests
npm run build    # production build
npm start        # run the production build
```

## Safety guarantees

- The patcher never writes to the default branch.
- The verifier makes no model call.
- `PROVEN` requires successful CI and zero new failures.
- Evidence always retains its source URL.
- Patches above the configured diff limit are rejected.
- Nothing is merged without an explicit Allow decision.
- Timeouts fail loudly and become an `ERROR` verdict.

## Architecture

The Next.js 15 App Router frontend polls in-memory run state from route handlers. The orchestrator executes the four stages sequentially. GitHub's REST API supplies repository content, isolated Git objects, draft PRs, check runs, and merge operations. Configuration, token caps, polling intervals, and timeouts live in `src/lib/config.ts`.

Run state is intentionally ephemeral for the hackathon build. Production hardening should move orchestration and run state into a durable queue and database before serving concurrent public traffic.

## License

[MIT](LICENSE) · Built for the Nebius × NVIDIA Global AI Hackathon 2026.
