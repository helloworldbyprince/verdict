"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Braces, Github, Info, LoaderCircle, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { RunTimeline } from "@/components/RunTimeline";
import { VerdictCard } from "@/components/VerdictCard";
import { CONFIG } from "@/lib/config";
import type { RunState } from "@/lib/types";

const fixture = { repoUrl: "https://github.com/prince/verdict-demo", bugDescription: "Discount is applied to qty - 1 items, so the final item in every cart line is charged at full price." };
const honestyFixture = { repoUrl: "https://github.com/prince/verdict-demo", bugDescription: "The test fails because PAYMENT_API_KEY is missing from the environment. Prove whether a code patch can fix it." };

export default function DemoPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [run, setRun] = useState<RunState | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(pollRef.current), []);
  async function poll(id: string) {
    const response = await fetch(`/api/runs/${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not read the run state.");
    const next = await response.json() as RunState;
    setRun(next);
    if (["complete", "error", "applied", "denied"].includes(next.status)) window.clearInterval(pollRef.current);
  }
  async function submit(event?: FormEvent, forceDemo = false) {
    event?.preventDefault(); setError(""); setStarting(true); setRun(null); window.clearInterval(pollRef.current);
    try {
      const response = await fetch("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ repoUrl, bugDescription, demo: forceDemo }) });
      const data = await response.json() as { runId?: string; error?: string };
      if (!response.ok || !data.runId) throw new Error(data.error ?? "Could not start the run.");
      await poll(data.runId);
      pollRef.current = window.setInterval(() => void poll(data.runId!), CONFIG.ui.pollingMs);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong."); }
    finally { setStarting(false); }
  }
  function loadFixture(honesty = false) { const selected = honesty ? honestyFixture : fixture; setRepoUrl(selected.repoUrl); setBugDescription(selected.bugDescription); }
  async function decide(allow: boolean) {
    if (!run) return;
    const response = await fetch(`/api/runs/${run.id}/decision`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ allow }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error ?? "The decision could not be completed."); return; }
    await poll(run.id);
  }
  const isRunning = run?.status === "running";

  return (
    <main className="min-h-screen pb-24">
      <header className="border-b border-border bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-[1240px] items-center justify-between px-5 sm:px-8"><Logo /><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"><ArrowLeft className="size-4" /> Back to overview</Link></div>
      </header>
      <div className="mx-auto max-w-[1100px] px-5 pt-14 sm:px-8 sm:pt-20">
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><div className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-emerald"><span className="size-1.5 rounded-full bg-emerald shadow-[0_0_10px_#10B981]" /> Live proof workspace</div><h1 className="text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Put the agent<br /><span className="text-muted">on trial.</span></h1></div>
          <p className="max-w-sm text-sm leading-6 text-muted">One repo. One concrete bug. Four narrow agents—and a deterministic CI verdict at the end.</p>
        </div>

        {!run && <section className="animate-enter overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7"><div className="flex items-center gap-2 text-sm font-semibold"><Braces className="size-4 text-emerald" /> Start a verification run</div><span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] text-muted">Public JS / TS repos</span></div>
          <form onSubmit={(event) => submit(event)} className="space-y-6 p-5 sm:p-7">
            <div><label htmlFor="repo" className="mb-2.5 block text-sm font-medium">GitHub repo URL</label><div className="relative"><Github className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" /><input id="repo" type="url" required value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/you/your-repo" className="h-13 w-full rounded-xl border border-border bg-bg pl-11 pr-4 text-sm outline-none transition placeholder:text-muted/45 focus:border-emerald/50 focus:ring-4 focus:ring-emerald/[.06]" /></div></div>
            <div><div className="mb-2.5 flex items-center justify-between"><label htmlFor="bug" className="text-sm font-medium">Describe the bug</label><span className="text-[10px] text-muted">Be specific. Include the error if you have it.</span></div><textarea id="bug" required value={bugDescription} onChange={(event) => setBugDescription(event.target.value)} placeholder="The cart applies the discount to every item except the last one…" rows={5} className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-muted/45 focus:border-emerald/50 focus:ring-4 focus:ring-emerald/[.06]" /></div>
            {error && <div role="alert" className="rounded-lg border border-red/30 bg-red/[.06] px-4 py-3 text-sm text-red">{error}</div>}
            <div className="flex flex-col-reverse justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center"><div className="flex flex-wrap gap-4"><button type="button" onClick={() => loadFixture(false)} className="inline-flex items-center gap-2 self-start text-xs text-blue hover:underline"><Play className="size-3.5 fill-current" /> Try the fixture repo</button><button type="button" onClick={() => loadFixture(true)} className="inline-flex items-center gap-2 self-start text-xs text-amber hover:underline"><Info className="size-3.5" /> Try the honesty case</button></div><button disabled={starting} className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-emerald px-6 text-sm font-semibold text-bg transition hover:bg-[#35d39c] disabled:cursor-not-allowed disabled:opacity-60">{starting ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Run the agents <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button></div>
          </form>
          <div className="flex items-start gap-3 border-t border-border bg-blue/[.035] px-5 py-4 text-xs leading-5 text-muted sm:px-7"><Info className="mt-0.5 size-3.5 shrink-0 text-blue" /><span>No credentials yet? The interface automatically runs in showcase mode with representative agent outputs. Add the keys from <code className="mono text-text">.env.example</code> to switch on the live pipeline.</span></div>
        </section>}

        {run && <div className="space-y-7">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-mono text-xs text-muted"><span className={`size-2 rounded-full ${isRunning ? "animate-pulse bg-amber" : "bg-emerald"}`} /> Run {run.id} · {run.mode === "demo" ? "showcase" : "live"}</div>{!isRunning && <button onClick={() => { setRun(null); setError(""); }} className="inline-flex items-center gap-2 text-xs text-muted hover:text-text"><RotateCcw className="size-3.5" /> New run</button>}</div>
          <RunTimeline steps={run.steps} />
          {(run.status === "complete" || run.status === "error" || run.status === "applied" || run.status === "denied") && run.verification && <VerdictCard run={run} onDecision={decide} />}
          {isRunning && <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted"><LoaderCircle className="size-3.5 animate-spin text-amber" /> Keep this tab open while the agents assemble the proof.</div>}
          {error && <div role="alert" className="rounded-lg border border-red/30 bg-red/[.06] px-4 py-3 text-sm text-red">{error}</div>}
        </div>}
      </div>
    </main>
  );
}
