import Link from "next/link";
import { ArrowRight, Check, GitPullRequest, Microscope, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { HeroVerdictPreview } from "@/components/HeroVerdictPreview";
import { SiteNav } from "@/components/SiteNav";

const steps = [
  { n: "01", icon: Microscope, title: "Describe the failure", body: "Paste a public GitHub repo and tell VERDICT what broke. No vague chat prompt — a concrete bug." },
  { n: "02", icon: Search, title: "Agents investigate", body: "Triage locates the failure. Research finds cited upstream evidence. The patcher proposes a minimal diff." },
  { n: "03", icon: GitPullRequest, title: "CI runs the proof", body: "The patch lands on an isolated branch. GitHub Actions — not an AI — decides whether the tests pass." },
  { n: "04", icon: ShieldCheck, title: "You get the verdict", body: "See the diff, citations, before-and-after tests, and regressions. Then you choose Allow or Deny." },
];

export default function Home() {
  return (
    <main>
      <SiteNav />
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-bg absolute inset-0" />
        <div className="relative mx-auto grid min-h-[730px] max-w-[1240px] items-center gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:py-28">
          <div className="max-w-[710px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-2 text-xs text-muted"><Sparkles className="size-3.5 text-emerald" /> Four agents. One deterministic verdict.</div>
            <h1 className="text-balance text-[clamp(3.5rem,7.2vw,6.9rem)] font-semibold leading-[.91] tracking-[-.07em]">AI coding assistants <span className="text-muted">lie.</span><br />I built one that <span className="text-emerald">can&apos;t.</span></h1>
            <p className="mt-8 max-w-[640px] text-balance text-lg leading-8 text-muted sm:text-xl">VERDICT writes the patch, runs your tests in CI, and shows you proof — or admits it couldn&apos;t.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-emerald px-6 text-sm font-semibold text-bg transition hover:bg-[#35d39c] focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-2 focus:ring-offset-bg">Watch it prove a fix <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
              <a href="#how" className="inline-flex h-13 items-center justify-center rounded-xl border border-border bg-surface/70 px-6 text-sm font-semibold transition hover:border-muted/60 hover:bg-surface-2">How it works</a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted"><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald" /> Never touches main</span><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald" /> Every claim cited</span><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald" /> Human approval required</span></div>
          </div>
          <HeroVerdictPreview />
        </div>
      </section>

      <section className="border-b border-border bg-surface/35">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 py-7 text-sm font-medium text-muted sm:px-8 lg:justify-between"><span className="text-xs text-muted/70">Powered by</span><span>NVIDIA Nemotron</span><span>Nebius Token Factory</span><span className="text-blue">Tavily</span><span>GitHub Actions</span><span>MIT licensed</span></div>
      </section>

      <section id="how" className="mx-auto max-w-[1240px] px-5 py-28 sm:px-8 lg:py-36">
        <div className="max-w-3xl"><p className="mb-4 text-sm font-medium text-emerald">The proof pipeline</p><h2 className="text-balance text-4xl font-semibold leading-tight tracking-[-.045em] sm:text-6xl">The model proposes.<br /><span className="text-muted">The sandbox disposes.</span></h2><p className="mt-6 max-w-2xl text-lg leading-8 text-muted">VERDICT treats AI as one untrusted component inside a system of hard evidence. A confident answer is never enough.</p></div>
        <div className="mt-16 grid overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ n, icon: Icon, title, body }) => <article key={n} className="group relative min-h-72 bg-surface p-7 transition hover:bg-surface-2"><div className="flex items-center justify-between"><span className="mono text-xs text-muted">{n}</span><Icon className="size-5 text-muted transition group-hover:text-emerald" /></div><h3 className="mt-20 text-xl font-semibold tracking-[-.03em]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted">{body}</p></article>)}
        </div>
      </section>

      <section className="border-y border-border bg-surface/45">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center"><div><p className="text-sm font-medium text-emerald">Ready for a verdict?</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Don&apos;t trust the agent. Verify it.</h2></div><Link href="/demo" className="group inline-flex h-13 items-center gap-2 rounded-xl bg-text px-6 text-sm font-semibold text-bg transition hover:bg-emerald">Run the agents <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div>
      </section>
      <Footer />
    </main>
  );
}
