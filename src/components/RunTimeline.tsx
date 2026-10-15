"use client";

import { useEffect, useState } from "react";
import { Check, Circle, LoaderCircle, Search, Sparkles, Wrench, X } from "lucide-react";
import type { RunStep, StepKey } from "@/lib/types";

const icons: Record<StepKey, typeof Search> = { triage: Search, research: Sparkles, patch: Wrench, verify: Check };

function elapsed(step: RunStep, now: number) {
  if (!step.startedAt) return "";
  return `${Math.max(1, Math.round(((step.completedAt ?? now) - step.startedAt) / 1000))}s`;
}

export function RunTimeline({ steps }: { steps: RunStep[] }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const completed = steps.filter((step) => step.status === "done").length;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20" aria-label="Agent progress">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
        <div><p className="text-sm font-semibold">Agent timeline</p><p className="mt-1 text-xs text-muted">Sequential by design. Every output feeds the next stage.</p></div>
        <span className="mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[11px] text-muted">{completed}/4 complete</span>
      </div>
      <div className="divide-y divide-border">
        {steps.map((step, index) => {
          const Icon = icons[step.key];
          const active = step.status === "running";
          return (
            <div key={step.key} className={`relative grid grid-cols-[42px_1fr_auto] items-center gap-3 px-5 py-5 transition-colors sm:px-6 ${active ? "bg-amber/[.035]" : ""}`}>
              {index < steps.length - 1 && <span className="absolute left-[41px] top-[49px] h-[calc(100%-26px)] w-px bg-border sm:left-[45px]" />}
              <span className={`relative z-10 grid size-9 place-items-center rounded-full border ${step.status === "done" ? "border-emerald/40 bg-emerald/10 text-emerald" : step.status === "error" ? "border-red/40 bg-red/10 text-red" : active ? "border-amber/40 bg-amber/10 text-amber" : "border-border bg-surface-2 text-muted"}`}>
                {active ? <LoaderCircle className="size-4 animate-spin" /> : step.status === "done" ? <Check className="size-4 stroke-[2.5]" /> : step.status === "error" ? <X className="size-4" /> : <Icon className="size-4" />}
              </span>
              <div className="min-w-0"><p className={`text-sm font-medium ${active ? "text-text" : step.status === "waiting" ? "text-muted" : ""}`}>{step.label}</p><p className={`mt-1 truncate text-xs ${step.status === "error" ? "text-red" : "text-muted"}`}>{step.detail}</p></div>
              <div className="flex min-w-14 items-center justify-end gap-2"><span className={`hidden text-xs sm:inline ${step.status === "done" ? "text-emerald" : step.status === "error" ? "text-red" : active ? "text-amber" : "text-muted"}`}>{step.status}</span>{step.startedAt ? <span className="mono text-[11px] text-muted">{elapsed(step, now)}</span> : <Circle className="size-2 fill-muted/40 text-transparent" />}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
