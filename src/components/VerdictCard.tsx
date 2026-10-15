"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, CircleHelp, ExternalLink, GitMerge, LoaderCircle, ShieldCheck, X } from "lucide-react";
import type { RunState } from "@/lib/types";
import { DiffView } from "./DiffView";
import { EvidenceCard } from "./EvidenceCard";

export function VerdictCard({ run, onDecision }: { run: RunState; onDecision: (allow: boolean) => Promise<void> }) {
  const [pending, setPending] = useState<"allow" | "deny" | null>(null);
  const verdict = run.verification?.verdict ?? "ERROR";
  const proven = verdict === "PROVEN";
  const failed = verdict === "ERROR";
  const applied = run.status === "applied";
  const denied = run.status === "denied";
  async function decide(allow: boolean) { setPending(allow ? "allow" : "deny"); try { await onDecision(allow); } finally { setPending(null); } }

  return (
    <section className={`animate-enter overflow-hidden rounded-2xl border bg-surface shadow-2xl ${proven ? "border-emerald/40 shadow-emerald/[.05]" : failed ? "border-red/40 shadow-red/[.05]" : "border-amber/40 shadow-amber/[.05]"}`}>
      <div className={`h-1 w-full ${proven ? "bg-emerald" : failed ? "bg-red" : "bg-amber"}`} />
      <div className="border-b border-border px-5 py-6 sm:px-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className={`grid size-12 shrink-0 place-items-center rounded-full ${proven ? "bg-emerald text-bg" : failed ? "bg-red text-bg" : "bg-amber text-bg"}`}>{proven ? <Check className="size-6 stroke-[3]" /> : failed ? <X className="size-6 stroke-[3]" /> : <AlertTriangle className="size-6 stroke-[2.5]" />}</span>
            <div><p className={`text-xs font-semibold ${proven ? "text-emerald" : failed ? "text-red" : "text-amber"}`}>Verdict: {verdict.toLowerCase().replace("_", " ")}</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">{proven ? "Proven. Not promised." : failed ? "Verification stopped." : "Could not prove fixed."}</h2></div>
          </div>
          {run.prUrl && <a href={run.prUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted transition hover:text-text">Draft PR #{run.prNumber} <ExternalLink className="size-3.5" /></a>}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-lg border border-border bg-surface-2 px-3 py-2"><span className="text-red">{run.verification?.before.length ?? 0} failed</span><span className="mx-2 text-muted">→</span><span className={proven ? "text-emerald" : "text-muted"}>{run.verification?.after.length ?? 0} pass</span></span>
          <span className={`rounded-lg border px-3 py-2 ${run.verification?.newFailures.length ? "border-red/30 bg-red/10 text-red" : "border-emerald/20 bg-emerald/[.07] text-emerald"}`}>{run.verification?.newFailures.length ?? 0} new failures</span>
          <details className="relative"><summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-muted hover:text-text"><CircleHelp className="size-3.5" /> Why? <ChevronDown className="size-3" /></summary><div className="absolute left-0 top-7 z-20 w-72 rounded-lg border border-border bg-surface-2 p-3 text-xs leading-5 text-muted shadow-xl">The verdict is determined by GitHub Actions. AI proposes the patch but cannot mark its own work as fixed.</div></details>
        </div>
      </div>

      {(run.diff || run.evidence?.length) && <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.55fr_.8fr]">
        <div><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Exact patch</h3><span className="mono text-[10px] text-muted">{run.branch}</span></div>{run.diff && <DiffView diff={run.diff} />}</div>
        <div><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Cited evidence</h3><span className="text-[10px] text-blue">Powered by Tavily</span></div><div className="grid gap-3">{run.evidence?.map((item, index) => <EvidenceCard key={item.url} evidence={item} index={index} />)}</div></div>
      </div>}

      {failed && <div className="mx-5 mb-6 rounded-xl border border-red/30 bg-red/[.06] p-4 text-sm text-red sm:mx-7"><p className="font-medium">What happened</p><p className="mt-1 leading-6 text-muted">{run.verification?.error ?? run.error ?? "The verifier could not obtain deterministic CI evidence."}</p></div>}
      {!proven && !failed && <div className="mx-5 mb-6 rounded-xl border border-amber/30 bg-amber/[.06] p-4 text-sm text-amber sm:mx-7"><p className="font-medium">The patch remains available for inspection.</p><p className="mt-1 leading-6 text-muted">At least one target test still fails or a new regression appeared. VERDICT will not offer an Allow action without proof.</p></div>}

      <div className="border-t border-border bg-bg/40 px-5 py-6 sm:px-7">
        {applied ? <div className="flex items-center gap-3 text-emerald"><span className="grid size-9 place-items-center rounded-full bg-emerald/10"><GitMerge className="size-4" /></span><div><p className="text-sm font-semibold">Patch applied ✓</p><p className="mt-0.5 text-xs text-muted">Your approval was logged. The verified pull request has been merged.</p></div></div>
        : denied ? <div className="flex items-center gap-3 text-muted"><span className="grid size-9 place-items-center rounded-full bg-surface-2"><X className="size-4" /></span><div><p className="text-sm font-semibold text-text">Patch denied</p><p className="mt-0.5 text-xs">Nothing was merged. The branch is retained for audit.</p></div></div>
        : <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-base font-semibold">{proven ? "Apply this patch to your repo?" : "No unproven patch will be applied."}</p><p className="mt-1 text-xs text-muted">Nothing changes until you decide. The audit branch is always retained.</p></div><div className="flex gap-3">{proven && <button onClick={() => decide(true)} disabled={!!pending} className="inline-flex h-12 min-w-32 items-center justify-center gap-2 rounded-xl bg-emerald px-5 text-sm font-semibold text-bg transition hover:bg-[#35d39c] disabled:opacity-60">{pending === "allow" ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Allow</button>}<button onClick={() => decide(false)} disabled={!!pending} className="inline-flex h-12 min-w-32 items-center justify-center gap-2 rounded-xl border border-red/50 px-5 text-sm font-semibold text-red transition hover:bg-red/10 disabled:opacity-60">{pending === "deny" ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />} Deny</button></div></div>}
      </div>
    </section>
  );
}
