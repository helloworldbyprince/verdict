# SPEC.md — VERDICT · The coding agent that proves it fixed your bug
### Nebius × NVIDIA Global AI Hackathon 2026 · Coding & Agentic Engineering Track · v1.0 · 2026-10-15

> **How to use this spec:** This is the single build contract — the "brain" of the project. Your AI builder (Codex or Google Antigravity) reads it and writes code; you do not need to explain anything yourself. **Paste ONE phase prompt from §11 at a time** — never the whole file. Every number, model ID, limit, and timeout lives in `lib/config.ts` (§10). If any section conflicts, the **wireframes (§9.4)** win on UI, the **pipeline contract (§2)** wins on agent behavior.

**App name:** VERDICT · **Tagline:** "Don't trust the agent. Verify it." · **Repo:** `verdict` (public, MIT license) · **Hackathon:** Nebius × NVIDIA Global AI Hackathon 2026 · **Devpost:** https://nebiusglobalaihackathon.devpost.com/ · **Deadline:** 30 Oct 2026, 10:30 PM IST (submit 29 Oct evening)

---

## 0. Product in one paragraph

VERDICT is a web app where a developer pastes a GitHub repo URL and describes a bug (or picks a failing test). Four AI agents take over: Triage reproduces the failure, Researcher finds the real upstream cause on the web with citations, Patcher writes the fix on a new branch, and Verifier runs the repo's test suite on that branch through GitHub Actions. The app then shows a **verdict card**: which tests failed before, which pass now, the exact code diff, and the cited evidence. If the tests do not prove the fix, it says so honestly — "could not prove fixed" — instead of lying. Nothing is applied without the developer pressing **Allow** (or Deny). Every AI call runs on NVIDIA Nemotron models through Nebius Token Factory. The whole build costs ₹0 — every service used has a free tier.

## 1. The idea and why it wins

**The one-line pitch:** "AI coding assistants lie to you. I built one that can't."

**The problem:** AI coding tools write code and ask developers to trust it. They hallucinate fixes, break other tests silently, and never show proof. Developers have learned not to trust them.

**The inversion:** VERDICT never asks for trust. It treats the AI as one untrusted component inside a deterministic verification system. The model proposes; the sandbox disposes. Proof is a test suite turning green, not a confident sentence.

