import { ArrowUpRight, Link2 } from "lucide-react";
import type { Evidence } from "@/lib/types";

export function EvidenceCard({ evidence, index }: { evidence: Evidence; index: number }) {
  let domain = evidence.url;
  try { domain = new URL(evidence.url).hostname.replace(/^www\./, ""); } catch {}
  return (
    <a href={evidence.url} target="_blank" rel="noreferrer" className="group block rounded-xl border border-border bg-surface-2 p-4 transition hover:border-blue/40 hover:bg-[#202027] focus:outline-none focus:ring-2 focus:ring-blue">
      <div className="flex items-center justify-between gap-4"><span className="inline-flex items-center gap-2 text-[11px] font-medium text-blue"><Link2 className="size-3.5" /> Source {String(index + 1).padStart(2, "0")}</span><ArrowUpRight className="size-3.5 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue" /></div>
      <h4 className="mt-3 line-clamp-2 text-sm font-medium leading-5">{evidence.source}</h4>
      <blockquote className="mt-3 line-clamp-3 border-l border-blue/50 pl-3 text-xs leading-5 text-muted">“{evidence.quote}”</blockquote>
      <p className="mt-3 truncate font-mono text-[10px] text-blue/80">{domain}</p>
    </a>
  );
}
