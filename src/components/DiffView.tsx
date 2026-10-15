import { FileCode2 } from "lucide-react";

export function DiffView({ diff }: { diff: string }) {
  const lines = diff.split("\n");
  const file = lines.find((line) => line.startsWith("+++ b/"))?.replace("+++ b/", "") ?? "patch.diff";
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg">
      <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3"><span className="flex items-center gap-2 text-xs text-muted"><FileCode2 className="size-3.5" /> {file}</span><span className="mono text-[10px]"><span className="text-emerald">+{lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length}</span> <span className="ml-1 text-red">−{lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length}</span></span></div>
      <pre className="max-h-[420px] overflow-auto py-3 font-mono text-[11px] leading-6 sm:text-xs">
        {lines.map((line, index) => {
          const add = line.startsWith("+") && !line.startsWith("+++");
          const remove = line.startsWith("-") && !line.startsWith("---");
          const meta = line.startsWith("@@") || line.startsWith("diff ") || line.startsWith("index ") || line.startsWith("---") || line.startsWith("+++");
          return <code key={index} className={`block min-w-max px-4 ${add ? "bg-emerald/[.09] text-emerald" : remove ? "bg-red/[.09] text-red" : meta ? "text-blue" : "text-muted"}`}><span className="mr-4 inline-block w-6 select-none text-right text-muted/40">{index + 1}</span>{line || " "}</code>;
        })}
      </pre>
    </div>
  );
}
