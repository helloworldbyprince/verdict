import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="VERDICT home">
      <span className="grid size-8 place-items-center rounded-[9px] border border-emerald/40 bg-emerald/10 text-sm font-bold text-emerald shadow-[0_0_18px_rgba(16,185,129,.16)]">V</span>
      <span className="text-[15px] font-semibold tracking-[-.02em]">VERDICT</span>
    </Link>
  );
}
