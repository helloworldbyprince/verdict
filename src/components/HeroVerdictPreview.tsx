import { Check, GitBranch, ShieldCheck } from "lucide-react";

export function HeroVerdictPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[510px] lg:ml-auto">
      <div className="absolute -inset-10 rounded-full bg-emerald/[.07] blur-3xl" />
      <div className="glow-line relative overflow-hidden rounded-2xl border border-emerald/35 bg-surface/95 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="animate-pulse-ring grid size-7 place-items-center rounded-full bg-emerald text-bg"><Check className="size-4 stroke-[3]" /></span>
            <span className="text-sm font-semibold">Verdict: proven</span>
          </div>
          <span className="mono text-xs text-muted">run_8fa2</span>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-sm text-muted">Tests</p><p className="mt-1 text-2xl font-semibold tracking-[-.04em]">3 failed <span className="text-muted">→</span> <span className="text-emerald">3 pass</span></p></div>
            <span className="rounded-full border border-emerald/25 bg-emerald/10 px-3 py-1.5 text-xs font-medium text-emerald">0 new failures</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-bg font-mono text-[12px] leading-6">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-muted"><span>src/cart.js</span><span>+2 −1</span></div>
            <div className="px-4 py-3">
              <p className="text-red/90"><span className="mr-3 text-muted">12</span>- total = price * (qty - 1)</p>
              <p className="-mx-4 bg-emerald/[.08] px-4 text-emerald"><span className="mr-3 text-muted">12</span>+ total = price * qty</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted"><GitBranch className="size-3.5" /> verdict/8fa2 · Draft PR #14 <span className="ml-auto inline-flex items-center gap-1.5 text-emerald"><ShieldCheck className="size-4" /> CI verified</span></div>
          <div className="border-t border-border pt-5">
            <p className="mb-3 text-sm font-medium">Apply this patch to your repo?</p>
            <div className="grid grid-cols-2 gap-3"><span className="grid h-11 place-items-center rounded-lg bg-emerald text-sm font-semibold text-bg">Allow</span><span className="grid h-11 place-items-center rounded-lg border border-red/50 text-sm font-semibold text-red">Deny</span></div>
          </div>
        </div>
      </div>
      <div className="absolute -right-3 -top-3 hidden rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[10px] text-muted shadow-xl sm:block">proof, not promises</div>
    </div>
  );
}