**Why it maps to the judging criteria:**
- **Technological Implementation:** Nemotron is load-bearing (it writes the patch and the tests would not exist without it); Nebius Token Factory serves every model call; the sandbox (GitHub Actions CI) is load-bearing (no verdict without it). Multi-agent with narrow roles, not one prompt.
- **Design:** A verdict card, not a chat panel. A complete product experience: timeline of agents working, evidence cards, diff viewer, Allow/Deny gate.
- **Potential Impact:** Real audience (developers — including the 100,000+ on the founder's channel), real problem (untrusted AI fixes), stated in the first line.
- **Quality of Idea:** The creative inversion — "an AI that refuses to lie." The honest "could not prove fixed" state is the memorable differentiator.

**The Tavily angle (extra $3,000 prize in the same project):** the Researcher agent uses Tavily as a pipeline stage — it finds the actual upstream GitHub issue / Stack Overflow thread / docs page behind the exact error and cites it on the verdict card. Tavily is load-bearing (grounding the fix in real-world evidence), outputs carry citations, and the demo visibly shows the Tavily call. This is the proven shape of past "Best Use of Tavily" winners.

**The demo's emotional peak:** the Allow/Deny gate. The card says "3 tests now pass. Apply this patch?" and the human decides. Winners stage consent as the climax — we do it literally.

## 2. The pipeline contract (the builder implements EXACTLY this)

```
① INPUT
   User pastes: GitHub repo URL (public, JS/TS, has `npm test`) + bug description
   (or picks from the repo's recent failed Actions runs — v1: manual input only)

② TRIAGE AGENT (Nemotron, strong reasoning model)
   Reads repo structure via GitHub API (no clone needed for reading)
   Identifies the failing area from the bug description + test files
   Output: { suspectedFiles[], failingTests[], reproductionNotes }

③ RESEARCHER AGENT (Nemotron fast model + Tavily)
   Tavily searches the exact error message / stack trace (max 3 searches per run)
   Returns top sources with URL + title + snippet
   Output: evidence cards [{ source, url, quote, relevance }] — every claim cited

④ PATCHER AGENT (Nemotron, strong reasoning model)
   Writes a unified diff patch (never full-file rewrites)
   Creates branch `verdict/<run-id>`, commits the patch, opens a DRAFT PR
   Output: { branch, prUrl, diff }

⑤ VERIFIER (deterministic — NO AI here)
   Triggers the repo's GitHub Actions test workflow on the new branch
   Polls the Checks API until conclusion (timeout from config)
   Compares: tests failing BEFORE vs tests passing AFTER
   Output: verdict = PROVEN | NOT_PROVEN | ERROR

⑥ VERDICT CARD (the hero UI)
   PROVEN → green card: failing→passing test list, diff, evidence citations,
             "Why? ⓘ" on every claim, [Allow] [Deny] gate
   NOT_PROVEN → amber card: "Could not prove fixed." Shows what was tried,
             partial results, no false claim. [Deny] only (branch kept for inspection)
   ERROR → red card: what failed (timeout, no test script, etc.) + what to do

⑦ APPLY (only on Allow)
   Merges the draft PR (or shows copy-paste patch instructions if merge fails)
   Logs the decision; branch retained for audit
```

**Pipeline rules (non-negotiable):**
- The Verifier never uses AI. Test results come only from GitHub Actions check runs.
- The Patcher never commits to the default branch. Always `verdict/<run-id>`.
- The app never claims "fixed" unless the target tests pass AND no new failures appeared.
- Every Tavily claim on the card links to its source URL.
- Timeouts everywhere (§10). A stuck agent fails loudly, never silently.

## 3. Tech stack (decided — each choice with its WHY)

| Layer | Choice | WHY this, specifically |
|---|---|---|
| Frontend | **Next.js 15 App Router + React + Tailwind v4** | One codebase, fast to build, deploys free on Vercel. The team already ships this stack (ZeroGap). |
| AI models | **NVIDIA Nemotron via Nebius Token Factory** | HARD hackathon requirement: must use an NVIDIA open model served on Nebius. Token Factory is OpenAI-compatible, so the standard OpenAI SDK works — no exotic client code. Two roles: strong reasoning model for Triage/Patcher, fast cheap model for Researcher/everyday calls (the hackathon's own guidance: let the small model handle fast calls so credits stretch). |
| Web research | **Tavily API** (`/search`) | Built for agents; 1,000 free calls/month, no card. Powers the cited-evidence cards AND is the $3,000 "Best Use of Tavily" prize shot. Basic search = 1 credit — our usage (≤3 searches per bug run) is far inside the free tier. |
| Test sandbox | **GitHub Actions** (on the public repo) | Deterministic, real CI, and **free: 2,000 minutes/month for public repos**. Zero infra to run, zero cost, and judges trust CI output. The agent pushes a branch; Actions runs `npm test`; the app reads the check-run conclusion. No Docker, no VM, no bill. |
| GitHub access | **GitHub REST API + a Personal Access Token** | Read repo files, create branches, open draft PRs, poll check runs. One token, no OAuth app to build. |
| Hosting | **Vercel Hobby** | Free for this use, zero-config Next.js deploys, stays up through judging (Dec 15). |
| Database | **None for v1** | Runs are stateless; verdict history lives in `localStorage` in the browser. A database would add cost and ops for zero demo value. (Post-hackathon: add Postgres.) |
| Auth | **None for v1** | Public demo, no user accounts. The GitHub token is the builder's own, stored server-side. |
| Styling | **Tailwind v4 + shadcn/ui** | Same as ZeroGap — the builder knows it. Accessible primitives, no custom component risk. |
| License | **MIT** | Hackathon REQUIRES an open-source license visible at the repo top. MIT is the simplest. |

**Why NOT alternatives (so the builder doesn't "improve" the stack):**
- Not a Docker sandbox on a VM: costs money or free-tier roulette, ops overhead, and CI output is more credible to judges anyway.
- Not LangChain/CrewAI: heavy frameworks for 4 agents with narrow contracts; plain TypeScript functions calling the OpenAI-compatible endpoint are clearer, cheaper (fewer tokens), and easier to debug in 12 days.
- Not a vector DB: the Researcher uses live Tavily search, not retrieval over a stale index. Fresh > stored for bug evidence.
- Not Llama or other models: the hackathon requires NVIDIA open models. Nemotron only.

## 4. Free-tier budget — proof that this costs ₹0

| Service | Free allowance | Our usage | Cost |
|---|---|---|---|
| Nebius Token Factory | Free promotional credits on signup ("Start Free"); hackathon provides additional credits | ~12 days of demo + judging traffic; cheap/fast model for routine calls, strong model only for patch writing; token caps in config | ₹0 — check credit balance in the Nebius dashboard before building; set a zero-spend budget alert on day one |
| Tavily | 1,000 credits/month, no card required | ≤3 basic searches (1 credit each) per bug run; even 100 demo runs = 300 credits | ₹0 |
| GitHub Actions | 2,000 min/month on public repos | ~2–4 min per verification run; 100 runs ≈ 400 min | ₹0 |
| Vercel Hobby | Free | One Next.js app, hobby traffic | ₹0 |
| GitHub API | Free within rate limits | A few dozen calls per run | ₹0 |

**Cost guardrails (the builder wires these on day one):**
1. `maxTokens` caps on every model call (§10) — no unbounded completions.
2. Max 3 Tavily searches per run; basic depth only (1 credit each), never advanced.
3. Poll GitHub Actions with backoff + hard timeout (§10) — no infinite loops.
4. Prefer the fast/cheap Nemotron model everywhere except Triage and Patcher.
5. Nebius dashboard: verify free credits BEFORE the first build; enable budget alert at $0.

## 5. Architecture

```
Browser (Next.js, Vercel)
  │ ① POST /api/runs { repoUrl, bugDescription }
  │◀── 202 { runId } — UI shows live agent timeline
  │
  │ ② orchestrator (server, sequential — NOT parallel)
  │      Triage ──Nemotron strong──▶ { suspectedFiles, failingTests }
  │      Researcher ──Nemotron fast + Tavily──▶ evidence cards (cited)
  │      Patcher ──Nemotron strong──▶ diff → branch verdict/<runId> → draft PR
  │      Verifier ──GitHub API──▶ trigger Actions → poll checks → verdict
  │      (each step writes to runs/{runId} state; UI polls /api/runs/:id)
  │
  │ ③ GET /api/runs/:id → timeline + verdict card data
  │ ④ POST /api/runs/:id/decision { allow: true|false }
  │      allow → merge draft PR (or return patch instructions)
  │      deny  → leave branch, mark run discarded
```

**Folder structure (the builder follows this exactly):**
```
src/
  app/
    page.tsx              # landing + "try the live demo"
    demo/page.tsx         # the app: input → timeline → verdict card
    api/
      runs/route.ts       # POST create run
      runs/[id]/route.ts  # GET run status
      runs/[id]/decision/route.ts  # POST allow/deny
  lib/
    config.ts             # §10 — every number, model ID, limit lives here
    nebius.ts             # Token Factory client (OpenAI-compatible)
    tavily.ts             # Tavily search client
    github.ts             # GitHub API: files, branches, PRs, check runs
    agents/
      triage.ts           # agent 1
      researcher.ts       # agent 2 (Tavily)
      patcher.ts          # agent 3
      verifier.ts         # deterministic, no AI
    verdict.ts            # PROVEN | NOT_PROVEN | ERROR logic (pure functions + tests)
  components/
    RunTimeline.tsx       # live agent steps with reasoning display
    VerdictCard.tsx       # the hero: tests, diff, evidence, Allow/Deny
    EvidenceCard.tsx      # cited Tavily sources
    DiffView.tsx          # unified diff renderer
```

## 6. What PRINCE provides (human checklist — do these BEFORE the builder starts)

- [ ] **Nebius account** → sign up at nebius.com → open Token Factory → confirm free promotional credits visible in billing dashboard → create an API key → copy it. Set a **$0 budget alert** on day one.
- [ ] **Tavily account** → sign up at tavily.com (GitHub OAuth, no card) → dashboard → copy the `tvly-...` key. Free: 1,000 credits/month.
- [ ] **GitHub Personal Access Token (classic)** → github.com → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → Generate → scopes: `repo` and `workflow` → copy it. (Needed to create branches/PRs and read Actions results.)
- [ ] **Fixture repo** `verdict-demo` (public) → create on GitHub → push the 3-bug fixture from §12 → confirm `npm test` fails in Actions on main. This is what every demo and test runs against.
- [ ] **Vercel account** → vercel.com → sign up with GitHub (free Hobby).
- [ ] **Devpost account** → devpost.com → join the hackathon at nebiusglobalaihackathon.devpost.com (click Register).
- [ ] **YouTube account** → for the ≤3-min public demo video (record 28 Oct).
- [ ] Put this SPEC.md in the repo root. Repo must be **public** with an **MIT LICENSE** file at the top level (hackathon requirement).

## 7. Configuration guide (exact env vars — the builder wires these, never hardcodes)

```
# .env.local (never commit; Vercel env vars for deploy)
NEBIUS_API_KEY=            # from Nebius Token Factory dashboard
NEBIUS_BASE_URL=           # copy from Token Factory API docs (OpenAI-compatible endpoint)
NEBIUS_MODEL_STRONG=       # exact model ID from Token Factory playground (reasoning model for Triage/Patcher)
NEBIUS_MODEL_FAST=         # exact model ID from Token Factory playground (cheap model for Researcher/everyday)
TAVILY_API_KEY=tvly-...    # from tavily.com dashboard
GITHUB_TOKEN=ghp_...       # classic PAT with repo + workflow scopes
GITHUB_OWNER=              # your GitHub username (for fixture repo + API calls)
```

**How to pick the model IDs (builder: do this in Phase 1, do not invent IDs):** open the Token Factory playground, list available Nemotron models, choose one strong reasoning model and one fast cheap model, paste both IDs into `.env.local` AND `lib/config.ts`. If a chosen ID 404s, the Phase 1 smoke test will catch it — that is what the smoke test is for.

## 8. Agent contracts (what each agent MUST output — prompts are built around these)

**Triage (Nemotron strong).** Input: repo file tree + bug description. Output JSON: `{ "suspectedFiles": ["src/cart.js"], "failingTests": ["calculates total with discount"], "reproductionNotes": "..." }`. Rules: cite file paths that exist (verify via GitHub API); never invent file names.

**Researcher (Nemotron fast + Tavily).** Input: error message + stack trace. Tavily: up to 3 `search_depth: "basic"` calls. Output JSON: `{ "evidence": [{ "source": "GitHub issue title", "url": "...", "quote": "...", "relevance": "..." }] }`. Rules: every quote must come from a returned Tavily result; include the URL always; no invented sources.

**Patcher (Nemotron strong).** Input: suspected files' content + evidence. Output: unified diff only (no prose). Rules: minimal diff (fewest lines that fix the bug); never rewrite whole files; never touch files outside `suspectedFiles` unless the diff explains why; must keep existing code style.

**Verifier (deterministic, zero AI).** Input: branch name + expected failing tests. Steps: (1) confirm the branch's Actions workflow started; (2) poll check runs with backoff until `completed` or timeout; (3) read the conclusion + map which of the target tests now pass; (4) also confirm no NEW failures vs the base run. Output: `{ "verdict": "PROVEN"|"NOT_PROVEN"|"ERROR", "before": [...], "after": [...], "newFailures": [...] }`.

## 9. UI/UX spec — bold, clean, high contrast

### 9.1 Visual language
A dark, high-contrast developer tool — think a premium code editor, not a pastel landing page. Built for demo video: every state must read clearly on a YouTube thumbnail-sized frame.

**Color tokens (Tailwind v4 `@theme` — the ONLY colors allowed):**
| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#0A0A0B` | App background (near-black) |
| `--color-surface` | `#131316` | Cards |
| `--color-surface-2` | `#1C1C21` | Nested surfaces, code blocks |
| `--color-border` | `#26262B` | Hairlines |
| `--color-text` | `#F4F4F5` | Primary text |
| `--color-muted` | `#A1A1AA` | Secondary text |
| `--color-emerald` | `#10B981` | PASS / proven / allow |
| `--color-red` | `#F43F5E` | FAIL / error / deny |
| `--color-amber` | `#F59E0B` | Thinking / pending / not-proven |
| `--color-blue` | `#38BDF8` | Links, info, Tavily evidence |

**Type:** Lexend (Google Fonts, 400/500/600/700) for UI — one face, sentence case, never uppercase labels. **JetBrains Mono** for code, diffs, test names, and all terminal-style output. Tabular numerals on every count.

**Contrast rule:** body text minimum `#F4F4F5` on `#0A0A0B`; muted text never below `#A1A1AA`; status colors always paired with a text label (never color-alone).

### 9.2 Signature elements (what judges remember)
- **The Verdict Card:** full-width hero. Left: test list flipping red→green with count-up. Right: the diff. Bottom: evidence citations + the Allow/Deny gate. PROVEN = emerald glow border; NOT_PROVEN = amber; ERROR = red.
- **Live agent timeline:** four agent rows (Triage → Researcher → Patcher → Verifier) with status dots, streaming reasoning snippets, and elapsed time. The audience watches the machine think.
- **Evidence cards:** Tavily sources rendered as quote cards with favicon, title, URL, and the exact quoted lines — "receipts," not claims.
- **The gate:** two big buttons — Allow (emerald) / Deny (red outline). The demo's emotional peak.

### 9.3 Copy deck (exact strings)
- Landing H1: **"AI coding assistants lie. I built one that can't."**
- Landing sub: "VERDICT writes the patch, runs your tests in CI, and shows you proof — or admits it couldn't."
- Primary CTA: "Watch it prove a fix" · Secondary: "How it works"
- Demo input labels: "GitHub repo URL" · "Describe the bug"
- Run button: "Run the agents"
- Timeline labels: "Triage — finding the failure" · "Researcher — finding the evidence" · "Patcher — writing the fix" · "Verifier — running the proof"
- Verdict PROVEN headline: **"Proven. Not promised."**
- Verdict NOT_PROVEN headline: "Could not prove fixed."
- Gate question: "Apply this patch to your repo?"
- Footer: "Built with NVIDIA Nemotron on Nebius Token Factory · MIT licensed"

### 9.4 Wireframes

**Screen 0 — Landing (`/`)**
```
┌ TopNav ─────────────────────────────────────────────┐
│ VERDICT   How it works   Demo   GitHub        (Try it) │
├ Hero ───────────────────────────────────────────────┤
│  AI coding assistants lie.                           │
│  I built one that can't.                             │
│  VERDICT writes the patch, runs your tests in CI,    │
│  and shows you proof — or admits it couldn't.        │
│  (Watch it prove a fix)  (How it works)              │
│                              ┌──────────────────┐    │
│                              │ ✓ 3 tests now pass│    │
│                              │ diff +2 −1        │    │
│                              │ [Allow] [Deny]    │    │
│                              └──────────────────┘    │
├ Trust strip ────────────────────────────────────────┤
│  NVIDIA Nemotron · Nebius Token Factory · Tavily · MIT │
├ How it works (4 steps) ─────────────────────────────┤
│  1 Describe the bug → 2 Agents investigate →          │
│  3 Tests run in CI → 4 You see the verdict           │
├ Footer ─────────────────────────────────────────────┤
│  VERDICT · Nebius × NVIDIA Global AI Hackathon 2026  │
└─────────────────────────────────────────────────────┘
```

**Screen 1 — Demo (`/demo`)**
```
[Input card]
  GitHub repo URL [________________________________]
  Describe the bug [________________________________]
  (Run the agents)

[Timeline — appears after Run]
  ● Triage — finding the failure ............ done 12s
  ● Researcher — finding the evidence ........ done 18s
  ● Patcher — writing the fix ............... done 24s
  ◐ Verifier — running the proof ............ running…

[Verdict card — appears on completion]
┌ VERDICT: PROVEN ✓ ────────────────────────────────┐
│ Tests: 3 failed → 3 pass · 0 new failures   (Why?ⓘ)│
│ ┌ Diff ──────────────────────────┐ ┌ Evidence ───┐ │
│ │ - total = price * qty          │ │ "Issue #412:│ │
│ │ + total = price * qty * (1-d)  │ │  discount…" │ │
│ └────────────────────────────────┘ │ tavily src  │ │
│                                    └─────────────┘ │
│  Apply this patch to your repo?                    │
│  [Allow]  [Deny]                                    │
└─────────────────────────────────────────────────────┘
```

### 9.5 State inventory
| Screen | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Demo input | — | hint text + "try the fixture repo" button | — | — |
| Timeline | per-agent spinners + elapsed timers | — | agent row turns red with reason + retry | all four green |
| Verdict | skeleton card | — | red card with cause + "what to do" | verdict card |
| Gate | button spinner on Allow | — | merge failure → show copy-paste patch | "Patch applied ✓" + PR link |

## 10. Config rules (Prince's standing law)

`lib/config.ts` — **every** number, model ID, limit, and timeout lives here, documented, overridable:

```ts
export const CONFIG = {
  nebius: {
    modelStrong: process.env.NEBIUS_MODEL_STRONG!,  // Triage + Patcher (reasoning)
    modelFast: process.env.NEBIUS_MODEL_FAST!,      // Researcher + everyday (cheap)
    maxTokensStrong: 4000,
    maxTokensFast: 1500,
    temperature: 0.2,            // low: we want precise code, not creativity
    requestTimeoutMs: 60000,
  },
  tavily: {
    maxSearchesPerRun: 3,
    searchDepth: 'basic' as const,  // 1 credit each; never 'advanced'
    maxResults: 5,
  },
  github: {
    branchPrefix: 'verdict/',
    pollIntervalMs: 15000,
    pollTimeoutMs: 600000,       // 10 min max per verification
    tokenScopes: ['repo', 'workflow'],
  },
  pipeline: {
    runTimeoutMs: 900000,        // 15 min max per full run
    maxDiffLines: 200,           // refuse patches bigger than this (send back to Patcher once)
  },
  ui: { pageSize: 50, toastDurationMs: 4000 },
} as const;
```
No hardcoded numbers anywhere else. No invented model IDs — they come from env, verified in Phase 1.

## 11. Build phases — EXACT prompts to paste into Codex/Antigravity (ONE per message, in order)

**Phase 1 — Skeleton + landing + Nemotron smoke test.** Paste:
> Read SPEC.md in the project root. Implement ONLY Phase 1: Next.js 15 App Router + TypeScript + Tailwind v4 + shadcn/ui setup. Build the design tokens from §9.1 as Tailwind v4 @theme variables, and Screen 0 (Landing page) exactly per the §9.4 wireframe using the §9.3 copy deck (Lexend for UI). Create lib/config.ts (§10) and lib/nebius.ts (OpenAI-compatible client using NEBIUS_API_KEY + NEBIUS_BASE_URL from env). Add a hidden smoke-test route GET /api/smoke that calls NEBIUS_MODEL_FAST with "Reply with the word OK" and returns the model reply + latency ms. Read the model IDs from env — do NOT invent them; if a call 404s, report the exact error and stop. Add MIT LICENSE at repo root. Mobile-responsive. Run npm run build until clean and show the browser preview. Do not start any other phase.

*Done = landing matches wireframe; /api/smoke returns OK with latency; build clean. What to expect: a stunning dark landing page and proof the Nemotron connection works.*

**Phase 2 — Triage agent.** Paste:
> Phase 1 is done. Implement ONLY Phase 2 per SPEC.md: lib/github.ts (read repo file tree + file contents via GitHub REST API using GITHUB_TOKEN), lib/agents/triage.ts implementing the Triage contract from §8 (Nemotron strong model, JSON output, cited file paths verified to exist), and POST /api/runs that accepts { repoUrl, bugDescription } and returns { runId } with run state stored in memory. Add the demo input card from Screen 1 wireframe (§9.4) posting to this route. No other agents yet — after Triage completes, the run ends with the triage output shown as JSON. npm run build clean. Do not build Researcher/Patcher/Verifier.

*Done = paste repo URL + bug → see triage JSON with real file paths. What to expect: the machine correctly locating the buggy file.*

**Phase 3 — Researcher agent + Tavily.** Paste:
> Phase 2 is done. Implement ONLY Phase 3 per SPEC.md: lib/tavily.ts client (TAVILY_API_KEY), lib/agents/researcher.ts implementing the Researcher contract from §8 (max 3 basic searches, cited evidence with URLs, no invented sources), and the EvidenceCard component (§9.2/9.4) rendering each source as a quote card. Wire it into the run pipeline after Triage: Triage → Researcher, then run ends showing evidence cards. Respect CONFIG.tavily limits exactly. npm run build clean. Do not build Patcher/Verifier.

*Done = run shows 2–4 cited evidence cards with real URLs about the exact error. What to expect: the agent finding the actual upstream issue.*

**Phase 4 — Patcher agent + branch + draft PR.** Paste:
> Phase 3 is done. Implement ONLY Phase 4 per SPEC.md: lib/agents/patcher.ts implementing the Patcher contract from §8 (unified diff only, minimal lines, never touches the default branch), plus GitHub write operations in lib/github.ts: create branch `verdict/<runId>`, commit the patch, open a DRAFT pull request. Wire into pipeline: Triage → Researcher → Patcher, then run ends showing the diff in the DiffView component (§9.4). Enforce CONFIG.pipeline.maxDiffLines. npm run build clean. Do not build the Verifier.

*Done = run ends with a real draft PR link on GitHub containing the patch. What to expect: a genuine PR you can open and read.*

**Phase 5 — Verifier + verdict card.** Paste:
> Phase 4 is done. Implement ONLY Phase 5 per SPEC.md: lib/agents/verifier.ts — the DETERMINISTIC verifier with zero AI. It polls the GitHub Actions check runs for the patch branch (backoff per CONFIG.github), reads conclusions, compares failing-before vs passing-after, and flags new failures. Implement lib/verdict.ts as pure functions (PROVEN | NOT_PROVEN | ERROR) with unit tests. Build the VerdictCard component exactly per §9.4 (test list flipping red→green, diff, evidence, Why? popovers). Wire the full pipeline end-to-end. npm run build clean. Do not build the Allow/Deny gate yet.

*Done = full run on the fixture repo produces a verdict card with real CI results. What to expect: the "Proven. Not promised." moment.*

**Phase 6 — Allow/Deny gate + honest states.** Paste:
> Phase 5 is done. Implement ONLY Phase 6 per SPEC.md: POST /api/runs/[id]/decision implementing §2 step ⑦ (Allow → merge the draft PR, or return copy-paste patch instructions on failure; Deny → mark discarded, keep branch). Build the gate UI from §9.4 (big Allow/Deny buttons — the demo's emotional peak). Implement the NOT_PROVEN amber card ("Could not prove fixed." — partial results shown, no false claim, Deny only) and the ERROR red card (cause + what-to-do). Add the RunTimeline component (§9.2) showing all four agents with live status + elapsed time + reasoning snippets. Apply the §9.5 state inventory to every screen. npm run build clean.

*Done = complete product: run → timeline → verdict card → gate → applied or honestly refused. What to expect: the full demo flow from the video script.*

**Phase 7 — Polish, docs, deploy, submission.** Paste:
> Phase 6 is done. Implement ONLY Phase 7 per SPEC.md: (1) the §9.5 state inventory verified on every screen — no dead ends, no silent failures; (2) README.md with: what VERDICT is, the 4-agent pipeline, setup instructions (env vars from §7), how to run the fixture demo, architecture summary, and the required lines highlighting NVIDIA Nemotron + Nebius Token Factory + Tavily usage; (3) verify MIT LICENSE at repo root and visible; (4) deploy to Vercel Hobby (free) from the public repo; (5) run the FULL e2e test from §12 against the live deployment and fix any failure; (6) produce the submission checklist from §14 marked done. npm run build clean. Nothing after this phase without approval.

*Done = public URL live, README complete, e2e green, submission checklist done. What to expect: a shippable hackathon entry.*

**Phase-gate rule:** No phase starts until the previous one demos in the browser. If the builder says "done" but the screen doesn't match the §9.4 wireframe or the contract in §2/§8, send it back quoting the exact section.

## 12. Testing plan (how to know it works)

**The fixture repo** (`verdict-demo`, public, JS): `src/cart.js` with THREE planted bugs, each covered by a failing test in `test/cart.test.js`:
1. Off-by-one: discount applied to `qty - 1` items instead of `qty`.
2. Null handling: crashes when a cart item has no price.
3. Wrong operator: `+` instead of `*` in tax calculation.
Plus ONE unfixable case: a test that fails due to a missing environment variable (no code fix exists) — this MUST produce the honest NOT_PROVEN card.

**Per-phase tests:** Phase 1: `/api/smoke` returns OK. Phase 2: triage finds the right file for bug #1. Phase 3: evidence cards cite real URLs. Phase 4: draft PR exists with a minimal diff. Phase 5: verdict card shows PROVEN for bugs 1–3 on the live deployment.

**Full e2e (Phase 7, must pass before submission):** run all 4 fixture cases end-to-end on the deployed URL. Expect: 3× PROVEN with correct diffs, 1× NOT_PROVEN (the unfixable one — the honesty test). Any false "fixed" claim = build fails, do not submit.

**Unit tests (builder writes these):** `lib/verdict.ts` pure functions — PROVEN/NOT_PROVEN/ERROR transitions, new-failure detection, timeout handling.

## 13. Hosting and deploy (all free)

1. Push the public `verdict` repo to GitHub (MIT LICENSE at root — required).
2. Vercel → New Project → import `verdict` → add the 7 env vars from §7 → Deploy (Hobby, free).
3. The demo URL must stay live through **15 Dec 2026** (judging window) — do not delete or rename the deployment.
4. Custom domain not needed. The Vercel URL is the "working demo" for Devpost.

## 14. Devpost submission checklist (do this 29 Oct evening, never the last hour)

- [ ] Track selected: **Coding and Agentic Engineering**
- [ ] Project description: what it is, why (the inversion), how the 4 agents + sandbox work
- [ ] Working demo URL (Vercel link, live)
- [ ] Demo video: **≤3 min, public YouTube** — follow the beat sheet in §15
- [ ] Public repo URL with **MIT LICENSE visible at top** + README with setup instructions
- [ ] README highlights: NVIDIA Nemotron via Nebius Token Factory (models used, where), Tavily usage (the runtime call), GitHub Actions verification
- [ ] Feedback section: notes on Token Factory, Nemotron, Tavily (required field — write honestly from build experience)
- [ ] If anything predates 26 Aug 2026: not applicable (all code fresh) — no disclosure needed

## 15. Demo video beat sheet (≤3 min — this is ALSO your YouTube video)

- **0:00–0:15 — Hook:** "AI coding assistants lie to you. I built one that can't." Show a famous AI confidently presenting a broken fix.
- **0:15–0:45 — The bug:** paste the repo URL, describe the bug, press Run. Timeline lights up.
- **0:45–1:30 — The investigation:** Triage finds the file; Researcher pulls the real upstream issue via Tavily (show the citation cards — "receipts").
- **1:30–2:15 — The proof:** Patcher opens the draft PR; Verifier runs CI; the verdict card flips red→green. "Proven. Not promised."
- **2:15–2:45 — The honest case:** run the unfixable bug. Amber card: "Could not prove fixed." This is the moment people remember.
- **2:45–3:00 — The gate + close:** Allow/Deny. "Don't trust the agent. Verify it." End card with repo link.

## 16. 12-day calendar (build starts 19 Oct, after the Builder Cup)

| Dates | Work |
|---|---|
| 19 Oct | Phase 0 (human setup from §6) + Phase 1 prompt |
| 20–21 Oct | Phase 1 → 2 |
| 22 Oct | Phase 3 |
| 23–24 Oct | Phase 4 |
| 25 Oct | Phase 5 |
| 26 Oct | Phase 6 |
| 27 Oct | Phase 7 polish + e2e |
| 28 Oct | Record demo video (§15) |
| 29 Oct | Submit on Devpost (evening) |
| 30 Oct | Buffer — no new work, only fixes if submission needs it |

**Kill risks (watch these):** (1) Nebius free credits run out → the §4 guardrails + cheap-model default prevent this; if worried, reduce demo runs. (2) GitHub Actions queue slow → poll timeout handles it; the demo uses the fixture repo with a 2-min test suite. (3) Model IDs wrong → Phase 1 smoke test catches it on day one. (4) Builder tries a framework (LangChain etc.) → §3 forbids it; send back with the section quoted.
